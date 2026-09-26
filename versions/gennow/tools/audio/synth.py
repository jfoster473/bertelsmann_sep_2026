#!/usr/bin/env python3
"""
synth.py – original music + paper sound effects + mastering, all synthesised.

  python3 tools/audio/synth.py            # reads project/assets/audio/cues.json

Writes to project/assets/audio/:
  music.wav   music stem (as mixed)          sfx.wav   SFX stem (as mixed)
  mix.wav     mastered mix (-14 LUFS, TP <= -1 dBTP)   mix.mp3 (player)
  master_report.json

Everything is generated from code with a seeded RNG: no samples, no third-party
audio. Music: 120 BPM, C major, Karplus-Strong ukulele, marimba, bass, claps,
shaker, glockenspiel. SFX: procedural paper sounds (slap, tear, tape, rustle,
whoosh, slide, stamp, pen, pops, confetti).
"""
import json, os, sys, subprocess
import numpy as np
from scipy import signal
import soundfile as sf
import pyloudnorm as pyln

SR = 48000
CEILING_DBTP = -3.0  # leaves headroom for AAC/MP3 encoder overshoot (final MP4 must stay <= -1 dBTP)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AUD = os.path.join(ROOT, 'project', 'assets', 'audio')
RNG = np.random.default_rng(20260915)

CUES = json.load(open(os.path.join(AUD, 'cues.json')))
DUR = float(CUES['duration'])
N = int(DUR * SR)
BPM = float(CUES.get('bpm', 120))
BEAT = 60.0 / BPM
BAR = 4 * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def db(x):
    return 10 ** (x / 20.0)


def sos_bp(lo, hi, order=2):
    return signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')


def sos_lp(f, order=2):
    return signal.butter(order, f, btype='low', fs=SR, output='sos')


def sos_hp(f, order=2):
    return signal.butter(order, f, btype='high', fs=SR, output='sos')


def filt(sos, x):
    return signal.sosfilt(sos, x)


def noise(n):
    return RNG.standard_normal(n)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def adsr(n, a, tau):
    e = env_exp(n, tau)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def place(buf, x, t, gain=1.0, pan=0.0):
    """Add mono x at time t (s) into stereo buf with constant-power pan."""
    i = int(round(t * SR))
    if i >= buf.shape[1] or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: buf.shape[1] - i]
    th = (pan + 1) * np.pi / 4
    buf[0, i:i + len(x)] += x * gain * np.cos(th)
    buf[1, i:i + len(x)] += x * gain * np.sin(th)


# =============================================================== INSTRUMENTS ==
def ks_pluck(freq, dur=1.6, bright=0.55, decay=0.996, amp=1.0):
    """Karplus-Strong string with fractional delay via 3-tap loop filter."""
    n = int(dur * SR)
    L = SR / freq - 0.5
    Ni = int(np.floor(L))
    fr = L - Ni
    exc = noise(Ni + 2)
    exc = filt(sos_lp(1500 + 7000 * bright, 1), exc)
    exc -= exc.mean()
    x = np.zeros(n)
    x[: len(exc)] = exc
    g = decay
    a = np.zeros(Ni + 3)
    a[0] = 1.0
    a[Ni] -= g * 0.5 * (1 - fr)
    a[Ni + 1] -= g * 0.5
    a[Ni + 2] -= g * 0.5 * fr
    y = signal.lfilter([1.0], a, x)
    y *= adsr(n, 0.002, dur * 0.45)
    return amp * y / (np.max(np.abs(y)) + 1e-9)


def uke_body(x):
    # gentle body resonances + air
    b1 = filt(sos_bp(180, 320, 1), x) * 0.5
    b2 = filt(sos_bp(420, 700, 1), x) * 0.35
    return x * 0.8 + b1 + b2


def marimba(freq, dur=0.9, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.42)
    y += 0.32 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / 0.07)
    y += 0.08 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t / 0.018)
    mallet = filt(sos_bp(800, 3000, 1), noise(n)) * np.exp(-t / 0.004) * 0.25
    y = (y + mallet) * np.minimum(1, t / 0.0015)
    return amp * y / (np.max(np.abs(y)) + 1e-9)


def glock(freq, dur=1.6, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.7) + 0.25 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.2)
    y *= np.minimum(1, t / 0.001)
    return amp * y / (np.max(np.abs(y)) + 1e-9)


def bass(freq, dur=0.45, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / 0.08) + 0.12 * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t / 0.04)
    y *= np.exp(-t / 0.28) * np.minimum(1, t / 0.004)
    y[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return amp * filt(sos_lp(900), y)


def kick(amp=1.0):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.12) + 0.3 * filt(sos_lp(3000), noise(n)) * np.exp(-t / 0.004)
    return amp * y


def clap(amp=1.0):
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    e = np.zeros(n)
    for k, d in enumerate([0, 0.009, 0.018, 0.026]):
        i = int(d * SR)
        e[i:] += np.exp(-(t[: n - i]) / (0.006 if k < 3 else 0.09)) * (0.8 if k < 3 else 1.0)
    y = filt(sos_bp(900, 3200, 2), noise(n)) * e
    return amp * y / (np.max(np.abs(y)) + 1e-9)


def shaker(amp=1.0, accent=1.0):
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.012) * np.exp(-t / 0.018)
    y = filt(sos_hp(6000), noise(n)) * e
    return amp * accent * y / (np.max(np.abs(y)) + 1e-9)


def reverb_ir(sec=1.3, seed=3):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for c in range(2):
        x = r.standard_normal(n) * np.exp(-t / (sec / 6.5))
        x = filt(sos_lp(5500), x)
        ir[c] = x
    ir[:, : int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


# ===================================================================== MUSIC ==
CH = {
    'C': ([60, 64, 67, 72], 36), 'G': ([59, 62, 67, 71], 43), 'Am': ([57, 60, 64, 69], 45),
    'F': ([57, 60, 65, 69], 41), 'Em': ([59, 64, 67, 71], 40), 'Dm': ([57, 62, 65, 69], 38),
}
MEL = {  # (beat, midi, len)
    'C': [(0, 76, .5), (.5, 79, .5), (1, 81, 1), (2.5, 79, .5), (3, 76, 1)],
    'G': [(0, 74, .5), (.5, 79, .5), (1, 74, .5), (2, 71, 1), (3, 74, 1)],
    'Am': [(0, 72, .5), (.5, 76, .5), (1, 81, 1), (2.5, 79, .5), (3, 76, .5), (3.5, 74, .5)],
    'F': [(0, 72, 1), (1, 77, .5), (1.5, 76, .5), (2, 72, 1.5), (3.5, 69, .5)],
    'Em': [(0, 71, .5), (.5, 76, .5), (1, 79, 1), (2, 76, 1), (3, 74, 1)],
}
A = ['C', 'G', 'Am', 'F']


FINALE_MEL = {  # last slide: brighter, rising phrases that point to the final chord
    0: [(0, 72, .5), (.5, 77, .5), (1, 81, .5), (1.5, 84, 1), (3, 81, .5), (3.5, 79, .5)],             # over F
    1: [(0, 79, .5), (.5, 83, .5), (1, 86, 1), (2, 79, .25), (2.25, 81, .25), (2.5, 83, .25), (2.75, 86, .25), (3, 88, .5), (3.5, 91, .5)],  # over G, runs up into the final C
}


def arrangement():
    """Per-bar plan: chord + which parts play (2 s per bar at 120 BPM).
    Sections follow the story markers from cues.json, so they move with the slides."""
    nb = int(np.ceil(DUR / BAR))
    mk = CUES.get('markers', {})
    b_start = int(np.ceil(mk.get('barriers', 23.0) / BAR))            # thoughtful B section
    twist = int(mk.get('twist', 28.5) // BAR)                          # stop-time bar at the money twist
    good = int(round(mk.get('good', 34.0) / BAR))                      # bright C section
    fin = int(round(mk.get('end', 48.0) / BAR))                        # last slide: finale
    plan = []
    for b in range(nb):
        t0 = b * BAR
        p = dict(bar=b, t=t0, chord=A[b % 4], uke=0.8, strum='full', mel=0, kick=0, clap=0, shak=0, bass=0, glock=0, lift=1.0)
        if b <= 3:                       # intro / hook
            p.update(uke=0.9, strum='full', shak=1, clap=1 if b >= 2 else 0, mel=1 if b >= 1 else 0, bass=1 if b >= 1 else 0)
            p['mel_sparse'] = True
        elif b < b_start:                # A: study + crowd
            p.update(kick=1, clap=1, shak=1, bass=1, mel=1)
        elif b < twist:                  # B: barriers, thoughtful
            p.update(chord=['Am', 'Em', 'F', 'G'][(b - b_start) % 4], strum='mute', clap=1, shak=1, bass=1, mel=0, uke=0.75)
        elif b == twist:                 # twist: stop-time
            p.update(chord='G', strum='stops', shak=1, bass=0, uke=0.8)
        elif b < good:                   # build to the good news
            p.update(chord=['F', 'G'][(b - twist - 1) % 2], strum='full', clap=2 if b == good - 1 else 1, shak=1, bass=1, kick=1 if b < good - 1 else 0)
            p['riser'] = b == good - 1
        elif b < fin:                    # C: good news, GEM (starts on the home chord)
            p.update(chord=A[(b - good) % 4], kick=1, clap=1, shak=1, bass=1, mel=1, glock=1, uke=0.85)
            p['pickup'] = b == fin - 1   # little marimba run into the finale
        elif b < nb - 1:                 # FINALE: last slide – a touch brighter and busier, cadence F -> G -> C
            p.update(chord=['F', 'G'][(b - fin) % 2], kick=2, clap=1, shak=2, bass=2, mel=1, glock=0, uke=0.9, lift=0.93)
            p['finale'] = b - fin
        else:                            # final chord + ding
            p.update(chord='C', strum='final', kick=0, clap=0, shak=0, bass=0, mel=0, glock=1)
        plan.append(p)
    return plan


def render_music():
    dry = np.zeros((2, N + SR * 2))
    send = np.zeros_like(dry)
    swing = 0.0
    for p in arrangement():
        t0 = p['t']
        notes, root = CH[p['chord']]
        # --- ukulele strums
        if p['strum'] == 'final':
            pattern = [(0, 'D', 1.0)]
        elif p['strum'] == 'stops':
            pattern = [(0, 'D', 1.0), (1.5, 'D', 0.8), (3.5, 'U', 0.6)]
        elif p['strum'] == 'light':
            pattern = [(0, 'D', 0.9), (2, 'D', 0.7), (3, 'U', 0.5)]
        else:
            pattern = [(0, 'D', 1.0), (1, 'D', 0.75), (1.5, 'U', 0.55), (2.5, 'U', 0.55), (3, 'D', 0.8), (3.5, 'U', 0.5)]
        for (bt, d, v) in pattern:
            ts = t0 + bt * BEAT + (swing if (bt % 1) else 0)
            order = notes if d == 'D' else notes[::-1]
            dur = 2.6 if p['strum'] == 'final' else (0.35 if p['strum'] == 'mute' else 1.0)
            decay = 0.993 if p['strum'] == 'mute' else 0.9975
            for k, m in enumerate(order):
                s = uke_body(ks_pluck(mtof(m), dur=dur, bright=0.45 if d == 'D' else 0.6, decay=decay))
                pan = -0.25 + 0.5 * (notes.index(m) / 3)
                gain = 0.11 * v * p['uke'] * (1.0 if d == 'D' else 0.8)
                place(dry, s, ts + k * (0.011 if d == 'D' else 0.008), gain, pan * 0.6 - 0.15)
                place(send, s, ts + k * 0.011, gain * 0.35, pan)
        # --- bass
        if p['bass']:
            pat = [(0, 0), (1.5, 7 if p['chord'] in ('C', 'G', 'F') else 0), (2, 0), (3.5, 12)]
            if p['bass'] == 2:
                pat = [(k * 0.5, 12 if k % 2 else 0) for k in range(8)]
            for bt, off in pat:
                m = root + off
                place(dry, bass(mtof(m), 0.42), t0 + bt * BEAT, 0.3 if p['bass'] == 1 or off == 0 else 0.16, 0)
        # --- drums
        for bt in range(4):
            tb = t0 + bt * BEAT
            if p['kick'] and (bt in (0, 2) or p['kick'] == 2):
                place(dry, kick(), tb, 0.34 if bt in (0, 2) else 0.14, 0)
            if p['clap'] and bt in (1, 3):
                c = clap()
                place(dry, c, tb, 0.14, 0.12)
                place(send, c, tb, 0.08, 0)
            if p['clap'] == 2:
                place(dry, clap(), tb + BEAT / 2, 0.07 + 0.02 * bt, -0.1)
            if p['shak']:
                steps = 4 if p['shak'] == 2 else 2
                for h in range(steps):
                    place(dry, shaker(accent=[0.6, 1.0][h % 2] if steps == 2 else [0.7, 0.4, 1.0, 0.4][h]), tb + h * BEAT / steps, 0.05, 0.35)
            if p.get('finale') == 1 and bt == 3:   # extra off-beat clap before the last chord
                place(dry, clap(), tb + BEAT / 2, 0.09, -0.1)
        # --- marimba melody
        if p.get('pickup'):   # marimba run leading into the last slide
            for k, m in enumerate([72, 74, 76, 79]):
                place(dry, marimba(mtof(m), 0.5), t0 + 3 * BEAT + k * BEAT / 4, 0.1, 0.2)
        if p.get('finale') is not None:
            for (bt, m, ln) in FINALE_MEL[p['finale']]:
                s = marimba(mtof(m), dur=0.9)
                place(dry, s, t0 + bt * BEAT, 0.12, 0.2)
                place(send, s, t0 + bt * BEAT, 0.07, 0.2)
                g = glock(mtof(m + 12), 0.9)   # glockenspiel doubles the finale melody an octave up
                place(dry, g, t0 + bt * BEAT, 0.03, -0.3)
                place(send, g, t0 + bt * BEAT, 0.03, 0)
        elif p['mel']:
            phrase = MEL.get(p['chord'], MEL['C'])
            if p.get('mel_sparse'):
                phrase = phrase[:2] + phrase[-1:]
            up = 12 if p['bar'] >= 17 and p['bar'] % 4 in (2, 3) else 0
            for (bt, m, ln) in phrase:
                s = marimba(mtof(m + up), dur=0.9)
                place(dry, s, t0 + bt * BEAT, 0.12, 0.2)
                place(send, s, t0 + bt * BEAT, 0.07, 0.2)
        # --- glockenspiel sparkle
        if p['glock']:
            gnotes = [84, 88, 91] if p['strum'] != 'final' else [84, 88, 91, 96]
            for k, m in enumerate(gnotes):
                bt = [0.5, 2.5, 3.25, 0.0][k] if p['strum'] != 'final' else k * 0.18
                s = glock(mtof(m), 1.4)
                place(dry, s, t0 + bt * BEAT, 0.035, 0.4 - 0.3 * k)
                place(send, s, t0 + bt * BEAT, 0.04, 0)
            if p['strum'] == 'final':
                place(dry, marimba(mtof(72), 1.6), t0, 0.16, 0)
                place(dry, marimba(mtof(84), 1.6), t0 + 0.02, 0.08, 0.2)
                place(dry, bass(mtof(36), 1.6), t0, 0.35, 0)
                place(dry, kick(), t0, 0.3, 0)
        # --- riser before the good-news drop
        if p.get('riser'):
            n = int(BAR * SR)
            t = np.arange(n) / SR
            x = noise(n)
            y = np.zeros(n)
            for i in range(0, n, 1024):  # stepped filter sweep
                f = 400 * (12 ** (i / n))
                seg = slice(i, min(n, i + 1024))
                y[seg] = filt(sos_bp(f, min(f * 2.2, 16000), 1), x[max(0, i - 2048): i + 1024])[-(seg.stop - seg.start):]
            y *= (t / BAR) ** 2
            place(dry, y / np.max(np.abs(y)), t0, 0.05, 0)
            place(send, y / np.max(np.abs(y)), t0, 0.04, 0)
    ir = reverb_ir()
    wet = np.stack([signal.fftconvolve(send[0], ir[0])[: dry.shape[1]], signal.fftconvolve(send[1], ir[1])[: dry.shape[1]]])
    out = dry + 0.55 * wet
    out = out[:, :N]
    # finale bars: level trim so the busier arrangement only lifts ~1 LU (not a crescendo), smoothed
    lift = np.ones(out.shape[1])
    for p in arrangement():
        if p['lift'] != 1.0:
            lift[int(p['t'] * SR): int((p['t'] + BAR) * SR)] = p['lift']
    k = int(0.4 * SR)
    lift = np.convolve(np.pad(lift, (k, k), mode='edge'), np.ones(k) / k, mode='same')[k:-k]
    out *= lift[: out.shape[1]]
    # gentle glue: soft saturation + master fade-out of the final chord
    out = np.tanh(out * 1.4) / 1.4
    fade = int(1.5 * SR)
    out[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    out[:, : int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    return out


# ======================================================================= SFX ==
def crackle(n, rate, jitter=1.0, decay=0.0015, rng=RNG):
    """Train of tiny impulses (paper fibres) with given rate (per s) envelope array or float."""
    x = np.zeros(n)
    rate_arr = np.full(n, rate) if np.isscalar(rate) else rate
    p = rate_arr / SR
    hits = rng.random(n) < p
    idx = np.nonzero(hits)[0]
    x[idx] = rng.uniform(0.2, 1.0, len(idx)) * rng.choice([-1, 1], len(idx))
    k = np.exp(-np.arange(int(decay * 8 * SR)) / (decay * SR))
    return signal.fftconvolve(x, k)[:n]


def hump(n, peak=0.5, shape=2.0):
    t = np.linspace(0, 1, n)
    a = t / peak
    b = (1 - t) / (1 - peak)
    return np.clip(np.minimum(a, b), 0, 1) ** shape


def sweep_bp(x, f0, f1, f2=None, block=512, q=1.6):
    """Band-pass with centre sweeping f0->f1(->f2)."""
    n = len(x)
    y = np.zeros(n)
    zi = None
    for i in range(0, n, block):
        u = i / max(1, n - 1)
        if f2 is None:
            f = f0 * (f1 / f0) ** u
        else:
            f = f0 * (f1 / f0) ** (2 * u) if u < 0.5 else f1 * (f2 / f1) ** (2 * u - 1)
        lo, hi = f / q, min(f * q, SR / 2 - 100)
        b, a = signal.butter(1, [lo, hi], btype='band', fs=SR)
        seg = x[i:i + block]
        if zi is None:
            zi = signal.lfilter_zi(b, a) * 0
        yy, zi = signal.lfilter(b, a, seg, zi=zi)
        y[i:i + block] = yy
    return y


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def s_slap(big=True):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    body = filt(sos_lp(700 if big else 1100), noise(n)) * np.exp(-t / (0.018 if big else 0.012))
    thud = np.sin(2 * np.pi * (170 if big else 240) * t) * np.exp(-t / 0.035)
    paper = filt(sos_bp(1800, 7000), crackle(n, 2500 * np.exp(-t / 0.03) + 20)) * 0.9
    snap = filt(sos_hp(2500), noise(n)) * np.exp(-t / 0.004) * 0.5
    return norm(body * 1.0 + thud * 0.6 + paper + snap)


def s_pop(pitch=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = (330 + 900 * np.exp(-t / 0.018)) * pitch
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)
    y += filt(sos_hp(3000), noise(n)) * np.exp(-t / 0.002) * 0.3
    return norm(y)


def s_rustle(dur=0.18, dens=900, lo=1500, hi=8000):
    n = int(dur * SR)
    e = hump(n, 0.3, 1.2)
    x = filt(sos_bp(lo, hi), crackle(n, dens * e + 5)) + filt(sos_bp(lo, hi), noise(n)) * 0.12 * e
    return norm(x)


def s_whoosh(dur=0.6, small=False):
    n = int(dur * SR)
    x = noise(n)
    y = sweep_bp(x, 500 if not small else 900, 2600 if not small else 4200, 900 if not small else 1600, q=1.8)
    y *= hump(n, 0.55, 1.6)
    if not small:  # page-turn whoosh keeps a little paper texture; small ones stay smooth
        y += s_rustle(dur, 350, 2000, 9000)[:n] * 0.25 * hump(n, 0.6, 1)
    return norm(y)


def s_sheet(dur=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fric = filt(sos_bp(700, 4500), noise(n)) * (0.5 + 0.5 * filt(sos_lp(25), noise(n)) * 3)
    fric *= hump(n, 0.7, 1.0)
    return norm(fric + s_rustle(dur, 600, 1800, 9000) * 0.4)


def s_tear(dur=0.5):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    dens = 9000 * (0.3 + 0.7 * np.sin(np.pi * np.clip(t * 1.1, 0, 1))) + 50
    x = crackle(n, dens, decay=0.0008)
    hi = sweep_bp(x, 2200, 4200, q=2.2)
    low = filt(sos_bp(250, 900), crackle(n, dens * 0.2, decay=0.004)) * 0.6
    e = hump(n, 0.15, 0.6)
    return norm((hi + low) * e)


def s_tape(dur=0.28):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rate = 500 + 300 * np.sin(np.pi * t / dur)
    x = crackle(n, rate, decay=0.0007)
    y = filt(sos_bp(1500, 6000), x) * hump(n, 0.4, 0.8)
    rip = filt(sos_bp(2000, 8000), noise(n)) * np.exp(-np.maximum(0, t - dur * 0.85) / 0.01) * (t > dur * 0.85) * 0.5
    return norm(y + rip)


def s_tick():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    y = filt(sos_bp(1800, 5000), noise(n)) * np.exp(-t / 0.004) + 0.4 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.012)
    return norm(y)


def s_stamp():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(60 + 70 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.07)
    punch = filt(sos_lp(1200), noise(n)) * np.exp(-t / 0.012)
    wood = np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.03) * 0.3
    return norm(thump + punch * 0.8 + wood)


def s_count(dur=0.6):
    n = int(dur * SR)
    y = np.zeros(n)
    tt = 0.0
    k = 0
    while tt < dur - 0.03:
        blk = s_woodblock(1 + 0.03 * k)
        i = int(tt * SR)
        m = min(len(blk), n - i)
        y[i:i + m] += blk[:m] * (0.6 + 0.4 * (k % 2))
        tt += 0.035 + 0.1 * (tt / dur) ** 2
        k += 1
    return norm(y)


def s_woodblock(p=1.0):
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1700 * p * t) + 0.5 * np.sin(2 * np.pi * 2650 * p * t)) * np.exp(-t / 0.008)


def s_scribble(dur=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * (7 + 3 * np.sin(t * 5)) * t)
    x = filt(sos_bp(2500, 9000), noise(n)) * strokes ** 2 * hump(n, 0.2, 0.5)
    return norm(x + filt(sos_bp(900, 2500), crackle(n, 300)) * 0.2)


def s_flip():
    n = int(0.16 * SR)
    y = sweep_bp(noise(n), 900, 4500, q=1.8) * hump(n, 0.6, 1.2)
    tk = s_tick()
    y[-len(tk):] += tk * 0.2
    return norm(y)


def s_hop():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(280 + 420 * (t / 0.16)) / SR) * hump(n, 0.2, 1) * 0.5
    return norm(y + s_softswish(0.16, 300, 1400) * 0.4)


def s_land():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return norm(filt(sos_lp(500), noise(n)) * np.exp(-t / 0.02) + 0.4 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.03))


def s_slide(dur=0.5):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    return s_softswish(dur, 300, 1800)


def s_rise(dur=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 320 * (2.2 ** (t / dur))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * hump(n, 0.8, 1) * 0.35
    return norm(y + s_slide(dur) * 0.6)


def s_burst():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    y = s_softswish(0.45, 400, 2500) * 0.6
    p = s_pop(1.2)
    y[: len(p)] += p * 0.8
    return norm(y)


def s_pop_cascade(dur=1.0):
    n = int(dur * SR)
    y = np.zeros(n)
    r = np.random.default_rng(7)
    for k in range(34):
        tt = (k / 34) * dur * 0.92 + r.uniform(0, 0.02)
        p = s_pop(0.8 + 0.8 * k / 34 + r.uniform(-0.1, 0.1))
        i = int(tt * SR)
        m = min(len(p), n - i)
        y[i:i + m] += p[:m] * r.uniform(0.4, 0.8)
    return norm(y + s_softswish(dur, 300, 1500) * 0.2)


def s_shuffle(dur=1.0):
    n = int(dur * SR)
    y = s_softswish(dur, 300, 1500) * 0.5
    r = np.random.default_rng(9)
    for k in range(26):
        tt = r.uniform(0, dur - 0.1)
        s = s_land()
        i = int(tt * SR)
        y[i:i + len(s)] += s[: n - i] * 0.3
    return norm(y * hump(n, 0.4, 0.6))


def s_cheer():
    y = np.zeros(int(0.8 * SR))
    for k, m in enumerate([72, 76, 79, 84]):
        s = marimba(mtof(m), 0.6)
        i = int(k * 0.07 * SR)
        y[i:i + len(s)] += s[: len(y) - i] * 0.7
    return norm(y)


def s_confetti(dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    # party-popper crack
    crack = filt(sos_hp(800), noise(int(0.05 * SR))) * np.exp(-np.arange(int(0.05 * SR)) / (0.006 * SR))
    y[: len(crack)] += crack
    y[: int(0.3 * SR)] += s_stamp()[: int(0.3 * SR)] * 0.4
    y += filt(sos_bp(2500, 10000), crackle(n, 3000 * np.exp(-t / 0.6) + 60)) * 0.5
    r = np.random.default_rng(11)
    for k in range(26):
        tt = 0.05 + (r.random() ** 1.6) * (dur - 0.6)
        g = glock(r.uniform(2200, 4200), 0.5) * 0.25 * np.exp(-tt / 2)
        i = int(tt * SR)
        y[i:i + len(g)] += g[: n - i]
    return norm(y * np.exp(-t / 2.2))


def s_thump(weight=1.0):
    """Light, soft paper-on-table thump for text landing: low body + muffled tap, no crackle."""
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f0 = 150 - 45 * weight
    f = f0 * (1 + 0.5 * np.exp(-t / 0.012))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.03 + 0.02 * weight))
    tap = filt(sos_lp(900), noise(n)) * np.exp(-t / 0.005) * 0.3
    y = (body + tap) * np.minimum(1, t / 0.002)
    return norm(filt(sos_lp(2500), y))


def s_softswish(dur=0.3, lo=250, hi=1600):
    """Gentle air movement, smooth envelope, no paper crackle."""
    n = int(dur * SR)
    y = filt(sos_bp(lo, hi), noise(n)) * hump(n, 0.45, 1.8)
    return norm(filt(sos_lp(hi * 1.2), y))


SFX = {
    # text landing: light thumps (no ripping); page turns keep tear/sheet/whoosh
    'slap': lambda c: s_thump(1.0), 'slapSmall': lambda c: s_thump(0.6), 'pop': lambda c: s_pop(1.0),
    'rustleSmall': lambda c: s_softswish(0.14, 300, 1400), 'swish': lambda c: s_softswish(0.3, 300, 1800),
    'whoosh': lambda c: s_whoosh(max(0.45, c.get('dur', 0.6))), 'whooshSmall': lambda c: s_whoosh(min(0.5, max(0.3, c.get('dur', 0.4))), small=True),
    'sheet': lambda c: s_sheet(c.get('dur', 0.6)), 'tear': lambda c: s_tear(max(0.45, c.get('dur', 0.5))), 'tape': lambda c: s_thump(0.3),
    'tick': lambda c: s_tick(), 'stamp': lambda c: s_stamp(), 'count': lambda c: s_count(c.get('dur', 0.6)),
    'scribble': lambda c: s_scribble(c.get('dur', 0.6)), 'flip': lambda c: s_softswish(0.18, 400, 2000), 'hop': lambda c: s_hop(), 'land': lambda c: s_land(),
    'slide': lambda c: s_slide(c.get('dur', 0.45)), 'rise': lambda c: s_rise(c.get('dur', 0.8)), 'burst': lambda c: s_burst(),
    'popCascade': lambda c: s_pop_cascade(c.get('dur', 1.0)), 'shuffle': lambda c: s_shuffle(c.get('dur', 1.0)), 'cheer': lambda c: s_cheer(),
    'confetti': lambda c: s_confetti(c.get('dur', 4.0)),
}
SFX_LEVEL = {  # base level per type (linear, before cue gain in dB)
    'slap': 0.32, 'slapSmall': 0.24, 'pop': 0.3, 'rustleSmall': 0.12, 'swish': 0.12, 'whoosh': 0.4, 'whooshSmall': 0.2,
    'sheet': 0.3, 'tear': 0.6, 'tape': 0.14, 'tick': 0.25, 'stamp': 0.45, 'count': 0.18, 'scribble': 0.2, 'flip': 0.18,
    'hop': 0.2, 'land': 0.22, 'slide': 0.16, 'rise': 0.22, 'burst': 0.35, 'popCascade': 0.3, 'shuffle': 0.3, 'cheer': 0.25, 'confetti': 0.4,
}


def render_sfx():
    buf = np.zeros((2, N + SR * 5))
    missing = set()
    for c in CUES['cues']:
        fn = SFX.get(c['type'])
        if not fn:
            missing.add(c['type'])
            continue
        x = fn(c)
        place(buf, x, c['t'], SFX_LEVEL[c['type']] * db(c.get('gain', 0)), c.get('pan', 0))
    if missing:
        print('WARNING missing sfx types:', missing)
    # small room so SFX sit in the same space as the music
    ir = reverb_ir(0.6, seed=5)
    wet = np.stack([signal.fftconvolve(buf[0], ir[0])[: buf.shape[1]], signal.fftconvolve(buf[1], ir[1])[: buf.shape[1]]])
    out = buf + 0.12 * wet
    return out[:, :N]


def render_narration():
    """Future: narration files listed in timeline.audio.narration (not used in v1)."""
    buf = np.zeros((2, N))
    active = np.zeros(N)
    for nar in CUES.get('narration') or []:
        path = os.path.join(ROOT, 'project', nar['file'])
        x, sr = sf.read(path, always_2d=True)
        if sr != SR:
            x = signal.resample_poly(x, SR, sr, axis=0)
        x = x.T if x.shape[1] == 2 else np.vstack([x[:, 0], x[:, 0]])
        i = int(nar['at'] * SR)
        m = min(x.shape[1], N - i)
        buf[:, i:i + m] += x[:, :m] * db(nar.get('gainDb', 0))
        active[i:i + m] = 1
    return buf, active


# =================================================================== MASTER ==
def true_peak(x):
    up = signal.resample_poly(x, 4, 1, axis=1)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x, ceiling_db=-1.5, look=0.004, release=0.09):
    """Look-ahead true-peak limiter (4x oversampled detection)."""
    c = db(ceiling_db)
    up = np.abs(signal.resample_poly(x, 4, 1, axis=1)).max(axis=0)
    pk = up.reshape(-1, 4).max(axis=1)[: x.shape[1]]
    if len(pk) < x.shape[1]:
        pk = np.pad(pk, (0, x.shape[1] - len(pk)))
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    L = int(look * SR)
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * L + 1, origin=0)
    # release smoothing (one-pole, only upward)
    a = np.exp(-1 / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):  # simple loop, ~2.6M samples
        v = g[i]
        cur = v if v < cur else a * cur + (1 - a) * v
        out[i] = cur
    # attack smoothing via short moving average (keeps gain <= need after min filter)
    k = np.ones(L) / L
    out = np.minimum(out, np.convolve(out, k, mode='same'))
    return x * out


def main():
    print('music…')
    music = render_music()
    print('sfx…')
    sfx = render_sfx()
    nar, active = render_narration()
    meter = pyln.Meter(SR)
    # balance: music bed sits ~5 LU under the SFX peaks; SFX clear but not harsh
    lm = meter.integrated_loudness(music.T)
    music *= db(-20 - lm)
    ls = meter.integrated_loudness(sfx.T)
    sfx *= db(-21.5 - ls)
    # bus limiting: tame SFX transients (stamps, slaps) and music peaks before
    # the master limiter, so the master only has to catch the odd overlap
    sfx = limiter(sfx, -10.0, look=0.002, release=0.05)
    music = limiter(music, -8.0, look=0.004, release=0.12)
    sfx *= db(-21.5 - meter.integrated_loudness(sfx.T))
    music *= db(-20 - meter.integrated_loudness(music.T))
    if active.any():  # duck music under narration
        duck = 1 - 0.5 * signal.convolve(active, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode='same')
        music *= duck
    mix = music + sfx + nar
    # iterate: loudness normalise -> limit -> re-measure
    target = -14.0
    gain = 0.0
    for it in range(4):
        l = meter.integrated_loudness(mix.T)
        g = db(target - l)
        mix *= g
        music *= g
        sfx *= g
        mix = limiter(mix, CEILING_DBTP)
    final_l = meter.integrated_loudness(mix.T)
    tp = true_peak(mix)
    print(f'mix: {final_l:.2f} LUFS, true peak {tp:.2f} dBTP')
    os.makedirs(AUD, exist_ok=True)
    sf.write(os.path.join(AUD, 'music.wav'), music.T.astype(np.float32), SR, subtype='PCM_24')
    sf.write(os.path.join(AUD, 'sfx.wav'), sfx.T.astype(np.float32), SR, subtype='PCM_24')
    sf.write(os.path.join(AUD, 'mix.wav'), mix.T.astype(np.float32), SR, subtype='PCM_24')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(AUD, 'mix.wav'), '-codec:a', 'libmp3lame', '-b:a', '192k', os.path.join(AUD, 'mix.mp3')], check=True)
    json.dump({'integrated_lufs': round(final_l, 2), 'true_peak_dbtp': round(tp, 2), 'music_lufs_in_mix': round(meter.integrated_loudness(music.T), 2),
               'sfx_lufs_in_mix': round(meter.integrated_loudness(sfx.T), 2), 'cues': len(CUES['cues'])},
              open(os.path.join(AUD, 'master_report.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()

# Fact sheet – every figure used on screen

## ⚠️ Verification status (read first)

The container this project was built in has a restricted network policy. These hosts were **blocked** (HTTP 403 at the egress proxy, both via `curl` and the web-fetch tool):

- `www.bertelsmann-stiftung.de` (study PDF and press article)
- `youngfounders.network`
- `doi.org`, plus all news sites

That means **the PDF could not be downloaded or read**, and page references could not be checked. Instead, every figure was checked with several independent web searches against news reports based on the dpa report of 15.09.2026 (t-online, Tagesspiegel, LZ, Stimme, boerse.de, finanzen.at, ad-hoc-news, it-boltwise), table.media, the RKW/GEM press releases (presseportal.de, rkw-kompetenzzentrum.de), and the search-indexed Young Founders Network pages.

- ✅ **Corroborated**: confirmed by at least one independent source besides the brief.
- ☑️ **Brief only**: taken from the brief's summary of the Bertelsmann article. Consistent with the corroborated figures, but not seen in a primary text.
- **Page refs**: all say "S. ? (PDF not accessible)". Please fill them in, or re-run with `www.bertelsmann-stiftung.de` allowed. Wherever a figure appears on screen, it's defined in exactly one place: `project/src/data/timeline.js`.

Anything that couldn't be verified at all was **left out of the video** (see the end of this file).

## Study

Note: the evidence column paraphrases search-result excerpts, most of which were summaries in English. It is **not** verbatim quotation from the PDF.


**Andrade, Bürger, Heck (2026): „Gründungsaufbruch der jungen Generation: Hohes Interesse und Rekordaktivität trotz Barrieren".** Bertelsmann Stiftung, Gütersloh, 15.09.2026. DOI 10.11586/2026127.

| # | On-screen text (German) | Figure | Base group | Source wording / evidence | Status | Page |
|---|---|---|---|---|---|---|
| F1 | „1.763 junge Menschen + 1.325 Azubis" + „online befragt · Frühjahr 2026" + stamp „REPRÄSENTATIV" | 1,763 + 1,325; online, March to mid-April 2026 | 14–25-year-olds; apprentices 15–25 | Search results for the same survey wave (Bertelsmann „Ausbildungsperspektiven 2026", paraphrased): 1.763 junge Menschen im Alter von 14 bis 25 Jahren sowie 1.325 Auszubildende … online von März bis Mitte April 2026 | ✅ | S. ? |
| F2 | „Selbstständig bis 30?" → „9 % – haben es fest vor" | 9 % | all 14–25-year-olds surveyed | dpa (paraphrased from search results): Fast jede:r Zehnte hat die feste Absicht, sich bis zum 30. Geburtstag selbstständig zu machen; brief: 9 % | ✅ (≈ one in ten) / ☑️ exact 9 | S. ? |
| F3 | „28 % – vorstellbar, aber noch unsicher" | 28 % | same | brief: "28 % can imagine it but aren't sure" | ☑️ | S. ? |
| F4 | „31 % – eher nicht, aber nicht ausgeschlossen" | 31 % | same | brief: "31 % rather not but don't rule it out" | ☑️ | S. ? |
| F5 | „29 % – keine Option" | 29 % | same | dpa (paraphrased from search results): 29 Prozent der Befragten schließen eine Gründung für sich aus | ✅ | S. ? |
| F6 | „3 % – haben’s schon gemacht" | 3 % | same | dpa (paraphrased from search results): nur 3 Prozent der befragten 14- bis 25-Jährigen haben diesen Schritt tatsächlich umgesetzt | ✅ | S. ? |
| F7 | „Fast 4 von 10 / können sich vorstellen, zu gründen." + caption „Vorstellen heißt nicht gründen – aber es ist ein Anfang." | 9 % + 28 % = 37 % | same | brief/article: "nearly 4 in 10 can imagine founding". Consistency check: 9 + 28 + 31 + 29 + 3 = 100 %; dpa's "40 % interested" = 37 % + the 3 % who already did it. These are the answer categories of a single-choice question, so adding them is valid. | ✅ | S. ? |
| F8 | „rund 60 %" / „zu unsicher – lieber angestellt" | 60 % (brief) / 61 % (dpa) | those who **cannot** imagine founding (brief); multiple answers possible | brief: "60 % find self-employment too insecure and prefer employment"; dpa (paraphrased from search results): 61 Prozent gaben an, ein sicheres Angestelltenverhältnis vorzuziehen. The two sources disagree by 1 point, so the screen says **„rund 60 %"**, which is true under either figure. If the PDF confirms one value, change `barriers[0].value` in `timeline.js`. | ✅ (≈60) | S. ? |
| F9 | „48 %" / „zu wenig Wissen übers Gründen" | 48 % | as F8 | dpa (paraphrased from search results): 48 Prozent nennen fehlendes Wissen als Grund; brief adds "especially school pupils" | ✅ | S. ? |
| F10 | „39 %" / „Angst vor zu viel Stress" | 39 % | as F8 | dpa (paraphrased from search results): 39 Prozent schreckt der Stress einer Selbstständigkeit ab; brief adds "mostly school leavers" | ✅ | S. ? |
| F11 | „Und Geld? Kaum ein Problem." + stamp „UNTER 10 %" + caption „Startkapital nennt nicht mal jede:r Zehnte." | < 10 % (search results: 9 %) | as F8 | brief: "Fewer than 1 in 10 worry about start-up capital"; search summaries of the dpa report: "9 percent mention lack of startup capital" | ✅ | S. ? |
| F12 | handwritten note on the barrier chart: „Mehrfachnennungen möglich" | – | – | multiple-choice reasons, so they are **never added up** on screen | – | – |

Recommendations (qualitative, scene 5 cards):

| # | On-screen text | Evidence | Status |
|---|---|---|---|
| R1 | caption „Die Studie empfiehlt: unternehmerisches Denken in jeder Schulform." | brief (article); table.media: the Stiftung wants entrepreneurial thinking promoted more strongly in schools | ✅ / ☑️ |
| R2 | „Workshops & Schülerfirmen" | brief (article) | ☑️ |
| R3 | „Gründungs-Infos über Social Media" | brief (article) | ☑️ |
| R4 | „Kostenlose Beratung, z. B. Agentur für Arbeit, Jugendberufshilfe" + „Anti-Stress-Kurse & Apps der Krankenkassen" | brief (article) | ☑️ |

## Global Entrepreneurship Monitor (separate source; labelled "GEM 2025/26" on screen)

| # | On-screen text | Figure | Base group | Evidence | Status |
|---|---|---|---|---|---|
| G1 | „2024: knapp 13 %" | 12.9 % | 18–24-year-olds in Germany: GEM **Gründungsquote** (TEA: share of the age group currently starting or recently started a business) | RKW Kompetenzzentrum / presseportal (GEM Deutschland 2025/26), search excerpt: Gründungsquote bei sehr jungen Erwachsenen (18–24) verdoppelte sich nahezu von 12,9 auf 23,2 Prozent | ✅ |
| G2 | „2025: über 23 %" | 23.2 % (one search summary gave 23.4 %; both are „über 23 %") | same | as G1 | ✅ |
| G3 | „Fast verdoppelt – in nur einem Jahr." | 12.9 → 23.2 (× 1.8) | – | as G1 | ✅ |

On screen: headline „Und junge Leute legen los:", sub-label „Anteil der 18- bis 24-Jährigen, die gerade gründen oder kürzlich gegründet haben" (this is the GEM *Gründungsquote* / TEA rate, not the share of all founders), source label „Quelle: Global Entrepreneurship Monitor (GEM) 2025/26", and caption „Fast verdoppelt – in nur einem Jahr.". Bar heights are drawn to scale at 12.9 and 23.2. No causal link is drawn between the survey and the GEM figure. They appear as two separate facts.

## Young Founders Network (end card)

| # | On-screen text | Evidence | Status |
|---|---|---|---|
| Y1 | „Young Founders Network" | page title of youngfounders.network (search index): „Gründer-Community für unter 25 \| Young Founders Network" | ✅ |
| Y2 | „Community für junge Gründer:innen unter 25" | same page title; the site describes itself as a non-profit, independent network (Young Founders Network e.V.) | ✅ |
| Y3 | „unterstützt von der Bertelsmann Stiftung" | brief (Bertelsmann article); search: YFN projects realised in partnership with the Bertelsmann Stiftung (e.g. „YFN Crashkurs Bürokratie"; co-publisher of the „Young Founders Monitor") | ✅ |
| Y4 | „youngfounders.network" | URL | ✅ |

No membership numbers, events or other claims about the network appear on screen.

## Illustration convention

„Stell dir 100 junge Menschen vor:": the crowd has exactly 100 figures, one per percentage point. 9 + 28 + 31 + 29 + 3 = 100. `tools/check_numbers.js` checks that every on-screen number maps to a row in this file (result: 0 unapproved numbers).

## Source credit on screen

„Quelle: Bertelsmann Stiftung (2026), Gründungsaufbruch der jungen Generation; GEM 2025"

## Left out on purpose (could not be verified)

- **Education gap** (42 % Gymnasium/Abitur vs 27 % Hauptschule; "half vs a fifth rule it out"). No independent source could confirm these numbers; one search summary even gave conflicting figures from a different Bertelsmann study. The optional scene was dropped. The *recommendation* „egal welche Schulform" (R1) remains, without numbers.
- **Age difference** (14–20 vs 21–25 more open): not verifiable, so not used.
- "Especially pupils" / "mostly school leavers" qualifiers on F9/F10: not verifiable in detail, so not used on screen.

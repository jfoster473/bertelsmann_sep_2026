# QA – reading time & safe zones

Rule: every text beat stays fully readable (after its entrance settles, before it exits or is covered) for at least *words ÷ 3 + 0.5 s*. Safe box for key text: x 50–940, y 250–1540 (1080×1920).

Issues: **0**

| id | text | words | needed s | readable s | ok | box (x0,y0,x1,y1) | safe zone |
|---|---|---|---|---|---|---|---|
| d1 | Zu unsicher! | 2 | 1.17 | 6.15 | ✅ | 59,562,444,698 | ok |
| d2 | Keine Ahnung, ⏎ wie das geht … | 5 | 2.17 | 5.80 | ✅ | 617,582,934,741 | ok |
| d3 | Viel zu ⏎ viel Stress | 4 | 1.83 | 5.45 | ✅ | 71,759,358,909 | ok |
| money | Dafür brauchst ⏎ du viel Geld! | 5 | 2.17 | 4.50 | ✅ | 596,789,933,912 | ok |
| d5 | Das machen ⏎ doch nur andere. | 5 | 2.17 | 4.75 | ✅ | 55,1170,425,1301 | ok |
| h1 | Eigene Firma gründen? | 3 | 1.50 | 4.10 | ✅ | 78,284,840,414 | ok |
| h2 | Ich doch nicht … | 3 | 1.50 | 3.40 | ✅ | 128,401,733,530 | ok |
| c1 | Kommt dir bekannt vor? | 4 | 1.83 | 2.33 | ✅ | 262,1387,820,1476 | ok |
| s_k | Neue Studie · Bertelsmann Stiftung | 4 | 1.83 | 5.40 | ✅ | 80,298,805,362 | ok |
| s_h1 | Was denken | 2 | 1.17 | 5.15 | ✅ | 78,366,621,514 | ok |
| s_h2 | 14- bis 25-Jährige | 3 | 1.50 | 4.85 | ✅ | 99,476,838,620 | ok |
| s_h3 | übers Gründen? | 2 | 1.17 | 4.55 | ✅ | 79,583,792,730 | ok |
| s_n | 1.763 junge Menschen + 1.325 Azubis ⏎ online befragt, Frühjahr 2026 | 9 | 3.50 | 3.90 | ✅ | 79,735,801,843 | ok |
| s_stamp | REPRÄSENTATIV | 1 | 0.83 | 2.35 | ✅ | 510,1096,920,1256 | ok |
| q_h | Selbstständig bis 30? | 3 | 1.50 | 3.95 | ✅ | 79,265,835,397 | ok |
| c2 | Stell dir 100 junge Menschen vor: | 6 | 2.50 | 2.58 | ✅ | 166,1387,916,1475 | ok |
| q_big | Fast 4 von 10 | 4 | 1.83 | 4.50 | ✅ | 77,255,725,443 | ok |
| q_sub | können sich vorstellen, zu gründen. | 5 | 2.17 | 4.10 | ✅ | 109,416,836,499 | ok |
| c3 | Vorstellen heißt nicht gründen – ⏎ aber es ist ein Anfang. | 9 | 3.50 | 3.58 | ✅ | 179,1335,900,1476 | ok |
| b_h | Was hält die anderen ab? | 5 | 2.17 | 10.00 | ✅ | 79,263,827,379 | ok |
| b_base | Befragte, die sich Gründen nicht vorstellen können | 7 | 2.83 | 9.45 | ✅ | 90,383,807,442 | ok |
| b_multi | Mehrfachnennungen möglich | 2 | 1.17 | 5.45 | ✅ | 292,995,748,1065 | ok |
| b_tw | Und Geld? Kaum ein Problem. | 5 | 2.17 | 4.90 | ✅ | 70,1060,851,1165 | ok |
| b_stamp | UNTER 10 % | 2 | 1.17 | 4.15 | ✅ | 544,1226,926,1377 | ok |
| c4 | Startkapital nennt nicht mal ⏎ jede:r Zehnte. | 7 | 2.83 | 3.58 | ✅ | 224,1333,857,1474 | ok |
| g_h | Die gute Nachricht: | 3 | 1.50 | 7.00 | ✅ | 79,263,840,406 | ok |
| g_a | Wissen kann man lernen. | 4 | 1.83 | 6.50 | ✅ | 79,400,839,510 | ok |
| g_a_st | LÖSBAR | 1 | 0.83 | 6.10 | ✅ | 700,527,929,652 | ok |
| g_a1 | Workshops & Schülerfirmen | 2 | 1.17 | 5.60 | ✅ | 120,537,612,599 | ok |
| g_a2 | Gründungs-Infos über Social Media | 4 | 1.83 | 5.25 | ✅ | 119,617,759,682 | ok |
| g_b | Stress kann man managen. | 4 | 1.83 | 4.85 | ✅ | 80,748,833,852 | ok |
| g_b_st | LÖSBAR | 1 | 0.83 | 4.45 | ✅ | 702,895,928,1014 | ok |
| g_b1 | Kostenlose Beratung, z. B. ⏎ Agentur für Arbeit, ⏎ Jugendberufshilfe | 8 | 3.17 | 4.00 | ✅ | 119,884,630,1021 | ok |
| g_b2 | Anti-Stress-Kurse & Apps ⏎ der Krankenkassen | 4 | 1.83 | 3.65 | ✅ | 119,1062,593,1162 | ok |
| c5 | Die Studie empfiehlt: unter- ⏎ nehmerisches Denken in ⏎ jeder Schulform. | 9 | 3.50 | 3.53 | ✅ | 223,1284,857,1477 | ok |
| m_h | Und junge Leute legen los: | 5 | 2.17 | 5.00 | ✅ | 79,263,835,375 | ok |
| m_sub | Anteil der 18- bis 24-Jährigen, die gerade ⏎ gründen oder kürzlich gegründet haben | 12 | 4.50 | 4.60 | ✅ | 90,387,701,482 | ok |
| m_src | Quelle: Global Entrepreneurship Monitor (GEM) 2025/26 | 6 | 2.50 | 4.15 | ✅ | 91,1312,825,1365 | ok |
| c6 | Fast verdoppelt – in nur einem Jahr. | 6 | 2.50 | 2.63 | ✅ | 142,1387,937,1476 | ok |
| e_k | Dein nächster Schritt: | 3 | 1.50 | 6.75 | ✅ | 79,263,827,396 | ok |
| e_t | Young Founders ⏎ Network | 3 | 1.50 | 6.30 | ✅ | 79,392,845,646 | ok |
| e_s | Community für junge Gründer:innen unter 25 | 7 | 2.83 | 5.70 | ✅ | 89,667,820,735 | ok |
| e_b | unterstützt von der Bertelsmann Stiftung | 5 | 2.17 | 5.35 | ✅ | 99,745,703,806 | ok |
| e_url | youngfounders.network | 1 | 0.83 | 4.90 | ✅ | 117,855,923,995 | ok |
| e_hand | schau vorbei! | 2 | 1.17 | 3.91 | ✅ | 549,1105,831,1195 | ok |
| e_src | Quelle: Bertelsmann Stiftung (2026), Gründungsaufbruch ⏎ der jungen Generation; GEM 2025 | 10 | 3.83 | 4.55 | ✅ | 160,1446,920,1518 | ok |
| crowd.tag0 | 9 % | 1 | 0.83 | 7.00 | ✅ | – | – |
| crowd.label0 | haben es fest vor | 4 | 1.83 | 7.05 | ✅ | 350,513,614,560 | ok |
| crowd.tag1 | 28 % | 1 | 0.83 | 6.60 | ✅ | – | – |
| crowd.label1 | vorstellbar, aber noch unsicher | 4 | 1.83 | 6.65 | ✅ | 350,649,804,696 | ok |
| crowd.tag2 | 31 % | 1 | 0.83 | 6.20 | ✅ | – | – |
| crowd.label2 | eher nicht, aber nicht ausgeschlossen | 5 | 2.17 | 6.25 | ✅ | 350,841,900,888 | ok |
| crowd.tag3 | 29 % | 1 | 0.83 | 5.80 | ✅ | – | – |
| crowd.label3 | keine Option | 2 | 1.17 | 5.85 | ✅ | 350,1033,550,1080 | ok |
| crowd.tag4 | 3 % | 1 | 0.83 | 5.40 | ✅ | – | – |
| crowd.label4 | haben’s schon gemacht | 3 | 1.50 | 5.45 | ✅ | 350,1225,703,1272 | ok |
| bar.label0 | zu unsicher – lieber angestellt | 4 | 1.83 | 8.85 | ✅ | 176,489,730,551 | ok |
| bar.num0 | rund 60 % | 2 | 1.17 | 8.30 | ✅ | 552,549,894,647 | ok |
| bar.label1 | zu wenig Wissen übers Gründen | 5 | 2.17 | 7.95 | ✅ | 176,659,775,721 | ok |
| bar.num1 | 48 % | 1 | 0.83 | 7.40 | ✅ | 466,719,669,817 | ok |
| bar.label2 | Angst vor zu viel Stress | 5 | 2.17 | 7.05 | ✅ | 176,829,621,891 | ok |
| bar.num2 | 39 % | 1 | 0.83 | 6.50 | ✅ | 401,889,605,987 | ok |
| gem.value0 | knapp 13 % (2024) | 3 | 1.50 | 3.75 | ✅ | – | – |
| gem.value1 | über 23 % (2025) | 3 | 1.50 | 2.95 | ✅ | – | – |

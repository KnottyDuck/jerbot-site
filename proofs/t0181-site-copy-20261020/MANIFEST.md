# T-0181 screenshot evidence

Full-page Chrome captures of the local branch at head `d4389aefec46847682b14a8d91cb9b6006f1dcc1` plus the About CSS correction. The final commit SHA is recorded in the inbox handoff. `results.json` records each route, viewport, theme, console/CSP result, and horizontal overflow.

| Route | Theme | Viewport | Screenshot |
|---|---|---|---|
| `/about.html` | Light | 390×844 | [chrome-about-light-390.png](chrome-about-light-390.png) |
| `/about.html` | Light | 1440×900 | [chrome-about-light-1440.png](chrome-about-light-1440.png) |
| `/about.html` | Dark | 390×844 | [chrome-about-dark-390.png](chrome-about-dark-390.png) |
| `/about.html` | Dark | 1440×900 | [chrome-about-dark-1440.png](chrome-about-dark-1440.png) |
| `/rug-pulled.html` | Light | 390×844 | [chrome-rug-pulled-light-390.png](chrome-rug-pulled-light-390.png) |
| `/rug-pulled.html` | Light | 1440×900 | [chrome-rug-pulled-light-1440.png](chrome-rug-pulled-light-1440.png) |
| `/rug-pulled.html` | Dark | 390×844 | [chrome-rug-pulled-dark-390.png](chrome-rug-pulled-dark-390.png) |
| `/rug-pulled.html` | Dark | 1440×900 | [chrome-rug-pulled-dark-1440.png](chrome-rug-pulled-dark-1440.png) |

The About tagline was asserted at 24px/600 on desktop and 19px/600 on phone, matching the homepage's font treatment. All eight states had zero horizontal overflow, console errors, and CSP violations. The two Rug Pulled! punctuation strings were asserted in the rendered text.

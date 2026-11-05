| Date (IST) | Change |
|---|---|
| 2026-11-05 | **[Claude]** New page `trading.html` (live trading screen top strip: 12 glossy trend tiles). Data: Apps Script `dash` live, else `data/snapshot.json` built every 5 min by `.github/workflows/snapshot.yml` (read via raw.githubusercontent so no Pages redeploy per build). The existing macro dashboard `index.html` is untouched. |
| 2026-11-05 | **[Claude]** trading.html redesigned: each of the 2 groups is four strips of separate smoky tiles — headers, levels (price · points · %), trend tag, support/resistance (S1 S2 R1 R2, classic pivots from the previous session; outlined when within 0.35% of price). Sparklines removed. `snapshot.py` now also fetches daily bars to compute the pivots. |

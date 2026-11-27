[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/musemosmouses/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/musemosmouses/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Turkey Trouble — 3 zones, 1000m dash, 1 relentless farmer

Thanksgiving is coming, and you are the main course. **Turkey Trouble** is a
side-view auto-runner with a stealth twist: sprint 1000 metres from the
farmyard, through the barn, and out of the kitchen — while one relentless
farmer chases, searches and corners you the whole way.

## How to play

Serve `game/` with any static server and open `game/index.html`:

```sh
python3 -m http.server 8080 --directory game
```

No build step, no network, no libraries: vanilla JS canvas, all art drawn in
code, all sound synthesised with WebAudio.

| Key | Action |
| --- | --- |
| Space / ↑ / W | Jump |
| ↓ / S | Slide — or hide inside a nearby hay bale |
| Shift | Dash (costs stamina) |
| P | Pause |
| M | Mute |
| Enter / click | Start & restart |

## The run

- **3 zones by distance** — Farmyard (0–350m), Barn (350–700m), Kitchen
  (700–1000m). Palette, scenery and hazards change as you run.
- **The farmer** — chase, search and sprint states. Hide in a haystack and he
  stops to scan with a comic `?!`. The gap bar at the bottom is your life:
  gap 0 means caught.
- **5 hazards** — fences to jump, rolling pumpkins, swinging carving knives,
  timed oven fire-jets, and hay bales to jump or hide in.
- **Pickups** — corn +10, golden corn +50, feather shield (absorbs one hit).
- **3 hearts** — a hit costs one and a burst of feathers; reach 1000m and you
  are **ESCAPED — PARDONED!**

Staged screenshots for the judges: open `game/index.html?shot=title`,
`?shot=farm`, `?shot=kitchen` or `?shot=escaped`.

Built for the [make.fun turkey escape game bounty](https://make.fun/bounty/turkey-run-game-01).
Try make.fun yourself: https://make.fun/r/w3zshnah

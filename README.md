# MLB Baseball Game

A 3D MLB The Show-style baseball game built with **Three.js** + **Vite**.

## Run It

```bash
npm install
npm run dev
```

Then open http://localhost:3000 (it should auto-open).

## How to Play

The user controls the **HOME** team. You bat in the bottom of every inning and pitch/field in the top.

### Batting (bottom of innings)
- **Left-click** anywhere to request a pitch — the AI pitcher winds up and throws.
- **SPACE** swings the bat. You can't choose the pitch; you have to time your swing.
  - Start your swing about a quarter-second before you want contact.
  - Hit the ball perfectly to crush it — possibly out of the park.
- If you don't swing and the pitch is in the strike zone, it's a strike. If it's outside, it's a ball.

### Pitching (top of innings)
- Camera rotates around to look at the batter from behind the pitcher.
- **1, 2, 3, 4** picks your pitch type (Fastball / Curve / Slider / Change).
- **Aim** in the pitch box (bottom-right). Move your mouse over it or use **WASD** to drag the red dot.
  - Inside the box = strike zone. Outside = ball.
- **SPACE** throws the pitch.

### Fielding (after the AI hits a ball into play)
- The closest fielder to the ball is auto-selected (yellow ring under their feet).
- **WASD** moves them. Walk into the ball to pick it up.
- **SPACE** throws the ball to the base where a runner is most likely to be put out.

### Base Running
Visible runners sprint between bases automatically on hits, walks, and home runs.

### Other Controls
- **ESC** — Pause / Resume

## Project Structure

```
mlb-baseball-game/
├── index.html          # All HTML + CSS for the UI
├── package.json
├── vite.config.js
└── src/
    └── main.js         # All game code in one file (~2440 lines)
```

## Notes

- Game is 9 innings by default. The "Quick Exhibition" menu button drops it to 3.
- The pitcher's mound, basepaths, foul lines, and outfield wall all use real MLB dimensions (90 ft basepaths, 60'6" pitching distance, 330 ft fences).
- All visuals (players, bat, ball stitching, grass, crowd) are procedurally generated — no asset files required.

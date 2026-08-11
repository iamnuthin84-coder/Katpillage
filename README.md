# Katpillage: Caterpillar Command

A browser-based artillery prototype inspired by classic turn-based terrain battles, but starring cartoon caterpillar troops that can eventually evolve into bomb-dropping butterflies.

## Is it deployed?

Not yet. This repository currently contains a static web prototype only. The main `index.html` file is now self-contained, so you can download just that one file and open it in any modern browser. You can also deploy the repository to any static hosting service such as GitHub Pages, Netlify, Vercel, Cloudflare Pages, or an S3/static bucket.

## How to play locally

You do not need a build step. For the easiest test, use only `index.html`; the `src/` files are kept as readable source copies for development.

### Option 1: Open the file directly

1. Download `index.html`.
2. Open `index.html` in a modern desktop browser.
3. The game should load immediately, including its styling and gameplay logic.

### Option 2: Run a local static server

From the repository root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Basic controls

1. Choose a **Difficulty**:
   - **Easy** shows the clearest dotted landing guide.
   - **Normal** shows a rougher dotted landing guide.
   - **Hard** hides the guide.
2. Choose an unlocked **Stage**.
3. Select an available **Weapon** from the left panel.
4. Adjust **Angle** and **Power**.
5. Click **Fire!** to launch the selected weapon.
6. Survive the enemy turn and keep attacking until one side is defeated.
7. Win battles to gain XP. Promotions unlock stronger troops, stronger weapons, later stages, and eventually butterfly evolution.
8. At General rank 4, click **Evolve** to turn the active caterpillar into a butterfly bomber.

## Current prototype features

- Multiple stage themes with different colors, briefings, troop limits, and rank gates.
- Cartoon caterpillar squads and butterfly bomber evolution.
- Spearmen, bowmen, slingshot troops, riflemen, grenadiers, rocket launchers, stealth miners, and butterfly bombers.
- Spears, arrows, stones, bullets, grenades, rockets, heat seekers, cluster bombs, mines, and butterfly bombs.
- Destructible terrain and obstacles for explosive/cover-damaging weapons.
- Wind-influenced projectile physics.
- Simple enemy AI.
- XP and General rank progression.

## Testing

Run the JavaScript syntax check:

```bash
npm test
```

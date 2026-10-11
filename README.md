# Ironbound (demo)

A small RuneScape-style idle game for phones and desktops. Plain ES modules + canvas, no build step, no runtime dependencies.

**Play loop:** create a character (name + look) → tap the ground to walk → tap a monster or resource node and the hero walks over, auto-attacks / auto-gathers and repeats on that target until you pick another (or HP gets low and you retreat) → smelt bars at the furnace, smith gear at the anvil, equip it, sell loot to the store, bank items.

## What is in the demo
- **Skills (RS XP curve, 1-99):** Attack, Strength, Defence, Hitpoints, Mining, Smithing, Woodcutting, Fishing, Cooking. Combat level uses the RS formula.
- **Combat:** RS accuracy and max-hit formulas (effective level + 64-based gear bonuses), 4 xp per damage split by stance (Accurate / Aggressive / Defensive) plus 1.33 Hitpoints xp. Stance row is always visible. Low HP (<40%) makes the hero retreat; dying sends you back to the start.
- **Areas:** Starter Meadow (chickens, goblins, copper, tin, trees; bank chest, general store, furnace, anvil) and Stony Quarry (wolves, iron, oak; needs combat level 10). Walk to the sign at the edge or use the Map tab.
- **Gear:** deterministic Bronze/Iron/Steel/Mithril/Adamant/Rune tables (levels 1/1/5/20/30/40). Only Bronze and Iron are craftable for now; heads, bodies, legs, shields, daggers and swords exist for every tier.
- **Crafting:** furnace smelts bronze bars (copper + tin) and iron bars (Smithing 15, 50% success); anvil smiths dagger/sword/helm/kiteshield/platelegs/platebody with Smithing level requirements. Stations unlock once you have walked up to them.
- **Bag (28 slots) / bank / store:** stackables, bank chest in the Meadow, sell at 50% value, buy tools.
- **XP rate:** one constant, `XP_RATE` in `src/data.js` (now 3), multiplies every XP gain (combat, gathering, crafting). The level table is the real RuneScape one, so changing the rate never changes a stored level. Level 2 takes ~3 chicken kills in any stance; level 5 ~3-5 min, level 10 ~9-14 min of fighting.
- **Fishing + Cooking:** net spot (shrimp/anchovies) in the Meadow; rod + feather bait (trout/salmon), harpoon (tuna/swordfish) and lobster pot spots in the Quarry (level-gated). Cook at the Meadow range or either campfire (burn chance falls with level, range burns less; burnt food is left behind). Raw chicken/beef/wolf meat can be cooked too. Tools, bait and food-selling in the general store.
- **Eating:** tap the food chip (next to the HP bar) or a food item to eat (fixed heal, short delay between bites). **Auto-eat** (Settings: off / 30% / 50% / 70%) eats the best food in combat; with food in the bag the hero never retreats.
- **Offline progress:** the current target is saved every 3 s and on tab hide/close. After >60 s away the hero's fight or gathering is simulated at 50% pace, capped at 3 h (`OFFLINE` in `src/data.js`; code in `src/offline.js`), stopping early if HP/food/bait/tool would run out. A "Welcome back" popup lists time away, XP, level-ups, items, coins and food eaten; overflow goes to the bank.
- Saves to `localStorage` (single slot, versioned with migration).

## Not yet (data structures are ready for them)
Co-op, trading, classes, enchanting, ranged, magic, prayer, fletching/crafting/herblore. Item/skill/recipe/area definitions are plain tables in `src/data.js`, so more tiers, skills and areas are data additions.

## Layout
`src/data.js` tables · `src/combat.js` pure formulas · `src/game.js` model (inventory, crafting, area simulation) · `src/scene.js` canvas renderer + tap input · `src/art.js` procedural art · `src/ui.js` HUD, nav and bottom sheets · `src/save.js` · `server.js` static server with `/healthz`.

## Run / test
```
npm start            # node server.js, honours PORT, binds 0.0.0.0
npm test             # unit tests (XP, combat, tiers, recipes, gathering, saves)
node test/e2e.mjs    # headless Chrome smoke test at 390x844 touch (needs puppeteer-core; PUPPETEER_PATH / CHROME_PATH)
```

## Deploy (Render web service)
Runtime Node, build `npm install`, start `node server.js`, health check `/healthz`. See `render.yaml`.

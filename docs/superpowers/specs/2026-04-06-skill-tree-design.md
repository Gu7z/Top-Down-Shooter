# Skill Tree — Design Spec
**Date:** 2026-04-06  
**Project:** NEON HUNT — Top-Down Shooter  
**Status:** Approved

---

## Overview

Replace temporary in-run buff pickups with a permanent skill tree. The player earns credits from run performance, spends them from the main menu, and uses a 2D Pixi constellation map to unlock permanent upgrades.

The skill tree is not a Three.js/3D feature. It must stay in PixiJS and feel like a polished 2D cyberpunk constellation/neural map with pan/zoom, hover tooltips, and direct node interactions.

---

## Player Loop

1. Player starts a run from the main menu.
2. During the run, the game records performance stats.
3. On death/end run, the game shows a run-summary/achievements screen.
4. The run summary awards credits based on performance.
5. Player returns to the main menu.
6. Player opens `SKILL TREE` from the main menu.
7. Player spends credits on permanent upgrades.
8. Future runs use the purchased upgrades.

The run-summary screen must not sell upgrades. Upgrade purchase happens only in the main-menu skill tree screen.

---

## Progression And Economy

Credits are permanent and persisted locally, initially via `localStorage`.

Credits are based on run performance, not only final score. The first implementation should track:

- Final score.
- Time survived.
- Shots fired.
- Shots hit.
- Accuracy percentage.
- Kills by enemy type.
- Boss kills.
- Credits earned from the run.

The exact formula can be tuned during implementation/playtesting, but it must be explainable in the run summary.

Example credit inputs:

- Score-based base reward.
- Kill reward by enemy type.
- Accuracy bonus.
- Boss bounty.
- Survival time bonus.

---

## Skill Tree Size

Initial tree:

- `CORE` root node.
- 6 main branches.
- 5 base upgrades per branch.
- 6 fusion upgrades.
- 3 capstones.
- Total: `CORE + 39 upgrade nodes`, for `40` visible nodes total.

Branches, in map order:

1. `Firepower`
2. `Mobility`
3. `Survival`
4. `Economy`
5. `Tech`
6. `Control`

Branch order wraps from `Control` back to `Firepower`.

---

## Base Upgrade Themes

`Firepower`:

- Fire rate.
- Bullet speed.
- Bullet damage.
- Light multishot.
- Crit or overheat-style offensive scaling.

`Mobility`:

- Move speed.
- Dash.
- Dash cooldown.
- Short dash invulnerability.
- Drift/strafe control.

`Survival`:

- Max HP.
- Shield.
- Shield regen delay.
- Short damage reduction after hit.
- Emergency shield.

`Economy`:

- Credit gain.
- Score bonus.
- Streak reward.
- Boss bounty.
- Refund/discount efficiency.

`Tech`:

- Drone helper.
- Drone fire rate.
- Drone targeting.
- Pickup magnet or scan range.
- Drone overclock.

`Control`:

- Slow field.
- Knockback.
- Enemy weaken.
- Chain/pulse control.
- Crowd-control duration.

---

## Fusion And Capstone Upgrades

Fusion upgrades only exist between neighboring branches to keep the constellation legible.

Initial fusion set:

- `Firepower + Mobility`: shooting while dashing or dash reload.
- `Mobility + Survival`: dash grants shield.
- `Survival + Economy`: bonus credits after surviving low HP.
- `Economy + Tech`: drones increase credit pickup or bounty value.
- `Tech + Control`: drones apply slow or mark enemies.
- `Control + Firepower`: controlled enemies take bonus shot damage.

Capstones:

- `Overdrive Matrix`: strong offensive final upgrade.
- `Adaptive Reactor`: strong defensive/economy final upgrade.
- `Synapse Swarm`: strong tech/control final upgrade.

Capstones must require multiple prerequisites and high cost.

---

## Skill Tree UI

The skill tree screen is accessed from a new `SKILL TREE` main-menu button.

Core UI rules:

- Rendered in PixiJS.
- 2D `Gem Socket Tree` over a compact constellation/neural web.
- The approved visual base is `Compact Constellation Tree`, with socket-like upgrade nodes arranged in connected branch clusters.
- Base upgrades render as circular socket rings with a colored inner gem.
- Fusion upgrades render as magenta diamond sockets between neighboring branch clusters.
- Capstones render as larger gold diamond sockets at the outer ends.
- The top `Control + Firepower` and `Firepower + Mobility` fusion diamonds need extra spacing from the Firepower socket cluster so they do not visually collide.
- Pan and zoom are required.
- Camera opens by framing only purchased upgrades.
- If no upgrades are purchased, camera opens on `CORE`.
- The full tree exists in data, but the UI is progressive: distant nodes are hidden until relevant.
- Eligible nearby nodes can appear as subtle signals near the purchased region.
- The screen must not open showing the entire 40-node tree.
- Normal upgrades must look clickable, not like passive decorative stars.
- Fusion nodes must be visually distinct from normal upgrades through both shape and color.
- Capstones must be visually distinct from fusion and normal upgrades through size, shape, and gold color.
- Avoid visual collisions. No node should visually sit on top of another node.
- Avoid large side panels.
- Hovering a node shows a compact tooltip.
- Tooltip must reposition/clamp to avoid covering the hovered node or leaving the canvas.
- Tooltip contains name, type, cost, effect, prerequisites, and status.
- Left click on an eligible node unlocks it.
- Right click on a purchased node removes it.
- Right-click removal cascades through dependent purchased upgrades.
- Cascade removal refunds all affected upgrades fully.

The first implementation should treat `1280×720` as the primary target because `public/index.js` creates the Pixi application at `1280×720`.

---

## Camera Rules

The skill tree camera must derive the initial viewport from purchased nodes.

Initial framing:

- No purchased upgrades: frame `CORE`.
- Some purchased upgrades: frame the bounding box of purchased nodes only.
- Do not include unrevealed or distant available nodes in the opening frame.
- Add comfortable padding around the framed purchased set.
- Clamp min/max zoom so the view never becomes unreadable.

This rule exists to prevent the screen from opening as a dense, visually noisy 40-node diagram.

---

## Respec Rules

Right click on a purchased upgrade removes it and all purchased upgrades that depend on it.

Refund:

- Refund is total.
- Refund applies to the clicked node and all cascade-removed dependents.
- Credits are restored immediately.

UX:

- Hover or right-click feedback should make the cascade understandable.
- If practical in the first version, preview affected dependents before applying the cascade.
- If preview is deferred, the tooltip must still state that right click removes dependents.

---

## Run Summary Screen

The current game-over modal should evolve into a run-summary/achievements screen.

Required content:

- Final score.
- Credits earned this run.
- Accuracy.
- Shots fired and shots hit.
- Time survived.
- Kills by enemy type.
- Boss kills.
- Interesting run achievements or highlights.

The run summary should feel like part of the cyberpunk HUD style, not a plain table.

Example achievement-style highlights:

- High accuracy.
- Long survival.
- Boss defeated.
- Large kill streak.
- Low-HP recovery.

---

## Buff Removal And Rebalance

The existing temporary buff pickup should be removed from the run loop as a power source.

The current buff effect, which temporarily changes fire rate, should be converted into a permanent skill-tree upgrade concept under `Firepower`.

Because player power becomes permanent, enemy spawning and difficulty need rebalancing after the skill tree is integrated.

Known current balance context:

- Player starts with 1 life.
- Player speed is fixed at 2.
- Shooting has `bulletSpeed = 4`, `fireVelocity = 1`, and `shootInterval = 0.3`.
- Current buff doubles fire velocity temporarily.
- Spawner increases `spawnLimit` over time.
- Bosses spawn around score multiples of 50.

The implementation plan should include balance tests and playtest-oriented tuning points rather than hardcoding final values too early.

---

## Data And Persistence

Use data-driven skill definitions.

Recommended persisted state:

- Total credits.
- Purchased skill ids.

Lifetime aggregate stats are out of scope for the first implementation; only run-local stats are required for the run-summary screen.

Recommended runtime data model:

- Skill id.
- Display name.
- Branch.
- Type: `core`, `base`, `fusion`, `capstone`.
- Cost.
- Description.
- Effects.
- Prerequisite ids.
- Position in tree coordinates.
- Reveal rules.

The rendering layer should consume this data rather than hardcoding upgrade positions and effects in the Pixi screen class.

---

## Visual QA Requirements

The skill tree is visually sensitive and must be reviewed critically before presenting as complete.

Required QA:

- Use Playwright screenshots at `1280×720`.
- Inspect the opening camera state with no purchased upgrades.
- Inspect a state with several purchased upgrades.
- Inspect a hover tooltip state.
- Inspect an unlock state.
- Inspect a right-click cascade removal state.
- Verify that the tooltip does not cover the hovered node.
- Verify that normal nodes, fusion nodes, and capstones are distinguishable.
- Verify that nodes do not visually overlap.
- Verify that the screen reads as a game UI, not a technical diagram.
- Verify that the map remains usable after pan/zoom.

During brainstorming, several mockups were rejected because they looked like diagrams, had node collisions, or tried to show too much of the tree at once. The implementation must avoid repeating those failures.

---

## Out Of Scope For First Pass

- Three.js or 3D camera.
- Online/cloud save.
- Purchasing upgrades from the run-summary screen.
- Final numeric balance perfection.
- Full responsive layout beyond the current `1280×720` Pixi canvas target.

---

## Open Implementation Notes

- The exact credit formula should be decided during implementation with tests and tuning hooks.
- Exact upgrade numeric values should start conservative and be adjusted after the tree works end-to-end.
- Tooltip collision behavior should be implemented before visual signoff.
- The plan should remove `src/buff.js` from the live game loop only after tests cover the replacement progression path.

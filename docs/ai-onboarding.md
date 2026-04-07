# AI Onboarding for the Top-Down Shooter Demo

## Project purpose
This repository is a simple yet complete demo of a top-down shooter built with **PIXI.js**. The experience is centered on a single run: the player moves with the keyboard, aims with the mouse, and survives increasingly difficult waves while collecting points, dashing, and upgrading skills between runs. Each run ends when the player dies or quits, and the HUD, effects, and score tracking all reset while the skill tree keeps progress between attempts. The goal of this document is to give AI operators (Codex, Claude, Antigravity, etc.) the minimum context needed so future prompts can assume the same mental model.

## Gameplay loop in a nutshell
1. `src/menu.js` renders the start screen. After the player types a username and starts, `src/game.js` constructs the engine and hands control to `WaveManager`.
2. `WaveManager` sequences enemy waves, spawns from `src/spanwer.js`, and signals bosses when it is time. It keeps the HUD in sync via callbacks (`renderBanner`, `updateBossBar`, `finishGame`).
3. The `Player` (`src/player.js`) tracks inputs (`controls.js`) and triggers shooting, dashing, and animations. Shooting spawns bullets (`src/shooting.js`) that interact with `EnemyBullet` (`src/enemy_bullet.js`).
4. Enemy behaviors (`src/enemy.js`, `src/boss_enemy.js`, `src/drone.js`) and their projectiles update each tick, while `Effects` (`src/effects.js`) and `audio.js` provide polish.
5. When the run ends, `RunSummary` (`src/run_summary.js`) renders stats derived from `progression/run_stats.js` and awards credits to `progression/skill_tree_state.js` using `skill_effects`.

## Core systems & entry points
- **Game coordinator** (`src/game.js`): wires the app stage, HUD, wave manager, player, drones, skill effects, and settings. Hooks input listeners for toggling pause/mute/dash and manages cleanup.
- **Player, shooting, and bullets** (`src/player.js`, `src/shooting.js`, `src/enemy_bullet.js`): handle movement, aiming, firing, and interactions with enemies. The player keeps a `points` counter that feeds `run_stats`.
- **Enemies and spawning** (`src/enemy.js`, `src/boss_enemy.js`, `src/spanwer.js`): define enemy types, spawn logic, and bullet behaviors. `WaveManager` owns the high-level timeline and calls the spawner container.
- **HUD & effects** (`src/hud.js`, `src/effects.js`): draw health bars, boss information, banners, run summaries, and manage visual feedback (camera shake, sprites) so UI and gameplay remain coordinated.
- **Progression & skill tree** (`src/progression/*`): the skill tree state, skill effects, and run stats + summary functions live here. They persist player credits between runs and change how enemies/player behave once bought.
- **Utility/public assets** (`public/`): contains static assets like background imagery, sound placeholders, and fonts that the Snowpack dev server serves.
- **Settings and UI systems** (`src/settings.js`, `src/ui_system.js`, `src/controls.js`): manage toggles (sound, mute, dash key), abstract UI helpers, and translate DOM/PIXI inputs into game state flags.

## Repository layout highlights
- `src/`: all TypeScript-like modules powering the gameplay, progression, UI, and utilities. When making changes, try to keep files focused on a single responsibility and update `hud`, `wave_manager`, or `progression` in tandem if those systems interact.
- `public/`: static assets served at runtime (images, audio, fonts). Updates here usually require the Snowpack dev server to be restarted.
- `docs/`: living documentation like this file, the pending onboarding spec (`docs/superpowers/specs/2026-04-07-ai-onboarding-design.md`), and future plans.
- `build/`: output of `npm run build` (Snowpack). You generally do not edit files here directly.
- `package.json` & `package-lock.json`: declare dependencies (`pixi`, `victor`, etc.) and scripts (see below). Keep them in sync when adding packages.
- `test/`: contains automated tests (if they exist). The repository currently relies on `node --test` with `c8` for coverage, so update tests together with logic changes.

## Running, building, testing
- Install with `npm install` (Snowpack, c8, dotenv plug-ins).
- Run locally via `npm start` (starts `snowpack dev --polyfill-node` and serves `public/` via `localhost:8080` by default). Use `npm run build` before deploying to generate optimized assets under `build/`.
- Execute tests with `npm test`. The script uses the Node test runner plus `c8` for coverage reporting. Review the coverage badge in `README.md` afterwards.
- Keep live reload in mind: Snowpack rebuilds modules on save, but changes to `public/` often require refreshing the browser.

## Contribution cues for AI agents
- When adding or adjusting gameplay logic, consider which systems need coordination (e.g., new enemies must register with `WaveManager` and `Spawner`, while HUD readouts may need new banners or boss bars).
- Keep the player loop clean: prefer adding new behaviors through skill effects (`progression/skill_effects.js`) rather than scattering state across `Player` or `HUD`.
- Document architectural changes here. If a new subsystem is introduced (e.g., new enemy type, UI panel, or progression path), add a short summary to this file and adjust `docs/superpowers/specs/` accordingly so agents can keep referencing it.
- Encourage deduplication: there are explicit helper modules for audio, effects, and UI systems; reuse them rather than reimplementing shared behaviors.
- Use `window.EnemyBulletClass` (set in `src/game.js`) when enemy bullets need to instantiate new projectiles without deep constructor dependency passing.

## High-level reminders
- The experience is single-player, wave-based, and skill-tree aware; understanding how `WaveManager`, `SkillTree`, and `RunSummary` interact helps avoid regressions.
- Most persistent state is stored through `progression/*` (skill credits, run stats). Temporary run state lives in `Player`, `WaveManager`, and `Hud`.
- Respect the existing input hooks (pointer mouse, keyboard) so new features do not accidentally capture `Escape`/`Shift`/`m`.
- Update this onboarding file any time the repository’s purpose shifts or major systems are refactored, especially because AI agents rely on it to bootstrap their context.

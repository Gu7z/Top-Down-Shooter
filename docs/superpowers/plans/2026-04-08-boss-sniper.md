# Boss Sniper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o boss da wave 10 por um sniper com kite agressivo e tiro preditivo rápido.

**Architecture:** `WaveManager` passa a spawnar `boss_sniper` na wave 10. `BossEnemy` ganha um perfil de movimento/ataque dedicado para sniper e `EnemyBullet` aceita velocidade customizada para o projétil rápido sem mudar o comportamento padrão dos demais tiros.

**Tech Stack:** JavaScript ESM, PIXI.js, Victor, Node test runner, c8

---

### Task 1: Cobrir o novo boss com testes

**Files:**
- Modify: `test/boss_enemy.test.js`
- Modify: `test/wave_manager.test.js`
- Modify: `test/enemy_bullet.test.js`

- [ ] **Step 1: Write failing tests for wave 10 sniper spawn, predictive aim, and high-speed bullet support**
- [ ] **Step 2: Run `npm test -- test/boss_enemy.test.js test/wave_manager.test.js test/enemy_bullet.test.js` and verify the new assertions fail**
- [ ] **Step 3: Keep old boss coverage intact for unaffected bosses**
- [ ] **Step 4: Re-run the same test slice after implementation**

### Task 2: Implement the sniper boss

**Files:**
- Modify: `src/wave_manager.js`
- Modify: `src/boss_enemy.js`
- Modify: `src/enemy_bullet.js`

- [ ] **Step 1: Replace the wave 10 boss definition with `boss_sniper`**
- [ ] **Step 2: Add sniper movement profile and predictive shot helper**
- [ ] **Step 3: Extend enemy bullets with configurable speed while keeping defaults unchanged**
- [ ] **Step 4: Verify other boss patterns still use their existing bullets and timers**

### Task 3: Verify integration

**Files:**
- Modify: `docs/superpowers/specs/2026-04-08-boss-sniper-design.md`
- Modify: `docs/superpowers/plans/2026-04-08-boss-sniper.md`

- [ ] **Step 1: Run `npm test -- test/boss_enemy.test.js test/wave_manager.test.js test/game.test.js test/enemy_bullet.test.js`**
- [ ] **Step 2: Run `npm test` and note unrelated pre-existing failures if they remain**
- [ ] **Step 3: Confirm the docs still match the implemented sniper behavior**

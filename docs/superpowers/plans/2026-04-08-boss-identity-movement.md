# Boss Identity Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar identidade estratégica de movimento para cada boss sem mexer em vida, dano ou padrões de tiro.

**Architecture:** `BossEnemy` passa a calcular movimento a partir de um perfil por boss com distância preferida, órbita, pressão radial e burst opcional. Os ataques continuam no mesmo arquivo e os testes focam em comportamento observável de movimento.

**Tech Stack:** JavaScript ESM, PIXI.js, Victor, Node test runner, c8

---

### Task 1: Cobrir identidades de movimento com testes

**Files:**
- Modify: `test/boss_enemy.test.js`
- Test: `test/boss_enemy.test.js`

- [ ] **Step 1: Write failing tests for guardião orbit, colosso diagonal pressure, and predador burst reposition**
- [ ] **Step 2: Run `npm test -- test/boss_enemy.test.js` and verify the new assertions fail**
- [ ] **Step 3: Keep attack-pattern assertions unchanged to guard against regressions**
- [ ] **Step 4: Re-run `npm test -- test/boss_enemy.test.js` after implementation**

### Task 2: Implement movement profiles in BossEnemy

**Files:**
- Modify: `src/boss_enemy.js`

- [ ] **Step 1: Add boss movement state needed for deterministic repositioning**
- [ ] **Step 2: Implement per-boss movement profiles and vector blending**
- [ ] **Step 3: Add optional burst behavior only for bosses that need it**
- [ ] **Step 4: Clamp movement to the arena and preserve existing attack logic**

### Task 3: Verify gameplay-facing behavior

**Files:**
- Modify: `docs/superpowers/specs/2026-04-08-boss-identity-movement-design.md`
- Modify: `docs/superpowers/plans/2026-04-08-boss-identity-movement.md`

- [ ] **Step 1: Run `npm test -- test/boss_enemy.test.js test/wave_manager.test.js`**
- [ ] **Step 2: Run `npm test` and note unrelated pre-existing failures if they remain**
- [ ] **Step 3: Confirm docs still describe the implemented identities accurately**

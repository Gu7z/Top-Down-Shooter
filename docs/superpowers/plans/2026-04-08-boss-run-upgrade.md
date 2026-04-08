# Boss Run Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um novo run upgrade que aumente dano em boss para todas as fontes que já usam o funil central de dano.

**Architecture:** O catálogo de upgrades ganha uma nova entrada `boss_hunter`, o estado expõe `bossDamageMultiplier` com valor neutro por padrão, e a aplicação real do bônus ocorre em `Enemy.kill(...)` quando `isBoss` estiver ativo. A tela de upgrades recebe um ícone dedicado para a nova carta.

**Tech Stack:** JavaScript ESM, PIXI.js, Node test runner, c8

---

### Task 1: Cobrir o novo upgrade com testes de dados e estado

**Files:**
- Modify: `test/run_upgrades/run_upgrade_data.test.js`
- Modify: `test/run_upgrades/run_upgrade_state.test.js`
- Test: `test/run_upgrades/run_upgrade_data.test.js`
- Test: `test/run_upgrades/run_upgrade_state.test.js`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run `npm test -- test/run_upgrades/run_upgrade_data.test.js test/run_upgrades/run_upgrade_state.test.js` and verify they fail for the missing upgrade/effect**
- [ ] **Step 3: Add the new registry entry and default effect**
- [ ] **Step 4: Re-run the same tests and verify they pass**

### Task 2: Cobrir e implementar o multiplicador em boss

**Files:**
- Modify: `test/enemy.test.js`
- Modify: `src/enemy.js`
- Test: `test/enemy.test.js`

- [ ] **Step 1: Write the failing test for boss-only damage amplification**
- [ ] **Step 2: Run `npm test -- test/enemy.test.js` and verify the new assertion fails**
- [ ] **Step 3: Apply the multiplier in `Enemy.kill(...)` only when `this.isBoss`**
- [ ] **Step 4: Re-run `npm test -- test/enemy.test.js` and verify it passes**

### Task 3: Expor a carta nova corretamente

**Files:**
- Modify: `src/run_upgrades/run_upgrade_screen.js`

- [ ] **Step 1: Add a dedicated icon branch for `boss_hunter`**
- [ ] **Step 2: Verify the switch stays exhaustive for all known upgrades**

### Task 4: Verificação final

**Files:**
- Modify: `docs/superpowers/specs/2026-04-08-boss-run-upgrade-design.md`
- Modify: `docs/superpowers/plans/2026-04-08-boss-run-upgrade.md`

- [ ] **Step 1: Run targeted verification with `npm test -- test/run_upgrades/run_upgrade_data.test.js test/run_upgrades/run_upgrade_state.test.js test/enemy.test.js`**
- [ ] **Step 2: Run full verification with `npm test`**
- [ ] **Step 3: Confirm docs still match the implemented behavior**

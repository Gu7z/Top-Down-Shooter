# Boss Damage Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o empilhamento indevido de weaken, alinhar o número flutuante ao dano real e sincronizar a vida visível do inimigo imediatamente após receber dano.

**Architecture:** O ajuste fica concentrado no pipeline `bullet_hit -> enemy.applyControlEffects/kill -> HUD feedback`. A correção evita stack exponencial do debuff por reaplicação, faz `kill()` retornar o dano efetivo para o feedback visual e sincroniza `enemyLifeText` no momento em que a vida muda, sem alterar o resto do loop de combate.

**Tech Stack:** Node test runner, PIXI mocks locais, módulos ESM do jogo.

---

### Task 1: Cobrir o empilhamento de weaken

**Files:**
- Modify: `test/enemy.test.js`
- Modify: `src/enemy.js`

- [ ] **Step 1: Write the failing test**
  Verificar que reaplicar `enemyWeakenMultiplier` não multiplica novamente enquanto o debuff já está ativo.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- test/enemy.test.js`
  Expected: FAIL no teste novo porque `damageMultiplier` cresce acima do valor único esperado.

- [ ] **Step 3: Write minimal implementation**
  Guardar o weaken ativo por valor/tipo e renovar duração sem multiplicar novamente a cada hit.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- test/enemy.test.js`
  Expected: PASS

### Task 2: Cobrir dano real e sync do texto de vida

**Files:**
- Modify: `test/enemy.test.js`
- Modify: `test/bullet_hit.test.js`
- Modify: `src/enemy.js`
- Modify: `src/utils/bullet_hit.js`

- [ ] **Step 1: Write the failing tests**
  Verificar que `kill()` retorna o dano efetivo aplicado, sincroniza `enemyLifeText.text` imediatamente e que `bulletHit()` passa o dano efetivo ao feedback visual.

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm test -- test/enemy.test.js test/bullet_hit.test.js`
  Expected: FAIL porque `kill()` hoje não retorna dano efetivo, não sincroniza o texto no hit e `bulletHit()` mostra só `bullet.damage`.

- [ ] **Step 3: Write minimal implementation**
  Fazer `kill()` retornar `effectiveDamage`, atualizar `enemyLifeText.text` sempre que `life` mudar e usar esse retorno em `bullet_hit`.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm test -- test/enemy.test.js test/bullet_hit.test.js`
  Expected: PASS

### Task 3: Regressão focada no loop do jogo

**Files:**
- Modify: `test/game_upgrades.test.js`

- [ ] **Step 1: Write the failing regression test**
  Validar no nível de `Game` que um hit no boss deixa o texto de vida atualizado no mesmo tick.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- test/game_upgrades.test.js`
  Expected: FAIL antes da correção.

- [ ] **Step 3: Verify after production changes**
  Reusar a implementação das tarefas anteriores; não adicionar lógica extra se os testes já cobrirem o bug.

- [ ] **Step 4: Run targeted and broader verification**
  Run: `npm test -- test/enemy.test.js test/bullet_hit.test.js test/game_upgrades.test.js`
  Expected: PASS

- [ ] **Step 5: Run project verification**
  Run: `npm test`
  Expected: PASS

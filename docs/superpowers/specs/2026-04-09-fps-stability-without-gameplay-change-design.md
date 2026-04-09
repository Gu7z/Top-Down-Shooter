# FPS Stability Without Gameplay Change

**Date:** 2026-04-09  
**Status:** Draft for review

---

## Goal

Eliminar as quedas bruscas de FPS e a sensação de "slow motion" sem alterar em absolutamente nada:

- gameplay
- timing baseado em frames
- cadência de tiro
- velocidade de player, inimigos e projéteis
- duração de buffs/debuffs
- padrões de boss
- quantidade, duração, ordem e aparência dos efeitos visuais

O jogo deve se comportar exatamente como hoje quando o frame chega a ser processado. A mudança é puramente estrutural: reduzir o custo por frame para que essas quedas ocorram muito menos.

---

## Constraints

- Não migrar para `delta time`
- Não introduzir budgets dinâmicos que cortem ou reduzam efeitos
- Não reduzir contagem de partículas
- Não simplificar visuais
- Não mudar cores, alpha, escala, lifetime, spawn cadence ou ordem dos efeitos
- Não mexer na lógica de dano, progressão, IA ou colisão

Qualquer refactor precisa preservar a semântica atual baseada em frame.

---

## Problem Statement

Hoje o jogo desacelera quando a carga visual sobe porque a simulação inteira é baseada em frames. Quando o FPS cai, o gameplay inteiro de fato fica mais lento.

Isso por si só é intencional e aceitável para este projeto. O problema real é que existem hot paths que fazem trabalho demais por frame, especialmente sob carga de projéteis e efeitos:

1. `EnemyBullet` cria `Graphics` de trail continuamente e abre um `setInterval` separado para cada ponto do rastro.
2. `Effects` cria e destrói muitos objetos visuais (`Graphics`) para explosões e chain lightning.
3. Algumas listas quentes são reconstruídas via `filter`, aumentando churn de array e pressão de GC.

O resultado combinado é aumento de alocação, timers concorrentes e destruição frequente de objetos no pico de combate.

---

## Root Cause Summary

### 1. Trail de `EnemyBullet`

Arquivo: `src/enemy_bullet.js`

Cada projétil inimigo:

- gera um ponto de trail a cada 3 frames
- cria um novo `PIXI.Graphics` para esse ponto
- cria um novo `setInterval` para animar o fade desse ponto

Isso escala mal em padrões de boss com muitas balas simultâneas. Em um cenário de stress simples com 40 bullets simuladas por 60 frames, foram observados 800 timers ativos e 800 trail graphics acumulados.

### 2. Efeitos visuais descartáveis

Arquivo: `src/effects.js`

Explosões, chain lightning e outros efeitos criam muitos `Graphics` temporários. O comportamento visual em si está correto, mas a gestão atual de memória é cara:

- criação frequente
- destruição frequente
- churn de arrays a cada frame

### 3. Churn de arrays no hot path

Partes do loop usam `array = array.filter(...)` para atualizar partículas e pulses. Isso mantém o resultado visual correto, mas aumenta alocação desnecessária sob carga alta.

---

## Design Principles

### Preserve frame semantics exactly

Todo updater continuará operando em frames discretos. Se um trail hoje:

- nasce no frame `N`
- perde `0.05` de alpha por tick
- aplica `scale *= 0.9` por tick
- vive até certo número de frames

o novo código precisa manter exatamente isso.

### Replace parallel timers with centralized updaters

O maior ganho virá de parar de abrir timers independentes para pequenas animações visuais. Em vez disso:

- o owner do sistema mantém uma lista de entidades visuais ativas
- cada frame atualiza essas entidades em lote
- o comportamento visual final permanece idêntico

### Reuse objects instead of constantly reallocating

Sempre que possível, `Graphics` e wrappers visuais devem ser reciclados por pools ou reativação controlada, desde que isso não altere o draw result.

### Optimize memory churn without changing behavior

Trocas de `filter` para remoção in-place e reset de estado são permitidas quando preservam:

- ordem de processamento
- lifetime
- condições de remoção
- side effects

---

## Proposed Architecture

### A. Centralized enemy-bullet trail state

Arquivo principal: `src/enemy_bullet.js`

Substituir o modelo atual "um timer por ponto de trail" por:

- lista local de trail nodes ativos por bullet
- cada node carrega o mesmo estado hoje implícito no timer:
  - alpha
  - scale
  - frame age / life
- `EnemyBullet.update()` continua:
  - movendo a bala
  - gerando trail no mesmo ritmo atual
  - atualizando e descartando os trail nodes ativos

**Preservação exigida:**

- mesma frequência de spawn do trail
- mesma alpha inicial
- mesmo encolhimento por frame
- mesmo fade por frame
- mesmo momento de remoção visual

### B. Visual object reuse in `Effects`

Arquivo principal: `src/effects.js`

Adicionar pooling para objetos puramente visuais:

- partículas de explosão
- bolts de chain lightning
- anéis e flashes reutilizáveis quando fizer sentido

O pool não muda parâmetros de desenho. Ele só evita:

- `new Graphics()` em excesso
- `destroy()` em excesso

Cada instância pooled deve ser resetada para um estado idêntico ao de uma instância recém-criada antes de reutilização.

### C. In-place updates for hot arrays

Arquivos principais:

- `src/effects.js`
- `src/enemy_bullet.js`

Trocar padrões de atualização que recriam arrays a cada tick por remoção in-place, preservando a ordem observável.

Objetivo:

- menos alocação
- menos trabalho do GC
- mesmo output frame a frame

### D. Performance instrumentation for reproducible validation

Adicionar telemetria de desenvolvimento, desligada por padrão, para observar:

- enemy bullets ativas
- trail nodes ativos
- particles ativas
- pulses ativas
- children totais em containers de efeito
- timers criados por sistema visual

Essa instrumentação é para diagnóstico e regressão de performance; não muda gameplay.

---

## Scope of Code Changes

### Files expected to change

- `src/enemy_bullet.js`
- `src/effects.js`
- `test/enemy_bullet.test.js`
- `test/effects.test.js`

### Files that may change if needed

- `test/game_upgrades.test.js`
- `test/boss_enemy.test.js`
- `test/helpers.js`

### Files explicitly out of scope

- `src/player.js`
- `src/enemy.js`
- `src/boss_enemy.js`
- `src/game.js`
- `src/shooting.js`
- progression / balance files

Se alguma mudança nesses arquivos se mostrar necessária, isso deve ser tratado como exceção e justificado no plano.

---

## Testing Strategy

### Behavioral equivalence tests

Adicionar ou ajustar testes para provar:

- trail nasce com a mesma frequência
- trail perde alpha no mesmo ritmo
- trail encolhe no mesmo ritmo
- trail é removido no mesmo momento
- chain lightning continua criando o mesmo número de elementos visuais
- explosões continuam criando a mesma quantidade de partículas com o mesmo lifetime

### Structural performance tests

Adicionar testes para provar:

- trail de bullet não cria mais `setInterval` por trail node
- timers ativos por bullet não escalam com cada ponto de rastro
- estruturas pooled reaproveitam objetos em vez de só destruir/recriar

### Full regression pass

Executar a suíte completa existente para confirmar:

- gameplay intacto
- timing frame-based intacto
- nenhum bug colateral em upgrades, bosses ou efeitos

---

## Success Criteria

O trabalho só está concluído quando todos os itens abaixo forem verdadeiros:

1. O jogo preserva visual e gameplay `1:1` em inspeção de código e testes.
2. `EnemyBullet` não cria mais timers independentes por ponto de trail.
3. A quantidade de objetos descartáveis e churn de arrays no pico de efeitos cai substancialmente.
4. A suíte de testes passa integralmente.
5. O cenário de stress usado na investigação mostra redução clara de carga estrutural:
   - menos timers
   - menos alocações descartáveis
   - menos objetos ativos redundantes

---

## Non-Goals

- Resolver qualquer queda de FPS causada por hardware extremamente limitado
- Rebalancear visuais ou reduzir clutter
- Alterar a identidade do feedback de combate
- Corrigir a natureza frame-based da simulação
- Introduzir adaptive quality

---

## Recommended Execution Order

1. Medir o baseline do stress atual
2. Refatorar trail de `EnemyBullet`
3. Cobrir equivalência do trail em testes
4. Refatorar pooling/churn em `Effects`
5. Cobrir equivalência estrutural dos efeitos
6. Rodar regressão completa
7. Recomparar métricas do stress

---

## Risks

### Risk: mudar sutilmente o visual

Mitigação:

- testes de equivalência por frames
- preservar os mesmos coeficientes numéricos atuais

### Risk: pooling reter estado antigo

Mitigação:

- funções explícitas de reset por tipo de objeto visual
- testes para alpha/scale/visibility/tint/reset

### Risk: ordem de atualização mudar resultado

Mitigação:

- manter o owner original do update
- evitar mover sistemas entre tickers
- preservar ordem de processamento observável

---

## Recommendation

Executar um refactor de performance sem qualquer mudança de design:

- tirar timers por trail
- centralizar updates visuais
- reduzir churn de objetos e arrays
- manter toda a semântica atual de frame

Essa abordagem ataca a fonte real das "lagadas" sem mexer na sensação do jogo, sem mexer nos visuais e sem esconder queda de FPS com budgets dinâmicos.

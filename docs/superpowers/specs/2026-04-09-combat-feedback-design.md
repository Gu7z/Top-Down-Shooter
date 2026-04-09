# Combat Feedback System — Design Spec
**Date:** 2026-04-09  
**Status:** Approved

---

## Context

Neon Hunt já tem mecânicas sólidas (crits, chain lightning, boss waves, upgrades), mas falta o loop dopaminérgico que torna jogos como Diablo e Vampire Survivors viciantes: o feedback visual imediato e escalado de cada golpe. O jogador acerta inimigos mas não sente o impacto. Este sistema adiciona números flutuantes de dano e uma animação de morte satisfatória, transformando cada kill em um evento visualmente gratificante sem poluir a visibilidade dos inimigos.

---

## Requisitos

- Números de dano flutuantes aparecem em cada acerto de bala
- Cor e tamanho do número refletem a intensidade do dano (hierarquia visual imediata)
- Crits se destacam claramente
- Ao morrer, o inimigo executa uma animação de implosão + anel de onda expansivo
- Máximo 16 números simultâneos na tela (sem lixo de memória)
- Sem alterações no sistema de áudio
- Sem streak counter, sem texto de kill

---

## Arquitetura

### Módulo: `src/combat_feedback.js`

Módulo único exportando duas funções: `spawnDamageNumber` e `spawnDeathEffect`. Gerenciado por um singleton `CombatFeedback` inicializado com a `app` do PixiJS e o `stage`.

---

## Feature 1: Floating Damage Numbers

### Pool

16 objetos `PIXI.Text` pré-alocados, adicionados ao `stage` e marcados `visible = false`. Nenhum objeto é criado ou destruído durante o jogo — apenas reciclados.

### Hierarquia de cor/tamanho

| Dano recebido | Fonte | Cor | Glow |
|---|---|---|---|
| 1–3 | 14px | `#888888` | nenhum |
| 4–7 | 18px | `#00FFFF` | sutil |
| 8–14 | 22px | `#FF9900` | médio |
| 15+ | 28px | `#FF00FF` | forte |

**Crit:** tamanho +6px acima do tier normal, texto prefixado com `"CRIT "`, cor sempre `#FF00FF`.

Fonte: `JetBrains Mono` (já carregada no projeto), `fontWeight: 'bold'`.

### Animação (50 frames total ~0.83s @ 60fps)

```
Fase 1 — Pop-in   (frames 0–8):   scale 0 → 1.4 → 1.0  (overshoot/bounce)
Fase 2 — Float    (frames 8–38):  y -= 50px total, x += random ±15px
Fase 3 — Fade-out (frames 38–50): alpha 1.0 → 0, scale 1.0 → 0.7
```

O offset X aleatório (±15px) previne empilhamento quando múltiplos projéteis acertam o mesmo inimigo em sequência.

### Posição de spawn

Centro de `bullet.position` no momento do hit (disponível em `bullet_hit.js:16`).

### Overflow handling

Se todos os 16 slots estão ativos, o mais antigo (menor `frameAge`) é reciclado imediatamente para o novo número.

---

## Feature 2: Enemy Death Animation

### Trigger

Chamado no início de `enemy.kill()` em `src/enemy.js`, antes do sprite ser removido do stage.

### Sequência de animação

**a) Implosão do sprite (18 frames):**
- Frames 0–8: scale `1.0 → 1.4`, brightness filter `1 → 3` (pico de flash)
- Frames 8–18: scale `1.4 → 0`, brightness `3 → 0`, opacity `1 → 0`

**b) Nova Ring (25 frames, inicia no frame 6):**
- `PIXI.Graphics` círculo: raio `16 → 52`, alpha `0.8 → 0`, lineWidth `4 → 1`
- Cor = cor do inimigo (`enemy.typeId` → cor mapeada)
- Boss: segundo anel com delay de 4 frames, raio até `72`

**c) Faíscas (20 frames, inicia no frame 4):**
- Reutiliza `effects.explosion(x, y, color, amount)` do `src/effects.js` existente
- `amount = 8` para inimigos normais, `14` para boss
- Cor = cor do inimigo

### Mapa de cores por tipo

| typeId | Cor |
|---|---|
| `sentinela` | `0xFF3366` |
| `atirador` | `0xFF9900` |
| `titan` | `0xAA00FF` |
| boss | cor do tipo + anel extra |

---

## Integração

### `src/utils/bullet_hit.js` — linha ~16

```js
// Após player.runStats?.recordShotHit?.()
combatFeedback.spawnDamageNumber(
  bullet.position.x,
  bullet.position.y,
  bullet.damage,
  bullet.isCrit
);
```

### `src/enemy.js` — linha ~375 (dentro de `kill()`)

```js
// Antes de remover o sprite do stage
combatFeedback.spawnDeathEffect(
  this.enemy.position.x,
  this.enemy.position.y,
  ENEMY_COLORS[this.typeId] ?? 0xFF3366,
  this.isBoss
);
```

### Inicialização (em `main.js` ou onde a app é criada)

```js
import { CombatFeedback } from './combat_feedback.js';
const combatFeedback = new CombatFeedback(app);
```

---

## Não incluso neste spec

- Alterações no sistema de áudio
- Streak / combo counter
- Texto de kill ("ELIMINATED", "BOSS DOWN")
- Merge de números simultâneos

---

## Verificação

1. Atirar em inimigos normais — números brancos/cinza surgem no hit
2. Acumular upgrades de dano — números mudam de cor para ciano/laranja/magenta
3. Conseguir um crit — "CRIT X" em magenta com glow visível
4. Matar inimigo — implosão + anel de onda na cor do inimigo
5. Matar boss — anel duplo, mais partículas
6. Disparar rápido em um inimigo — números espalham levemente (não empilham)
7. 16+ hits simultâneos (chain lightning em múltiplos) — nenhum crash, pool recicla corretamente

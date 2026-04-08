# Boss Run Upgrade Design

## Goal

Adicionar um novo `run upgrade` voltado para chefes, aumentando o dano causado a inimigos marcados como boss sem alterar o dano base contra inimigos comuns.

## Chosen Approach

Aplicar o bônus no ponto central de resolução de dano em [`src/enemy.js`](/home/gustavo/Top-Down-Shooter/src/enemy.js), dentro de `kill(...)`, usando `this.isBoss` e um novo efeito agregado em `player.runUpgradeEffects`.

## Why This Approach

- Cobre todas as fontes de dano que já passam por `kill(...)`, incluindo tiro direto, `retaliation_pulse` e dano periódico de `viral_core`.
- Evita duplicar lógica em múltiplos chamadores.
- Preserva o comportamento de inimigos não-boss.

## Upgrade Shape

- Novo upgrade no registry: `boss_hunter`
- Nome exibido: `Caça-Titãs`
- Seis tiers com multiplicador progressivo de dano em boss
- Efeito novo em runtime: `bossDamageMultiplier`

## Affected Files

- `src/run_upgrades/run_upgrade_data.js`
- `src/run_upgrades/run_upgrade_state.js`
- `src/run_upgrades/run_upgrade_screen.js`
- `src/enemy.js`
- `test/run_upgrades/run_upgrade_data.test.js`
- `test/run_upgrades/run_upgrade_state.test.js`
- `test/enemy.test.js`

## Testing

- Garantir que o registry passa a ter 4 upgrades e que o novo upgrade tem 6 tiers válidos.
- Garantir que o estado padrão inclui `bossDamageMultiplier` neutro.
- Garantir que bosses recebem dano multiplicado e inimigos comuns não recebem esse bônus.

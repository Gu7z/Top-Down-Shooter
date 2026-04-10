# Análise de Custo-Benefício da Skill Tree

## Escopo

Este documento analisa a árvore de skills como ela está implementada hoje no código, cruzando:

- `docs/ai-onboarding.md`
- `docs/balanceamento-drone.md`
- `src/progression/skill_tree_data.js`
- `src/progression/skill_effects.js`
- `src/progression/skill_tree_state.js`
- `src/player.js`
- `src/shooting.js`
- `src/drone.js`
- `src/enemy.js`
- `src/utils/bullet_hit.js`
- `src/progression/run_stats.js`
- `src/wave_manager.js`

Cada branch custa `2025cr`. A árvore inteira custa `12150cr`.

## Método

### Métricas usadas

- **DPS bruto do player**: `shots/s * projéteis/tiro * dano esperado por projétil`
- **DPS bruto do drone**: `drones * tiros/s * projéteis/tiro * dano por projétil`
- **Créditos por run**: fórmula real de `calculateCredits(...)`
- **Valor defensivo**: quantos hits extras a branch cria, tempo de i-frame, tempo de recarga de escudo
- **Controle**: chance de freeze, uptime aproximado e área de propagação

### Assunções importantes

- O tiro base do player sai a cada `0.3s`, então o baseline é `3.33 DPS` antes de qualquer upgrade.
- O drone usa `fireIntervalBase = 90`, então o baseline real atual é `0.67 DPS` por drone, não os números antigos do doc de rebalanceamento.
- Nos cálculos de economia, usei cinco **cenários-modelo**: runs encerradas nas waves `5 / 10 / 15 / 20 / 30`, com score esperado derivado das waves reais e precisão acima de 75%. Isso serve para comparar skills, não para prever toda run real.
- Quando uma descrição e o código divergem, considerei o **código**.

### Cenários-modelo de economia

| Marco | Abates esperados | Chefes | Score esperado | Créditos base |
|---|---:|---:|---:|---:|
| Wave 5 | 23 | 1 | 42 | 67 |
| Wave 10 | 70 | 2 | 190 | 169 |
| Wave 15 | 149 | 3 | 460 | 315 |
| Wave 20 | 268 | 4 | 919 | 519 |
| Wave 30 | 623 | 6 | 3932 | 1256 |

## Resumo Executivo

- **Melhores spikes de poder cedo**: `bullet_damage_1`, `multishot_1`, `max_hp_1`, `shield_1`, `hit_guard_1`, `drone_overclock_1`, `marked_ammunition`.
- **Melhores skills de farm**: `credit_gain_1`, `boss_bounty_1`, `reactor_yield_1`, `wave_harvest`, `neon_oligarch`.
- **Skills mais superestimadas pelo texto**: `strafe_control_1`, `score_bonus_1`, `last_stand_contract`, `bounty_drone`.
- **Branch mais fraca contra chefes**: `control`, porque freeze não afeta chefes e o multiplicador de dano da branch depende de `enemy.frozen`.

## Poder de Fogo

Baseline: `3.33 DPS`.

| Tier | Skill | Custo | Benefício real | Veredito |
|---|---|---:|---|---|
| T1 | `fire_rate_1` | 40 | `+10%` de cadência. DPS vai de `3.33` para `3.67`. | Bom |
| T2 | `bullet_speed_1` | 60 | Velocidade do projétil vai de `240` para `255 px/s`. Viagem de `300px` cai de `1.25s` para `1.18s`. Não sobe DPS de planilha. | Situacional |
| T3 | `bullet_damage_1` | 85 | Dano vai de `1` para `2`. DPS sobe de `3.67` para `7.33`. É um salto de `+100%`. | Excelente |
| T4 | `fire_rate_2` | 115 | DPS sobe de `7.33` para `7.92`. Bom, mas claramente é pedágio para T5. | Bom |
| T5 | `multishot_1` | 150 | Adiciona `+1` projétil. DPS bruto sobe de `7.92` para `15.84` se os dois projéteis conectarem. | Excelente |
| T6 | `overheat_1` | 195 | Com dano base `2`, o crítico vira `3`. Na prática o ganho é só `+2.5%` de DPS: `15.84 -> 16.24`. | Fraco isolado |
| T7 | `bullet_speed_2` | 245 | Velocidade total vai a `270 px/s`. Viagem de `300px` cai para `1.11s`. Ainda é 0 de DPS bruto. | Fraco |
| T8 | `fire_rate_3` | 305 | DPS sobe de `16.24` para `17.54`. Nó estável, sem spike. | Bom |
| T9 | `overheat_2` | 375 | Crítico total vira `12%` com multiplicador `2.25x`. Em bala de dano `2`, o crítico passa a bater `5`. DPS sobe `17.54 -> 20.19`. | Muito bom |
| T10 | `apex_armament` | 455 | Crítico total vira `18%` com multiplicador `3.0375x`. Em bala de dano `2`, crita por `7`. DPS sobe `20.19 -> 24.81`. | Muito bom |

### Leitura da branch

- O coração da branch não é fire rate; são os **breakpoints de dano** e o **multishot**.
- `bullet_damage_1` é o melhor nó de early game da branch.
- `multishot_1` é o maior multiplicador de wave clear.
- Os dois nós de `bullet_speed` melhoram conforto e consistência, mas são fracos em custo-benefício puro.
- `overheat_1` só começa a valer a pena porque já existe `bullet_damage_1`; sozinho, seria bem pior.

## Mobilidade

Baseline: velocidade do player `2.0`, dash de `112px` a cada `2.0s` quando desbloqueado.

| Tier | Skill | Custo | Benefício real | Veredito |
|---|---|---:|---|---|
| T1 | `move_speed_1` | 40 | Velocidade vai de `2.0` para `2.15`, ganho de `+7.5%`. | Excelente |
| T2 | `move_speed_2` | 60 | Velocidade vai a `2.25`, total de `+12.5%` sobre o base. | Bom |
| T3 | `dash_unlock` | 85 | Desbloqueia dash de `112px` com cooldown de `2.0s` (`30` dashes/min). | Excelente |
| T4 | `dash_cooldown_1` | 115 | Cooldown cai de `2.0s` para `1.8s` (`30 -> 33.3` dashes/min). | Bom |
| T5 | `dash_iframe_1` | 150 | Dá `120ms` de i-frame. Se usar no cooldown, isso é `6.7%` de uptime de invulnerabilidade. | Bom |
| T6 | `strafe_control_1` | 195 | No código, não mexe em “fricção”; ele só reduz a penalidade de movimento diagonal. A velocidade diagonal efetiva sobe `10.4%`. | Situacional |
| T7 | `dash_cooldown_2` | 245 | Cooldown cai de `1.8s` para `1.62s` (`33.3 -> 37` dashes/min). | Bom |
| T8 | `dash_iframe_2` | 305 | Soma mais `100ms`, totalizando `220ms` de i-frame. Uptime teórico sobe para `13.6%`. | Muito bom |
| T9 | `kinetic_reload` | 375 | O próximo tiro sai instantâneo após o dash. Com cooldown de `1.62s`, isso equivale a `+0.617` tiro/s, algo perto de `+18.5%` de fire rate sobre a arma base. | Excelente |
| T10 | `reactor_evasion` | 455 | Velocidade total vai a `2.4` (`+20%` vs base) e o score por abates sobe `20%`. Em créditos, isso é modesto: no cenário de wave 20, rende só uns `+19` créditos pelo score extra. | Bom |

### Leitura da branch

- É uma branch que escala muito com a execução do jogador.
- `dash_unlock` é o divisor de águas.
- `kinetic_reload` é o melhor nó da metade final porque converte mobilidade em dano real.
- `reactor_evasion` parece híbrido com economia, mas seu ganho financeiro é pequeno; o valor real está na mobilidade.

## Sobrevivência

Baseline: `1 HP`, `0 shield`.

| Tier | Skill | Custo | Benefício real | Veredito |
|---|---|---:|---|---|
| T1 | `max_hp_1` | 40 | HP vai de `1` para `2`. Seu buffer de erro dobra. | Excelente |
| T2 | `shield_1` | 60 | Ganha `+1` shield. O buffer total vai de `2` para `3` hits. | Excelente |
| T3 | `shield_regen_1` | 85 | Regenera `1` shield a cada `15s` fora de pressão. Em lutas longas, vale muito; em pressão contínua, vale pouco. | Bom |
| T4 | `hit_guard_1` | 115 | Dá `1.2s` de invulnerabilidade depois de qualquer hit. Contra inimigos leves, isso ainda transforma contato durante a janela em `10` de dano neles. | Excelente |
| T5 | `shield_2` | 150 | Shield total vai para `2`. Buffer total sobe para `4` hits. | Muito bom |
| T6 | `emergency_shield_1` | 195 | Na primeira vez em que você cai para `1 HP`, ganha `+1` shield. Na prática, é mais um hit de margem em situação clutch. | Bom |
| T7 | `max_hp_2` | 245 | HP total vai para `3`. Buffer total sobe para `6` hits possíveis ao longo da vida da run. | Bom |
| T8 | `shield_regen_2` | 305 | A recarga do shield cai de `15s` para `8s`. Com `2` shields, refill completo sai de `30s` para `16s`. | Bom |
| T9 | `aegis_dash` | 375 | Quando o shield está vazio, o dash devolve `+1` shield com cooldown interno de `10s`. É um nó muito forte se você também investe em mobilidade. | Excelente |
| T10 | `iron_reserve` | 455 | Dá `+1 HP` e `+1 shield`. A branch completa chega a `4 HP`, `3 shields` e `1 emergency shield`: até `8` instâncias de dano antes da morte. | Muito bom |

### Leitura da branch

- É a melhor branch para subir consistência de run.
- `max_hp_1`, `shield_1` e `hit_guard_1` têm ROI absurdamente alto.
- `shield_regen` é sustain, não cura de combate.
- `aegis_dash` cresce muito quando combinado com a branch de mobilidade.

## Economia

Observação: `scoreMultiplier` mexe só no score de abates. Ele **não** aumenta créditos de boss, sobrevivência, ondas, abates por drone nem o bônus fixo de `+1000` score na wave 30.

| Tier | Skill | Custo | Benefício real | Veredito |
|---|---|---:|---|---|
| T1 | `credit_gain_1` | 40 | `+10%` em todos os créditos. Payback aproximado: `2.5` runs até wave 10, ou menos de `1` run até wave 20. | Excelente |
| T2 | `score_bonus_1` | 60 | `+10%` de score por abates, mas isso vira pouco crédito. Sobre T1, rende só `+2` créditos na wave 10 e `+11` na wave 20. | Fraco cedo |
| T3 | `streak_reward_1` | 85 | `+2` créditos por wave. Sobre T2, rende `+22` créditos na wave 10 e `+44` na wave 20. | Bom |
| T4 | `boss_bounty_1` | 115 | `+15` créditos por chefe. Sobre T3, rende `+33` créditos na wave 10 e `+66` na wave 20. | Excelente |
| T5 | `discount_protocol_1` | 150 | Não muda a run atual; só desconto futuro. No resto da própria branch, economiza `76cr`. Se você comprar as `55` skills restantes da árvore depois dele, economiza `561cr`. Break-even real fica perto de `3.1k` de gasto futuro. | Bom no longo prazo |
| T6 | `last_stand_contract` | 195 | Dá `+20` créditos em low HP; com os multiplicadores já comprados, isso vira `+22`. Precisa de quase `9` runs “ativadas” para se pagar. | Fraco |
| T7 | `reactor_yield_1` | 245 | O multiplicador financeiro total sobe para `1.232x` (`1.10 * 1.12`). Sobre T6, rende `+29` créditos na wave 10, `+83` na wave 20 e `+191` na wave 30. | Muito bom |
| T8 | `bounty_drone` | 305 | Cada abate de drone passa a valer `~1.232` crédito nesse ponto da branch. Break-even fica perto de `248` drone kills acumulados. | Fraco sem Tech |
| T9 | `wave_harvest` | 375 | O bônus por wave sobe para `+5`. Sobre T8, rende `+37` créditos na wave 10, `+74` na wave 20 e `+111` na wave 30. | Bom |
| T10 | `neon_oligarch` | 455 | Fecha a branch com `1.4168x` em créditos e `1.375x` em score de abates. Sobre T9, rende `+54` créditos na wave 10, `+163` na wave 20 e `+436` na wave 30. | Excelente late farm |

### Leitura da branch

- A ordem mais eficiente é clara: `credit_gain_1`, `boss_bounty_1`, `reactor_yield_1` e `neon_oligarch`.
- `score_bonus_1` é bem mais fraco do que parece.
- `discount_protocol_1` é ótimo para conta de longo prazo e quase irrelevante para curto prazo.
- `last_stand_contract` e `bounty_drone` são skills de nicho, não pilares de farm.

## Tecnologia

Baseline: `0.67 DPS` por drone recém-desbloqueado.

| Tier | Skill | Custo | Benefício real | Veredito |
|---|---|---:|---|---|
| T1 | `drone_unlock` | 40 | Libera `1` drone e `0.67 DPS` bruto autônomo. | Bom |
| T2 | `drone_fire_rate_1` | 60 | Fire interval cai de `90` para `72` frames. DPS sobe `0.67 -> 0.83`. | Bom |
| T3 | `drone_targeting_1` | 85 | Não sobe o DPS de planilha. Troca o alvo “primeiro da lista” pelo inimigo mais próximo dentro de `350px`. | Situacional, mas útil |
| T4 | `magnet_scan_1` | 115 | Adiciona `+1` projétil. DPS sobe `0.83 -> 1.67`. | Muito bom |
| T5 | `drone_overclock_1` | 150 | O texto fala `+50%`, mas o breakpoint real é melhor: `ceil(1 * 1.5) = 2`. DPS sobe `1.67 -> 3.33`, na prática `+100%`. | Excelente |
| T6 | `drone_piercing_1` | 195 | Não aumenta DPS contra alvo único nem contra chefes. Contra packs alinhados, o teto de dano por projétil dobra. | Situacional |
| T7 | `drone_fire_rate_2` | 245 | Fire interval cai de `72` para `57` frames. DPS sobe `3.33 -> 4.21`. | Bom |
| T8 | `drone_overclock_2` | 305 | Novo breakpoint: `ceil(2.25) = 3`. DPS sobe `4.21 -> 6.32`. | Muito bom |
| T9 | `marking_swarm` | 375 | Ganha `+1` drone e freeze de `25%` nos tiros dos drones, mas freeze não afeta chefes. DPS sobe `6.32 -> 12.63`. | Excelente para waves |
| T10 | `swarm_network` | 455 | Ganha `+1` drone e mais cadência. Fire interval cai de `57` para `50` frames. DPS sobe `12.63 -> 21.60`. | Excelente |

### Leitura da branch

- O drone atual está bem menos absurdo do que no doc antigo de rebalanceamento, porque hoje ele parte de `fireIntervalBase = 90`.
- Ainda assim, os spikes de `drone_overclock_1`, `marking_swarm` e `swarm_network` são enormes.
- `drone_piercing_1` é ótimo para tela cheia, fraco para bossing.
- `drone_targeting_1` é um nó de qualidade de alvo, não de número bruto.

## Controle

Observação: os multiplicadores de dano dessa branch funcionam quando o inimigo está com `enemy.frozen = true`. Pela árvore permanente, isso significa freeze. Chefes são imunes a esse freeze, então a branch perde muito valor em boss fight.

| Tier | Skill | Custo | Benefício real | Veredito |
|---|---|---:|---|---|
| T1 | `slow_field_1` | 40 | `15%` de freeze por hit, duração base de `2s`. Em alvo não-chefe sob fogo constante, o uptime aproximado já fica em `63.2%`. | Excelente |
| T2 | `knockback_1` | 60 | `+15px` de recuo por hit. Na arma base, isso pode virar algo perto de `50px/s` de empurrão. | Bom |
| T3 | `enemy_weaken_1` | 85 | Frozen toma `20%` a mais de dano. Com T1, isso vira algo perto de `+12.6%` de dano médio contra alvos freezáveis. Contra chefes, quase zero. | Bom, mas condicional |
| T4 | `chain_pulse_1` | 115 | Replica o controle atual em `60px` de raio (`11310 px²`). É muito melhor contra packs do que contra alvo único. | Muito bom |
| T5 | `control_duration_1` | 150 | Freeze sobe de `2.0s` para `2.4s`. O uptime aproximado vai de `63.2%` para `69.9%`. Também buffa freeze de drone. | Bom |
| T6 | `marked_ammunition` | 195 | Dá `+1` de dano de projétil e multiplica o weaken em `1.25x`. Com T3, o weaken total vira `1.5x`. É o pivot da branch. | Excelente |
| T7 | `slow_field_2` | 245 | Freeze total vai a `25%` por hit. Com T5, o uptime aproximado sobe para `86.5%` em não-chefes. | Excelente |
| T8 | `knockback_2` | 305 | Recuo total vai a `25px` por hit. Segurança muito boa, mas sem ganho direto de boss DPS. | Situacional |
| T9 | `chain_pulse_2` | 375 | O raio vai a `140px`, área de `61575 px²`, cerca de `5.4x` o T4. | Muito bom |
| T10 | `pulse_network` | 455 | O raio total vai a `240px`, área de `180956 px²`, `16x` o T4. O weaken total vira `1.95x`. Em alvo freezável, isso representa algo perto de `+82%` de dano médio só pelo weaken. | Excelente para waves |

### Leitura da branch

- É uma branch excelente para screen control e mediana para bossing.
- `marked_ammunition` é o nó que transforma a branch em ameaça real, porque ele adiciona dano universal além da parte condicional.
- `slow_field_2` e `pulse_network` fazem a branch escalar muito bem no late game contra packs.
- A descrição fala em “congelados ou atordoados”, mas a checagem real é `enemy.frozen`.

## Sinergias Mais Fortes

- **Poder de Fogo + Controle**: `marked_ammunition` soma `+1` de dano por projétil ao player inteiro. Se você já tem `bullet_damage_1`, a bala vai de `2` para `3`, um ganho de `+50%`.
- **Tecnologia + Controle**: `marking_swarm` cria freeze via drone; `control_duration_1`, `enemy_weaken_1` e `pulse_network` convertem isso em dano real contra mobs.
- **Mobilidade + Sobrevivência**: `aegis_dash` fica muito melhor quando o dash já está em `1.62s`.
- **Tecnologia + Economia**: `bounty_drone` só fica aceitável quando a build realmente produz muitos drone kills.
- **Economia + qualquer build longa**: `discount_protocol_1` só compensa se a intenção for comprar muita árvore depois dele.

## Ranking Geral de Custo-Benefício

### Top 10

1. `bullet_damage_1`
2. `multishot_1`
3. `max_hp_1`
4. `shield_1`
5. `hit_guard_1`
6. `drone_overclock_1`
7. `credit_gain_1`
8. `boss_bounty_1`
9. `marked_ammunition`
10. `neon_oligarch`

### Top 10 mais fracas ou mais nichadas

1. `score_bonus_1`
2. `bullet_speed_2`
3. `last_stand_contract`
4. `bounty_drone`
5. `strafe_control_1`
6. `bullet_speed_1`
7. `drone_targeting_1`
8. `knockback_2` em foco de boss
9. `discount_protocol_1` em horizonte curto
10. `drone_piercing_1` em foco de boss

## Conclusão

Se o objetivo for **poder imediato**, a árvore favorece muito mais `Poder de Fogo`, `Sobrevivência` e os breakpoints fortes de `Tecnologia`.

Se o objetivo for **farm persistente**, a branch `Economia` funciona, mas só algumas skills têm retorno limpo. O trio mais sólido é:

- `credit_gain_1`
- `boss_bounty_1`
- `reactor_yield_1`

Se o objetivo for **consistência de run**, `Sobrevivência` é a melhor compra do jogo em relação custo-benefício.

Se o objetivo for **bossing**, a pior aposta relativa é `Controle`, porque quase todo o valor pesado da branch depende de freeze em alvos que não sejam chefes.

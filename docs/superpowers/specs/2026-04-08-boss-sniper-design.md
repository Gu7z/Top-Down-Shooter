# Boss Sniper Design

## Goal

Substituir o boss da wave 10 por um boss sniper que kite o player, mantenha grande distância e dispare projéteis muito rápidos com mira preditiva simples.

## Chosen Approach

- Reaproveitar o slot do antigo `destruidor` na wave 10.
- Trocar o boss para `boss_sniper` em `wave_manager`.
- Implementar no `BossEnemy` um perfil de movimento dedicado para manter distância máxima útil.
- Adicionar um disparo de sniper que mira à frente do movimento recente do player.
- Manter dano por tiro em `1` para evitar mudança ampla na lógica de dano do player.

## Behavior

- O sniper entra na arena normalmente.
- Depois da entrada, ele tenta se manter o mais longe possível do player.
- Se o player aproxima, o sniper recua e faz reposicionamento lateral para abrir ângulo.
- O tiro principal usa velocidade muito maior que a bala inimiga padrão, mas ainda permite esquiva.
- A mira usa predição baseada no deslocamento recente do player.

## Constraints

- Não alterar a lógica de dano do player além do dano padrão `1`.
- Não alterar os outros bosses.
- Preservar a infraestrutura atual de `EnemyBullet`, apenas estendendo o necessário para velocidade customizada.

## Testing

- Wave 10 deve gerar `boss_sniper`.
- O sniper deve disparar mirando à frente da posição atual do player quando ele está em movimento.
- O projétil do sniper deve sair com velocidade maior que a bala inimiga padrão.
- O sniper deve preferir aumentar distância em vez de colar no player.

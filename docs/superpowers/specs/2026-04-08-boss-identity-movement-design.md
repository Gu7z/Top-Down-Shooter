# Boss Identity Movement Design

## Goal

Fazer cada boss se mover com identidade própria, aumentando um pouco a dificuldade dos bosses iniciais e deixando os bosses avançados mais estratégicos sem alterar vida ou padrões de tiro.

## Chosen Approach

Manter todos os ataques e timers atuais em `BossEnemy`, mas substituir o deslocamento linear por perfis de movimento por boss. Cada perfil define distância preferida, pressão radial, órbita lateral e, quando necessário, burst curto de reposicionamento.

## Boss Identities

- `guardiao`: zoner de média distância, orbita bastante e recua quando o player cola.
- `sniper`: mantém longa distância, kitea e prepara tiros preditivos de alta velocidade.
- `colosso`: fecha espaço com pressão diagonal em vez de avanço reto.
- `supremo`: alterna entre pressão e órbita para controlar o espaço.
- `predador`: flanqueia e usa burst curto de reposicionamento agressivo.
- `apocalipse`: híbrido das identidades acima, mantendo o kit ofensivo atual.

## Constraints

- Não alterar `life`, `speed` base, dano ou timers de tiro.
- Manter a colisão corpo a corpo e os ramos de freeze/knockback existentes.
- O comportamento precisa ser deterministicamente testável.

## Testing

- Validar que `guardiao` adiciona componente lateral em média distância.
- Validar que `colosso` fecha espaço em diagonal, não em linha reta.
- Validar que `predador` usa burst de reposicionamento acima da velocidade base.
- Revalidar que os timers e padrões de tiro continuam intactos.

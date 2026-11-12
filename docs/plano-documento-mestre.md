# Plano: do jogo atual ao Documento mestre

O documento completo está em `docs/documento-mestre.md`. Este plano compara cada seção com o que o jogo
já faz e organiza o que falta em fases. Nenhuma fase apaga o que já funciona, e todos os saves migram.

## O que já existe

| Seção | Situação hoje |
|---|---|
| 1, 8 Grade isométrica, zoom, salão, decoração | ✅ |
| 2 Receitas em tempo real | ⚠️ 25 receitas, no máximo 30 min; o relógio para quando o jogo fecha |
| 3 Temperos | ⚠️ temperos são ingredientes da feira; a prateleira (acelerar, porções, salvar queimado) não existe |
| 4 Livro de receitas | ⚠️ lista no painel do fogão, sem filtros; desbloqueio por nível ✅ |
| 5 Domínio (estrelas) | ❌ |
| 6 Popularidade e decoração | ✅ medidor 0–105; atrações com gorjeta ❌ |
| 7 VIPs | ✅ visual e bônus; missões e preferências ❌ |
| 9, 12 Chef e garçom automáticos | ✅ (chef retira, garçom serve, nada queima por falta de caminho) |
| 10, 11 Ciclo e diversidade de clientes | ✅ ciclo; ⚠️ humores e grupos simples |
| 13 Fogões e balcões | ⚠️ começa com 3 fogões; balcões guardam um prato por vez, sem limite de ~50 porções |
| 14 Pia e louça | ❌ hoje a mesa inteira fica suja e o garçom limpa ali mesmo |
| 15 Mesas 2x1 de 6 lugares, booths, banquetas | ❌ só mesas 1x1 |
| 16 Máquinas com estoque, sabor, desgaste e reparo | ⚠️ máquinas servem na hora; sem estoque nem conserto |
| 17 Energia | ✅ barra, raio, tempo para o próximo ponto; ❌ recarga por 4 diamantes, recarga de vizinho, regenerar fechado |
| 18 Cansaço da equipe | ❌ |
| 19 Abrir e fechar a porta | ⚠️ modo construção pausa tudo; não há porta fechada com o jogo rodando |
| 20 Social | ⚠️ vizinhos por convite, gorjetas e presentes; ❌ presente diário grátis, lista de desejos, ações por visita |
| 21 Feira | ✅ |
| 22 Eventos sazonais | ❌ só a estrutura em `events.js` |
| 23 Café Ouro e Diamantes | ✅ |
| 24 Som e volumes separados | ✅ |
| 26 Assets | ✅ KayKit e Kenney; Quaternius ainda não |
| 27 Contas e nuvem | ⚠️ conta anônima automática + Google opcional; ❌ tela de login obrigatória, e-mail e senha, recuperação |

## Conflitos com decisões já tomadas

1. **Tempo offline.** O `CLAUDE.md` diz "fechou o jogo, tudo congela". O documento pede fogões e energia
   correndo com o jogo fechado, e receitas de até 96 h (que só fazem sentido assim).
2. **Louça.** Hoje a mesa inteira fica suja. O documento pede louça por assento e uma pia.
3. **Bebidas.** Hoje a máquina serve na hora. O documento pede estoque preparado, sabor escolhido, desgaste
   e conserto com energia. O jogador continua servindo no balão (1 energia por copo), então os dois se encaixam.
4. **Login.** Hoje se joga sem login. O documento pede tela de login obrigatória.
   - O Firebase grátis (plano Spark) cobre e-mail e senha, recuperação de senha e Google.
   - Validar compras e recompensas no servidor ("servidor manda") exige Cloud Functions, que só existem no
     plano Blaze (pede cartão de crédito, mas tem cota grátis).
   - Sem isso, as regras do Firestore garantem que cada pessoa só mexe no próprio café, mas o próprio jogo
     calcula moedas e XP.
   - A versão do claude.ai não tem login próprio: lá a conta continua sendo a do claude.ai.

## Fases

1. **Contas e nuvem (seção 27).** ✅ Feita.
   - Tela inicial com criar conta, entrar, recuperar senha e Google.
   - Quem já joga anônimo vira conta sem perder o café.
   - Aviso quando o mesmo café está aberto em dois aparelhos (o mais recente vence, sem duplicar compras).
2. **Tempo real com o jogo fechado (2, 17).** ✅ Feita: 7 receitas de 2 h a 96 h.
   - Fogões e energia contam pelo relógio do mundo: início, fim e vencimento salvos.
   - Clientes e equipe continuam parados com o jogo fechado.
3. **Cozinha (2, 3, 4, 5, 13).** ✅ Feita (menos as 115 receitas: hoje são 32; desbloqueio por moedas, diamantes e VIP fica para depois).
   - Receitas longas, de 3 min a 96 h, chegando a 115 aos poucos.
   - Livro com filtros, domínio em 5 estrelas e prateleira de temperos.
   - Começar com 2 fogões e balcões de ~50 porções.
4. **Salão (14, 15, 19).** ✅ Feita (mesa 2×1 feita como duas peças que se emendam). Pia, louça por assento, mesa 2x1 de 6 lugares, booths, banquetas, abrir e fechar a porta.
5. **Bebidas e energia (16, 17).** ✅ Feita (recarga de vizinho fica para a fase 7, social). Máquinas com estoque, sabor, desgaste e conserto; recarga por 4 diamantes; recarga de vizinho.
6. **Equipe, atrações e VIPs (6, 7, 18).** ✅ Feita. Cansaço e turnos, atrações com gorjeta, missões de VIP.
7. **Social (20).** Presente diário grátis, lista de desejos com 3 itens, caixa de presentes, ações por visita.
8. **Eventos e assets (22, 26).** Primeiro evento sazonal; pacotes Quaternius (CC0) para comida e personagens.

Cada fase é publicada e testada (save antigo, celular 430×760, memória) antes da próxima.

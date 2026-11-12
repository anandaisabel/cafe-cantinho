# Café Cantinho

Jogo isométrico 3D de cafeteria para navegador, feito do zero. Inspirado no Café Mania, sem usar
nome nem arte dele. Roda no GitHub Pages (Firebase para o social) e também como artifact do claude.ai
(vizinhos, presentes e gorjetas usam a capacidade `db` do artifact).

Interface e textos do jogo em português do Brasil. Comentários de código em inglês.

---

## REGRAS PERMANENTES DO PROJETO

Estas regras valem para toda tarefa neste repositório.

1. **O restaurante é o protagonista.** Câmera isométrica, grade, mobília, cozinha, receitas,
   clientes, equipe, economia, XP, níveis, desbloqueios, loja, expansão e decoração.
2. **O mundo externo é complementar.** Ruas, carros, pedestres e a feira existem como cenário vivo,
   nunca competindo com o salão.
3. **Estabilidade primeiro.** Nada de reescrever sistemas que funcionam.
4. **Não migrar de engine sem benefício real.**
5. **Entender antes de mudar.** Inspecione o sistema atual, preserve funcionalidades e saves,
   faça mudanças pequenas e localizadas, corrija a causa raiz e nunca entregue recurso de fachada.
6. **Economia de tokens.** Ao terminar, relate apenas: o que mudou, quais arquivos, o que foi
   testado e o que ficou pendente. Sem análises longas. Não releia o projeto inteiro.

### Decisões que já foram revertidas (não reintroduzir sem pedido)
- **Ciclo de dia e noite: desligado.** O relógio fica travado em luz de fim de manhã
  (`DAY_HOUR` em `js/world/clock.js`). O código do ciclo continua no repositório, só não avança.
- **Fogões e energia correm com o jogo fechado** (documento mestre, fase 2). Clientes, equipe e balcões continuam
  congelados. `catchUp()` em state.js recua `cook.s` e `energy.t` pelo tempo fora: na abertura (`wall() - lastSeen`)
  e ao voltar de outra aba/app (`takeAway()` em util.js, inclui travadas acima de 1 s). Prato esquecido queima normalmente.
  **Receitas longas** (`long: true`, 2 h a 96 h, `burn = t/3`, então esperam no fogão o mesmo tempo que levaram):
  clientes não pedem nem esperam por elas (`chooseOrder`); "Acelerar" some quando custaria mais que a energia máxima.
- **Cozinha da fase 3**: balcão guarda até `COUNTER_CAP` (50) porções; o que não cabe espera no fogão (`cook.left`)
  e ainda pode queimar. `takeFromStove()` em sim.js é o único caminho do fogão ao balcão (coleta, chef, `magicPlate`):
  a primeira retirada paga XP e conta domínio. **Domínio**: `S.mastery[rid]`, estrelas em `MASTERY_AT` (5/15/35/70/120),
  +5% porções e XP por estrela; estrela nova paga moedas e, nas 2/4/5, um tempero. **Prateleira de temperos**
  (`BOOSTS`, `S.boost`, `useBoost`, `openShelf`): Sal +5%, Pimenta +10% (um por prato), Tomilho −1 h, Ultrarrápido −6 h,
  Condimento termina, Sálvia salva queimado; compra com moedas ou diamantes. **Livro de receitas** (botão Cardápio)
  filtra por tempo (`recipeCat`). Café novo começa com 2 fogões.
- **Login obrigatório no GitHub Pages** (seção 27 do documento mestre): `js/login.js` aparece antes do café
  (criar conta, entrar, esqueci a senha, Google). Conta anônima antiga vira conta sem trocar de id. Cópia local por conta
  (`cafecantinho4:<uid>`); a chave antiga só é herdada pela primeira conta. Sessão mais nova vence: cada sessão grava `sess`
  no doc e a mais antiga para de salvar (`takenOverScreen`). As regras do Firestore recusam gravação anônima.
  O artifact do claude.ai e `?offline` não pedem login.
- **VIP sentado**: o clipe de sentar do KayKit põe o quadril .21 atrás da raiz, então o VIP é puxado mais .17 para a mesa
  (`HERO_SIT_FWD` em view.js); sem isso o quadril ficava dentro do encosto.
- **O jogador não recolhe prato à mão.** O chef retira sozinho quando há balcão livre.
- **Bebidas não vão para o balcão.** O jogador serve tocando no balão de copo sobre o cliente (`serveDrink`),
  pagando só o custo em moedas. Cada bebida tem um bônus (`DRINK_BONUS`: moedas, XP ou satisfação).
  O garçom não busca mais bebidas. **Energia de volta** (pedido): bebida custa 1–3 (`drinkEnergy`), "Acelerar"
  no painel do fogão termina o prato por 1 de energia por minuto restante (`speedUpCost`); recarga 1 por minuto,
  máximo 20 + 2/nível até 50. O balão de bebida não balança.
- **Sem carinha fixa sobre o cliente.** A expressão aparece só em momentos marcantes.
- **Sem ruído de fundo contínuo.** O 'room tone' de ruído grave soava como trânsito; foi trocado pelo rádio lo-fi.
- **Sem carros e sem asfalto.** A volta da quadra é um calçadão claro (`promenade()` em `outside3d.js`);
  o código dos carros continua lá, mas `setupCars` não é mais chamado.
- **Popularidade 0–105** (`S.pop`, `addPop()` em `state.js`): +0,1 cliente satisfeito, +0,5 VIP, −0,3 cliente
  que sai bravo ou sem lugar. Acelera a chegada de clientes em `spawnInterval`. Medidor `#popChip` no HUD.
- **Estações mistas** (gelateria, forno, fonte de chocolate): o painel prepara os pratos e lista as bebidas da
  máquina embaixo. Só equipamento sem pratos abre o painel "o que servir?".
- **Chef cozinha sozinho** após 5 min de jogo com a cozinha parada (`AUTO_COOK_MS`): a receita mais rápida possível.
- **Equipe de uniforme branco**: corpo dos bonecos de chef/garçom/dono clareado por shader (`uniformMaterial`),
  cabeça intacta. O vendedor da feira não é equipe (`buildChar(look, 'cust')`).
- **Bonecos maiores** (`CHAR_SCALE` 1.4); altura sentada corrigida pela medida do quadril. VIPs KayKit sentam com a raiz quase no chão (`seatY - .26`):
  o clipe `Sit_Chair_Idle` já ergue o quadril. Pratos na mesa 2.0×. Vendedor da feira do lado direito da barraca (árvore da frente afastada).
- **VIPs reluzentes**: auréola dourada, anel no chão, faíscas e brilho no corpo (`vipFx` em chars3d.js);
  chance de 3% a 9% por cliente a partir do nível 3. Vendedor da feira fica na frente da barraca.
- **Ciclo do jogo blindado** (`main.js`): o próximo quadro é agendado antes e cada quadro roda em try/catch;
  um erro não congela mais o jogo (`window.__lastLoopError`). Perda do contexto WebGL (iPhone sem memória)
  salva e recarrega sozinho (`engine.js`).
- **Chef nunca deixa prato queimar por falta de caminho**: sem rota até o balcão ou até o fogão (2 s), o prato
  vai direto ao balcão com ✨ (`magicPlate`), como o `magicServe` do garçom.
- **Compra pela loja volta ao jogo sozinha**: `beginPlace` guarda `G.placeFrom`; ao colocar/cancelar, se veio
  de 'play', sai do modo construção (antes ficava pausado e parecia travado).
- **Vendedor da feira passeia** em volta da barraca (`VENDOR_SPOTS`); a área de fora é estática
  (`matrixAutoUpdate = false`), então o vendedor é reativado depois, senão nunca se move.
- **Um cliente por cadeira** (`freeSeats`): mesas recebem vários clientes; mesa suja não recebe novos até ser limpa.
- **Modo decoração = modo construção** (estilo The Sims): simulação, bonecos, pedestres, vendedor e vento congelam,
  a cena fica azulada (`setBuildMode`, uniform `build` do passe VIBRANT) e a faixa `.buildbanner` avisa a pausa.
- **Ingredientes por nível**: `spiceLevel(id)` = nível da primeira receita que usa; feira e loja só vendem a partir
  dele. Ingredientes sem receita não são vendidos. **Café novo começa sem cafeteira** (custa 260 na loja).
- **Etiquetas dos equipamentos**: fogão parado mostra "Cozinhar"; máquina de bebida mostra "Pronta" ou "Pedido!".
- **`?offline`** no endereço ignora o Firebase: use para testar sem gravar cafés de teste no banco real.
- **Sons fofinhos sintetizados** (pedido explícito, depois de testar gravações reais): sino "plim-plom" de caixinha
  de música, prato = bolhinha "pop", talheres/copos = "plinc" baixinho e raro (`soft()` em audio.js). Gravações de
  ambiente e impactos foram rejeitadas (alto, desagradável, "prego"). `assets/sfx/` fica vazio; `sample()` continua
  disponível. Música sem bumbo e com baixo uma oitava acima (o "turom-turom" grave incomodava).
- **Comida dura mais**: balcão 5× (mín. 20 min), fogão espera 3× antes de queimar (mín. 3 min) em `config.js`.
- **Jukebox**: um toque troca para a próxima música (`nextTrack`); volumes das músicas igualados por medição.
- **Nomes de classe CSS**: `.chip` e `.track` são da tela de progressão; HUD usa `.hchip`, músicas usam `.song`.
- **Suqueira industrial**: mesmo balcão de inox da cafeteira, 3 tanques (laranja, morango, limão).
- **Músicas com instrumento próprio** (`voice`/`groove` em `TRACKS`): piano lo-fi, caixinha de música, vibrafone
  jazz, violão bossa. Trocar dá uma pausa curta e mostra "Tocando: …".
- **Clientes entram mesmo sem comida pronta**: sem estoque nem fogão ligado, pedem um prato que o café sabe
  fazer (`chooseOrder`), de preferência rápido.
- **Balcão mostra um prato inteiro só** (`food3dWhole`: bolo e torta inteiros); o número diz as porções.
- **HUD em pílulas iguais** (`.chip` em `index.html`/`game.css`): ícone redondo à esquerda, valor à direita,
  preenchimento interno para XP e energia.
- **Feira no gramado da direita** (`buildMarket`), não na calçada da frente: lá ficava sob o dock.
  Abre tocando na barraca em 3D (`MARKET.hit`, pick `market`); não tem mais etiqueta flutuante.
- **Arandelas são itens de parede** (`ITEMS.sconce`, kind `window`, style `sconce`), não fazem mais parte
  da casca do salão. Saves antigos ganham as 3 de volta via `sconceMig` em `migrate()`.
- **Visual kawaii pastel** (pedido explícito, com referências de livros de receita e sims fofos): papel creme
  quadriculado, contorno marrom-claro (`--k-ink2`), abas pastel; bloco "KAWAII PASTEL SKIN" no fim de `game.css`.
  O estilo brilhante de contorno roxo-escuro foi rejeitado. No 3D, `NeutralToneMapping` + passe `VIBRANT` leve.
- **Cafeteira industrial** (pedido explícito; a versão fofinha pequena foi rejeitada): balcão de inox e máquina comercial
  com 3 grupos, manômetros, vaporizadores e xícaras em cima, laterais menta (`coffeeMachine`). Suqueira em inox, 1,12×.
- **Feira sem placa**, de frente para a câmera, toldo rosa, balcão cheio de frutas e caixotes na frente.
- **Máquinas de bebida têm cardápio próprio**: `it.off` lista as bebidas pausadas; `serves()` em `sim.js`.

---

## Como rodar

```bash
npm install          # three + esbuild + gltf-transform
python3 build.py     # gera dist/index.html (arquivo único, ~4,2 MB)
npm run serve        # http://localhost:8766
```

`build.py` embute os GLBs em base64 (`js/three/kaykit-data.js` e `js/three/chars-data.js`,
ambos gerados, não versionar edições à mão) e empacota tudo num HTML único com esbuild.
O jogo **precisa** ser um arquivo só: multi-arquivo com ES modules não abria no iPhone.

## Publicar

Artifact do claude.ai (link guardado fora do repositório) e GitHub Pages; veja `DEPLOY.md`.
Publicar `dist/index.html` como `index.html`, `mode: replace`, passando o `base_version` da versão
no ar. Fora do claude.ai, basta hospedar `dist/index.html` em qualquer lugar.

## GitHub Pages + Firebase

`DEPLOY.md` tem o passo a passo. Resumo: `.github/workflows/deploy.yml` monta e publica a cada push na `main`;
`public/` (ícone, manifesto) vai junto do `index.html`. Fora do claude.ai, `js/firebase-config.js` liga
`js/net-firebase.js` (mesma API do db do artifact). `G.net` diz qual banco está ativo. Vizinhos no Firebase
são por código/convite (`S.friends`, `?vizinho=ID`), nunca a lista de todos. Nuvem grava no máximo a cada 30 s.
Nunca colocar nome, e-mail ou link do artifact em arquivos do repositório: ele é público.

## Arquitetura

```
js/
  main.js        boot e game loop. Ordem: tickClock → tick(sim) → syncView → pumpThumbs → render
  util.js        RELÓGIO DE JOGO (now()), eventos (on/emit), helpers
  state.js       G, freshState, migrate, save/load, moedas, diamantes, temperos, XP
  config.js      catálogos: ITEMS, RECIPES, SPICES, RARITY, EXPANSIONS, ROLES, GOALS
  sim.js         simulação: clientes, garçons, chef, cozimento, validade, humor, VIP
  path.js        grade, BFS, doorY (a porta é um item)
  input.js       raycast de toque, hover, arrastar no modo decoração, zoom
  ui.js          todos os painéis, HUD, loja, feira, inventário, equipe
  audio.js       sons sintetizados, conversa do salão, rádio lo-fi generativo, volumes (localStorage cc_audio)
  events.js      nota de qualidade do café e registro para eventos futuros
  world/clock.js relógio do mundo (ciclo desligado)
  three/
    engine.js    câmera ortográfica isométrica, pós-processamento, zoom/pan, clamp
    view.js      sincroniza estado → cena; overlays em DOM; declutter
    models.js    buildItem/updateItem: todos os móveis e equipamentos
    food3d.js    um builder por receita
    chars3d.js   personagens (pacote Kenney) + animação
    room3d.js    casca do salão: piso, paredes, porta
    outside3d.js rua, carros, pedestres, parque, feira
    kit.js       box/cyl/sphere/lathe com cache, SHARED, disposeTree
    textures.js  texturas de canvas (todas em cache vão para SHARED)
    thumbs.js    miniaturas 3D assíncronas, desenhadas pelo renderer principal
```

### Pontos sensíveis (já custaram bug)

- **`now()` é o relógio de jogo**, não `Date.now()`. Só avança com o jogo na tela. Use `wall()`
  para carimbo de salvamento. `advanceClock()` é só para teste.
- **Um único contexto WebGL.** As miniaturas desenham com o renderer principal (`pumpThumbs`
  roda antes do render). Criar um segundo contexto quebra o jogo.
- **Pool fixo de 6 luzes pontuais.** Mudar a contagem de luzes recompila shaders e trava.
- **`SHARED` manda no descarte.** Geometria/material/textura em `SHARED` nunca é liberado;
  o que não está é liberado por `disposeTree`. Caches de `kit.js` têm teto (`GEO_CAP`/`MAT_CAP`)
  e as chaves são arredondadas ao milímetro — sem isso a memória cresce e o jogo trava.
- **`sphere(parent, r, ...)` já usa `scale` para o raio.** Para achatar, use
  `scale.set(r, r*0.5, r)`, nunca `scale.set(1, .5, 1)`.
- **Save remoto pode vir congelado.** `load()` clona com JSON antes de usar.
- **`touchend` com preventDefault** evita o clique fantasma que fechava painéis no celular.
- **Picking por distância na tela** entre itens de mesma prioridade; sem isso o toque no fogão
  abria a máquina de café.

### Saves

`localStorage` chave `cafecantinho4` + doc `cafes/<uid>` no db do artifact. `migrate()` em
`state.js` preenche tudo que falta em saves antigos. **Sempre** adicione o default lá ao criar
campo novo, e teste carregando um save da versão anterior.

## Testes

Não há suíte automatizada. O padrão usado até aqui é Playwright headless com swiftshader:

```python
b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader',
                            '--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
```

Ganchos expostos em `window` por `main.js`: `__G` (estado), `__E` (engine), `__SIM`, `__UI`,
`__now()`, `__ff(segundos)` (adianta simulação e relógio), `__frames`, `__CACHE()`.
Clique por JS em vez de mouse real, e espere `__frames` subir antes de tirar screenshot —
swiftshader roda a poucos quadros por segundo.

Antes de publicar, conferir: ciclo completo de atendimento, painéis abrindo em viewport de
celular (430×760), save antigo migrando, e memória estável (`__E.renderer.info.memory`).

## Assets

- **KayKit** (Kay Lousberg) — móveis, cozinha, city builder. CC0.
- **Sons** — gravações do Wikimedia Commons (CC0/domínio público), ver `assets/licenses/`.
- **Mini Characters** (Kenney) — 12 personagens com animações. CC0. Licença em
  `assets/licenses/`.
- **KayKit Adventurers** (CC0) — os 5 VIPs (`assets/kaykit-heroes.glb`, `tools/pack-heroes.mjs`): sem armas,
  5 clipes compartilhados. `look.hero` (0–4) escolhe o modelo; `HERO_K` em `chars3d.js` ajusta a escala.
- **KayKit Forest + mais Restaurant Bits** (CC0) — `assets/kaykit-extra.glb` (`tools/pack-extra.mjs`):
  árvores/arbustos/pedras/grama `n_*` (usados por `Veg` em `outside3d.js`) e caixotes/armário `r_*` na loja.
- `tools/pack-models.mjs` e `tools/pack-chars.mjs` reempacotam os GLBs com gltf-transform.
- Comida, plantas, máquinas, janelas e portas são procedurais, sem asset externo.

## Referência de design

`docs/documento-mestre.md`: especificação completa do jogo (recebida em 2026-11-12). `docs/plano-documento-mestre.md`:
o que já existe, conflitos e fases (fases 1, 2 e 3 feitas).

`docs/referencia-cafe-mania.md`: como o Café Mania funcionava (pesquisa em blogs de fãs) e o que
ainda falta trazer. Inspiração de mecânica apenas: nunca nome, arte ou textos.

## Pendências conhecidas

- Eventos, concursos e desafios existem só como estrutura em `events.js`.
- Sem arquitetura de anúncios ou compras; só a moeda premium separada.
- Diamantes "achados no mapa" não existem; vêm de nível e de clientes VIP.
- Janelas ficam na frente da parede, sem vão recortado no muro.
- Fluidez no iPhone nunca foi medida; só testada em headless.

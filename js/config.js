// =============================================================
//  CATALOGS — add new content here. Each entry is data only;
//  its illustration lives in art/ under the same id or style.
// =============================================================

export const WALL_H = 96;          // wall height in world px
export const START_SIZE = 6;       // starting grid size (tiles)
export const START_COINS = 300;

export const EXPANSIONS = [
  { size: 7, cost: 300, lv: 2 },
  { size: 8, cost: 700, lv: 3 },
  { size: 9, cost: 1500, lv: 4 },
  { size: 10, cost: 3000, lv: 6 },
  { size: 11, cost: 5000, lv: 8 },
  { size: 12, cost: 8000, lv: 9 },
  { size: 13, cost: 13000, lv: 11 },
  { size: 14, cost: 20000, lv: 13 },
  { size: 15, cost: 30000, lv: 16 },
];

export const EQUIP = {
  stove: 'Fogão',
  coffee: 'Máquina de café',
  blender: 'Liquidificador',
};

// t = seconds to prepare, burn = seconds it survives ready on the equipment,
// keep = seconds it stays good on the counter, por = portions per batch, price = coins per portion
export const RECIPES = [
  { id: 'espresso', drink: true,   n: 'Café expresso',       eq: 'coffee',  t: 15,   cost: 4,   por: 5,  price: 4,  burn: 20,  keep: 90, xp: 1,  lv: 1, liquid: '#5a3524' },
  { id: 'paoqueijo',  n: 'Pão de queijo',       eq: 'stove',   t: 40,   cost: 10,  por: 8,  price: 5,  burn: 30,  keep: 180, xp: 2,  lv: 1 },
  { id: 'bolo',       n: 'Bolo de cenoura',     eq: 'stove',   t: 120,  cost: 28,  por: 12, price: 8,  burn: 60,  keep: 360, xp: 5,  lv: 1 },
  { id: 'chai', drink: true, n: 'Chai especial', eq: 'coffee', t: 70, cost: 22, por: 8, price: 11, burn: 30, keep: 150, xp: 7, lv: 4, need: { id: 'canela', n: 1 }, liquid: '#c08a52' },
  { id: 'cappuccino', drink: true, n: 'Cappuccino',          eq: 'coffee',  t: 60,   cost: 15,  por: 8,  price: 7,  burn: 25,  keep: 120, xp: 3,  lv: 2, liquid: '#a8754f' },
  { id: 'sanduiche',  n: 'Sanduíche natural',   eq: 'stove',   t: 240,  cost: 50,  por: 14, price: 10, burn: 90,  keep: 300, xp: 8,  lv: 2 },
  { id: 'suco', drink: true,       n: 'Suco de laranja',     eq: 'blender', t: 45,   cost: 12,  por: 6,  price: 6,  burn: 30,  keep: 120, xp: 3,  lv: 3, liquid: '#f6a531' },
  { id: 'vitamina', drink: true,   n: 'Vitamina de morango', eq: 'blender', t: 150,  cost: 35,  por: 10, price: 9,  burn: 45,  keep: 180, xp: 6,  lv: 4, liquid: '#ef8aa0' },
  { id: 'pistachio', n: 'Bolo de pistache', eq: 'stove', t: 520, cost: 130, por: 18, price: 20, burn: 150, keep: 540, xp: 24, lv: 7, need: { id: 'pistache', n: 1 } },
  { id: 'torta',      n: 'Torta de limão',      eq: 'stove',   t: 600,  cost: 110, por: 22, price: 13, burn: 150, keep: 600, xp: 15, lv: 4 },
  { id: 'brigadeiro', n: 'Brigadeiros',         eq: 'stove',   t: 900,  cost: 150, por: 30, price: 12, burn: 180, keep: 900, xp: 20, lv: 5 },
  { id: 'pao-mel', n: 'Pão de mel', eq: 'stove', t: 300, cost: 70, por: 14, price: 13, burn: 100, keep: 420, xp: 14, lv: 4, need: { id: 'mel', n: 1 } },
  { id: 'brownie',    n: 'Brownie trufado',     eq: 'stove',   t: 420,  cost: 90,  por: 16, price: 16, burn: 120, keep: 480, xp: 18, lv: 5, need: { id: 'cacau', n: 1 } },
  { id: 'moccaccino', drink: true, n: 'Moccaccino especial', eq: 'coffee', t: 90, cost: 30, por: 8, price: 14, burn: 40, keep: 180, xp: 10, lv: 6, need: { id: 'baunilha', n: 1 } },
  { id: 'focaccia',   n: 'Focaccia de alecrim', eq: 'forno',  t: 360,  cost: 110, por: 16, price: 18, burn: 110, keep: 420, xp: 20, lv: 11 },
  { id: 'quiche',     n: 'Quiche de alho-poró', eq: 'forno',  t: 480,  cost: 170, por: 14, price: 26, burn: 140, keep: 480, xp: 28, lv: 12, need: { id: 'flordesal', n: 1 } },
  { id: 'gelato',     n: 'Gelato de pistache',  eq: 'gelato', t: 300,  cost: 150, por: 18, price: 24, burn: 200, keep: 600, xp: 26, lv: 13, need: { id: 'pistache', n: 1 } },
  { id: 'affogato',   drink: true, n: 'Affogato', eq: 'gelato', t: 80, cost: 40,  por: 8,  price: 22, burn: 40,  keep: 160, xp: 16, lv: 14 },
  { id: 'pavlova',    n: 'Pavlova de morango',  eq: 'forno',  t: 540,  cost: 210, por: 14, price: 32, burn: 150, keep: 500, xp: 34, lv: 15, need: { id: 'morango', n: 1 } },
  { id: 'chocquente', drink: true, n: 'Chocolate quente', eq: 'choco', t: 90, cost: 45, por: 10, price: 25, burn: 50, keep: 200, xp: 18, lv: 16 },
  { id: 'macaron',    n: 'Macarons de lavanda', eq: 'forno',  t: 620,  cost: 280, por: 20, price: 36, burn: 160, keep: 600, xp: 42, lv: 17, need: { id: 'lavanda', n: 1 } },
  { id: 'fondue',     n: 'Fondue de chocolate', eq: 'choco',  t: 420,  cost: 320, por: 12, price: 48, burn: 120, keep: 420, xp: 48, lv: 18, need: { id: 'trufa', n: 1 } },
  { id: 'matchalatte', drink: true, n: 'Matchá latte', eq: 'coffee', t: 85, cost: 38, por: 9, price: 21, burn: 45, keep: 180, xp: 15, lv: 19, need: { id: 'matcha', n: 1 } },
  { id: 'bolodeouro', n: 'Bolo folheado a ouro', eq: 'forno', t: 780,  cost: 520, por: 18, price: 64, burn: 200, keep: 720, xp: 70, lv: 20, need: { id: 'ouro', n: 1 } },
  { id: 'lasanha',    n: 'Lasanha',             eq: 'stove',   t: 1800, cost: 300, por: 40, price: 18, burn: 240, keep: 900, xp: 35, lv: 6 },
  // long recipes (hours to days): they keep cooking while the game is closed; burn = t/3, so the dish waits on
  // the stove as long as it took to cook before it burns (burnAfter triples it)
  { id: 'espaguete', n: 'Espaguete à bolonhesa', eq: 'stove', t: 7200, cost: 200, por: 60, price: 16, burn: 2400, keep: 7200, xp: 45, lv: 3, long: true },
  { id: 'pizza', n: 'Pizza margherita', eq: 'stove', t: 18000, cost: 400, por: 80, price: 18, burn: 6000, keep: 18000, xp: 80, lv: 8, long: true },
  { id: 'pamonha', n: 'Pamonha', eq: 'stove', t: 32400, cost: 500, por: 100, price: 16, burn: 10800, keep: 32400, xp: 110, lv: 10, long: true },
  { id: 'churrasco', n: 'Churrasco', eq: 'stove', t: 43200, cost: 700, por: 110, price: 20, burn: 14400, keep: 43200, xp: 150, lv: 12, long: true },
  { id: 'frango', n: 'Frango assado', eq: 'stove', t: 86400, cost: 900, por: 130, price: 24, burn: 28800, keep: 86400, xp: 220, lv: 14, long: true },
  { id: 'feijoada', n: 'Feijoada', eq: 'stove', t: 172800, cost: 1200, por: 160, price: 26, burn: 57600, keep: 172800, xp: 320, lv: 16, long: true },
  { id: 'florestanegra', n: 'Bolo Floresta Negra', eq: 'forno', t: 345600, cost: 2000, por: 200, price: 34, burn: 115200, keep: 345600, xp: 500, lv: 20, long: true },
];

// Special ingredients and rare goods.
// rarity: comum | incomum | raro | exclusivo — it drives price, where the item shows up and how often.
export const RARITY = {
  comum:     { n: 'Comum',      c: '#8aa98f', o: 1 },
  incomum:   { n: 'Incomum',    c: '#5b93c9', o: 2 },
  raro:      { n: 'Raro',       c: '#a97fd6', o: 3 },
  exclusivo: { n: 'Muito raro', c: '#e0a13a', o: 4 },
};
export const SPICES = [
  // everyday pantry, bought with Moedinhas
  { id: 'cacau',     n: 'Cacau nobre',        d: 'Cacau fino para receitas de chocolate.',        r: 'comum',     price: 120, cat: 'especiaria' },
  { id: 'canela',    n: 'Canela em pau',      d: 'Casca perfumada, boa em bolos e cafés.',        r: 'comum',     price: 90,  cat: 'especiaria' },
  { id: 'flordesal', n: 'Flor de sal',        d: 'Sal delicado que realça qualquer massa.',       r: 'incomum',   price: 220, cat: 'especiaria' },
  { id: 'cardamomo', n: 'Cardamomo verde',    d: 'Semente cítrica, clássica no café especial.',   r: 'incomum',   price: 260, cat: 'especiaria' },
  { id: 'mel',       n: 'Mel silvestre',      d: 'Mel de flores do campo, doce e encorpado.',     r: 'comum',     price: 100, cat: 'extrato' },
  // rare goods, Diamantes only
  { id: 'baunilha',  n: 'Baunilha em fava',   d: 'Fava curada à mão, aroma inconfundível.',       r: 'raro',      gprice: 2,  cat: 'extrato' },
  { id: 'pistache',  n: 'Pasta de pistache',  d: 'Pistache siciliano moído na hora.',             r: 'raro',      gprice: 3,  cat: 'ingrediente' },
  { id: 'acafrao',   n: 'Açafrão verdadeiro', d: 'Os estigmas mais caros da cozinha.',            r: 'exclusivo', gprice: 5,  cat: 'especiaria' },
  { id: 'trufa',     n: 'Trufa negra',        d: 'Achado de feira: aparece pouquíssimas vezes.',  r: 'exclusivo', gprice: 6,  cat: 'ingrediente' },
  // market-only goods: the stall is the only place these show up
  { id: 'laranja',   n: 'Laranja da serra',   d: 'Caixa de laranjas doces, direto do produtor.',  r: 'comum',     price: 70,  cat: 'ingrediente', feira: true },
  { id: 'morango',   n: 'Morango orgânico',   d: 'Morangos da estação, colhidos de manhã.',       r: 'comum',     price: 110, cat: 'ingrediente', feira: true },
  { id: 'nozpecan',  n: 'Noz-pecã',           d: 'Nozes crocantes para massas e coberturas.',     r: 'incomum',   price: 240, cat: 'ingrediente', feira: true },
  { id: 'matcha',    n: 'Matcha cerimonial',  d: 'Chá verde em pó, moído na pedra.',              r: 'incomum',   price: 300, cat: 'extrato',     feira: true },
  { id: 'lavanda',   n: 'Lavanda culinária',  d: 'Flores secas de lavanda, perfume delicado.',    r: 'raro',      gprice: 2,  cat: 'especiaria',  feira: true },
  { id: 'rosa',      n: 'Água de rosas',      d: 'Destilado floral raríssimo de confeitaria.',    r: 'raro',      gprice: 3,  cat: 'extrato',     feira: true },
  { id: 'ouro',      n: 'Folha de ouro',      d: 'Ouro comestível para sobremesas de festa.',     r: 'exclusivo', gprice: 7,  cat: 'ingrediente', feira: true },
  { id: 'yuzu',      n: 'Yuzu em conserva',   d: 'Cítrico japonês difícil de achar.',             r: 'exclusivo', gprice: 6,  cat: 'ingrediente', feira: true },
];
// --- street market -------------------------------------------------------
// The stall restocks every MARKET_EVERY minutes of play. Rarer goods show up less often
// and in smaller amounts, and the rarest ones are the only place some ingredients appear at all.
export const MARKET_EVERY = 8;                       // minutes of play between restocks
const MARKET_ODDS = { comum: 1, incomum: .6, raro: .3, exclusivo: .12 };
const MARKET_QTY  = { comum: [2, 5], incomum: [1, 3], raro: [1, 2], exclusivo: [1, 1] };
// price at the stall: a bit over shop price for convenience, and set by rarity for market-only goods
const MARKET_MULT = { comum: 1.15, incomum: 1.2, raro: 1.25, exclusivo: 1.3 };
export const inShop = sp => !sp.feira && (sp.price || sp.gprice);
// the level an ingredient becomes useful: the first recipe that needs it (null = no recipe uses it)
export const spiceLevel = id => { const lv = RECIPES.filter(r => r.need && r.need.id === id).map(r => r.lv); return lv.length ? Math.min(...lv) : null; };
export function rollMarket(seed, lvl = 99) {
  let s = (seed | 0) || 1;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const out = [];
  for (const sp of SPICES) {
    const need = spiceLevel(sp.id);
    if (need === null || need > lvl) { rnd(); continue; }     // only what the player's recipes can use, at their level
    if (rnd() > MARKET_ODDS[sp.r]) continue;
    const [a, b] = MARKET_QTY[sp.r], qty = a + Math.floor(rnd() * (b - a + 1));
    const m = MARKET_MULT[sp.r];
    const e = { id: sp.id, qty };
    if (sp.gprice) e.gems = Math.max(1, Math.round(sp.gprice * m));
    else if (sp.price) e.coins = Math.round(sp.price * m / 5) * 5;
    else e.gems = Math.max(1, RARITY[sp.r].o);        // market-only goods are priced by rarity
    out.push(e);
  }
  if (!out.length && lvl >= 4) out.push({ id: 'canela', qty: 3, coins: 100 });
  return out.slice(0, 8);
}
export const SPICE_CATS = { especiaria: 'Especiarias', extrato: 'Extratos e doces', ingrediente: 'Ingredientes finos' };
export const spice = id => SPICES.find(s => s.id === id);
export const DRINKS = () => RECIPES.filter(r => r.drink);
// Drinks are served by tapping the guest (Café Mania style): each costs energy and gives its own bonus.
//   coins: pays 60% more · xp: double XP · rep: the guest leaves happier (satisfaction and reputation)
export const DRINK_BONUS = { espresso: 'coins', cappuccino: 'xp', chai: 'coins', suco: 'rep', vitamina: 'xp', moccaccino: 'xp', affogato: 'rep', chocquente: 'coins', matchalatte: 'rep' };
export const BONUS_TXT = { coins: 'mais moedas', xp: 'XP em dobro', rep: 'cliente mais feliz' };
export const drinkEnergy = R => R.lv >= 15 ? 3 : R.lv >= 6 ? 2 : 1;   // energy to serve a drink by tapping the guest
export const ENERGY_REGEN_S = 60;                       // one point every minute of play
export const energyMax = lv => Math.min(50, 20 + lv * 2);
// speeding a dish up: one energy per minute it still had to cook (at least 1)
export const speedUpCost = secsLeft => Math.max(1, Math.ceil(secsLeft / 60));
// wall openings sit on a wall, not on a floor tile
export const isWallItem = it => it && ITEMS[it.type] && (ITEMS[it.type].kind === 'window' || ITEMS[it.type].kind === 'door');
export const wallOf = (st, it) => (it.x === 0 ? 'z' : it.y === 0 ? 'x' : null);   // which wall a cell touches
export const canHoldWall = (st, x, y) => x === 0 || y === 0;
export const recipe = id => RECIPES.find(r => r.id === id);

// kind: table | chair | counter | equip | decor
export const ITEMS = {
  table_round:   { n: 'Mesa redonda', d: 'Mesinha redonda de madeira. Coloque cadeiras viradas para ela.',       cat: 'mobilia', kind: 'table', price: 60,  lv: 1, wood: '#c98f5c' },
  table_square:  { n: 'Mesa quadrada', d: 'Mesa quadrada clássica, cabe uma cadeira de cada lado.',      cat: 'mobilia', kind: 'table', price: 85,  lv: 2, wood: '#a8744a' },
  table_marble:  { n: 'Mesa de mármore', d: 'Mesa elegante de mármore que deixa o salão mais charmoso.',    cat: 'mobilia', kind: 'table', price: 220, lv: 5, charm: 2 },
  chair_wood:    { n: 'Cadeira de madeira', d: 'Cadeira simples e confortável. Vire-a para uma mesa.', cat: 'mobilia', kind: 'chair', price: 40,  lv: 1, rot: true, frame: '#b97a4d', seat: '#e2b182' },
  chair_cushion: { n: 'Cadeira estofada', d: 'Cadeira com assento estofado. Clientes adoram.',   cat: 'mobilia', kind: 'chair', price: 90,  lv: 3, rot: true, frame: '#8a5a3e', seat: '#e98f8a', charm: 1 },
  chair_bistro:  { n: 'Cadeira bistrô', d: 'Cadeira estilo bistrô, colorida e moderna.',     cat: 'mobilia', kind: 'chair', price: 150, lv: 4, rot: true, frame: '#4b4b58', seat: '#7fae9a', charm: 1 },
  counter:       { n: 'Balcão', d: 'Recebe os pratos prontos. Os garçons buscam a comida aqui.',             cat: 'cozinha', kind: 'counter', price: 80,  lv: 1, rot: true },
  stove:         { n: 'Fogão', d: 'Prepara pães, bolos, tortas e pratos quentes.',              cat: 'cozinha', kind: 'equip', eq: 'stove',   price: 120, lv: 1, rot: true },
  coffee:        { n: 'Máquina de café', d: 'Máquina de espresso para cafés e cappuccinos.',    cat: 'cozinha', kind: 'equip', eq: 'coffee',  price: 260, lv: 1, rot: true },
  blender:       { n: 'Liquidificador', d: 'Para sucos e vitaminas geladinhos.',     cat: 'cozinha', kind: 'equip', eq: 'blender', price: 200, lv: 3, rot: true },
  plant:         { n: 'Vaso de planta', d: 'Jiboia num vaso de cerâmica brilhante.',     cat: 'decor', kind: 'decor', price: 35,  lv: 1, charm: 1 },
  lamp:          { n: 'Luminária de chão', d: 'Luminária de chão com luz quentinha.',  cat: 'decor', kind: 'decor', price: 70,  lv: 1, charm: 1, light: true },
  flowers:       { n: 'Floreira', d: 'Floreira cheia de flores coloridas.',           cat: 'decor', kind: 'decor', price: 60,  lv: 2, charm: 2 },
  ficus:         { n: 'Ficus', d: 'Árvore de interior que enche o canto de verde.',              cat: 'decor', kind: 'decor', price: 95,  lv: 2, charm: 2 },
  shelf:         { n: 'Estante de livros', d: 'Estante com livros e objetinhos decorativos.',  cat: 'decor', kind: 'decor', price: 160, lv: 3, charm: 3, rot: true },
  display:       { n: 'Vitrine de doces', d: 'Vitrine de vidro cheia de doces apetitosos.',   cat: 'decor', kind: 'decor', price: 260, lv: 4, charm: 4, rot: true },
  jukebox:       { n: 'Jukebox', d: 'Toca músicas e ilumina o salão com cores.',            cat: 'decor', kind: 'decor', price: 400, lv: 6, charm: 6, rot: true, light: true },
  cactus:        { n: 'Cacto', d: 'Cactinho fofo, quase não dá trabalho.', cat: 'decor', kind: 'decor', price: 30, lv: 1, charm: 1 },
  crate_carrots: { n: 'Caixote de cenouras', d: 'Cenouras da horta, laranjinhas e fresquinhas.', cat: 'decor', kind: 'decor', price: 50, lv: 1, charm: 1, rot: true },
  crate_lettuce: { n: 'Caixote de alfaces', d: 'Verde vivo para dar cor ao canto da cozinha.', cat: 'decor', kind: 'decor', price: 50, lv: 1, charm: 1, rot: true },
  crate_cheese:  { n: 'Caixote de queijos', d: 'Queijos curados empilhados, cara de empório.', cat: 'decor', kind: 'decor', price: 90, lv: 2, charm: 2, rot: true },
  crate_steak:   { n: 'Caixote do açougue', d: 'Cortes selecionados à mostra, para quem gosta de churrasco.', cat: 'decor', kind: 'decor', price: 110, lv: 3, charm: 2, rot: true },
  kcabinet:      { n: 'Armário de cozinha', d: 'Armário alto com portas de madeira, guarda tudo.', cat: 'cozinha', kind: 'decor', price: 140, lv: 2, charm: 2, rot: true },
  crates:        { n: 'Caixote de pães', d: 'Pães fresquinhos à mostra, cheirinho de padaria.', cat: 'decor', kind: 'decor', price: 55, lv: 1, charm: 1, rot: true },
  cabinet:       { n: 'Aparador', d: 'Móvel baixo com livros e plantinhas em cima.', cat: 'decor', kind: 'decor', price: 140, lv: 2, charm: 2, rot: true },
  forno:         { n: 'Forno de pedra', d: 'Forno a lenha para assados e tortas salgadas.', cat: 'cozinha', kind: 'equip', eq: 'forno', price: 2600, lv: 11, rot: true },
  gelateria:     { n: 'Máquina de gelato', d: 'Vitrine refrigerada para sorvetes artesanais.', cat: 'cozinha', kind: 'equip', eq: 'gelato', price: 4200, lv: 13, rot: true },
  chocolateira:  { n: 'Fonte de chocolate', d: 'Fonte de chocolate quente, exclusiva.', cat: 'cozinha', kind: 'equip', eq: 'choco', gprice: 10, lv: 16, rot: true },
  // --- wall openings: they hang on a wall instead of standing on the floor,
  // so they never take a floor tile and never block anyone walking past.
  win_classic:   { n: 'Janela clássica', d: 'Janela de guilhotina com cortina e vaso no parapeito.', cat: 'aberturas', kind: 'window', style: 'classic', price: 120, lv: 1, charm: 2 },
  win_wide:      { n: 'Janela panorâmica', d: 'Janela larga, enche o salão de luz.', cat: 'aberturas', kind: 'window', style: 'wide', price: 260, lv: 3, charm: 3 },
  win_round:     { n: 'Janela redonda', d: 'Óculo redondo, charmoso em qualquer parede.', cat: 'aberturas', kind: 'window', style: 'round', price: 180, lv: 2, charm: 3 },
  win_arch:      { n: 'Janela arqueada', d: 'Arco alto com caixilhos finos.', cat: 'aberturas', kind: 'window', style: 'arch', price: 320, lv: 4, charm: 4 },
  win_vitral:    { n: 'Vitral colorido', d: 'Vitral exclusivo que tinge a luz do salão.', cat: 'aberturas', kind: 'window', style: 'vitral', gprice: 5, lv: 4, charm: 6 },
  sconce:        { n: 'Arandela', d: 'Luminária de parede dourada com cúpula de tecido. Vai em qualquer parede.', cat: 'aberturas', kind: 'window', style: 'sconce', price: 60, lv: 1, charm: 1, light: true },
  door_wood:     { n: 'Porta de madeira', d: 'A porta de sempre, com placa de aberto e fechado.', cat: 'aberturas', kind: 'door', style: 'wood', price: 0, lv: 1 },
  door_glass:    { n: 'Porta de vidro', d: 'Porta envidraçada com acabamento claro.', cat: 'aberturas', kind: 'door', style: 'glass', price: 300, lv: 3 },
  door_arch:     { n: 'Porta arqueada', d: 'Porta alta em arco, com vidro em leque.', cat: 'aberturas', kind: 'door', style: 'arch', price: 480, lv: 5 },
  lustre:        { n: 'Lustre de cristal', d: 'Peça exclusiva: brilha sobre o salão inteiro.', cat: 'decor', kind: 'decor', gprice: 8, lv: 4, charm: 7 },
  vitrine_ouro:  { n: 'Vitrine dourada', d: 'Vitrine exclusiva, com acabamento em ouro.', cat: 'decor', kind: 'decor', gprice: 6, lv: 3, charm: 5, rot: true },
  tapete_persa:  { n: 'Tapete persa', d: 'Tapete raro, tecido à mão.', cat: 'decor', kind: 'decor', gprice: 4, lv: 2, charm: 4, rot: true },
  fridge:        { n: 'Geladeira retrô', d: 'Conserva os pratos: cada geladeira faz a comida do balcão durar 25% mais (até +75%).', cat: 'cozinha', kind: 'decor', price: 180, lv: 3, charm: 2, rot: true },
  armchair:      { n: 'Poltrona', d: 'Poltrona fofinha com almofadas para um cantinho de leitura.', cat: 'decor', kind: 'decor', price: 220, lv: 4, charm: 3, rot: true },
  // gift-only (received from neighbours)
  teddy:         { n: 'Ursinho', d: 'Ursinho de pelúcia, presente de um vizinho.',            cat: 'gift', kind: 'decor', price: 0, charm: 2 },
  sunflower:     { n: 'Girassol', d: 'Girassol num vaso azul, presente de um vizinho.',           cat: 'gift', kind: 'decor', price: 0, charm: 2 },
};
export const GIFT_ITEMS = ['teddy', 'sunflower', 'plant', 'cactus'];

export const FLOORS = {
  wood:       { n: 'Taco de madeira',  price: 0,   lv: 1, a: '#dcb68b', b: '#c9a074', kind: 'planks' },
  checker:    { n: 'Xadrez creme',     price: 80,  lv: 1, a: '#f4e8d6', b: '#bf9378', kind: 'checker' },
  terracotta: { n: 'Terracota',        price: 150, lv: 2, a: '#e3a582', b: '#cf8b67', kind: 'tiles' },
  mint:       { n: 'Ladrilho hidráulico', price: 220, lv: 3, a: '#9fc9b0', b: '#f5efe4', kind: 'hydraulic' },
  herring:    { n: 'Espinha de peixe', price: 380, lv: 5, a: '#bb865b', b: '#a46f47', kind: 'herring' },
};
export const WALLS = {
  peach:    { n: 'Listras pêssego',    price: 0,   lv: 1, a: '#f7d8c6', b: '#f0c8b2', trim: '#c98f6e', kind: 'stripes' },
  mint:     { n: 'Poá menta',          price: 90,  lv: 1, a: '#d9ecdf', b: '#a9cfb6', trim: '#86ad93', kind: 'dots' },
  lavender: { n: 'Lavanda com lambri', price: 160, lv: 2, a: '#e7def2', b: '#c8b4e0', trim: '#9f86c0', kind: 'wainscot' },
  floral:   { n: 'Floral amarelo',     price: 260, lv: 4, a: '#f9ecc6', b: '#e8a99a', trim: '#cfa456', kind: 'floral' },
  brick:    { n: 'Tijolinho',          price: 320, lv: 5, a: '#d98f70', b: '#c17153', trim: '#7d5038', kind: 'brick' },
};

export const ROLES = {
  owner:  { n: 'Chef · você', price: 0, lv: 1, hire: false, d: 'O dono do café. Só ele começa as receitas nos equipamentos.' },
  waiter: { n: 'Garçom', price: 150, lv: 1, hire: true, d: 'Pega os pedidos prontos no balcão, leva até a mesa do cliente e recebe o pagamento.' },
  chef:   { n: 'Ajudante', price: 150, lv: 1, hire: false, d: 'Ajuda no salão como garçom. Quem cozinha é o chef principal.' },
};

// progression: xp needed to go from level l to l+1 is cumulative
export const xpForLevel = l => Math.round(20 * (l - 1) * (l - 1) + 20 * (l - 1)); // total xp to *reach* level l
export const staffCap = l => 1 + Math.ceil(l / 2);
// Café Grana handed out at level milestones: rare on purpose, so it keeps its value
export const gemsForLevel = l => (l % 3 === 0 ? 2 : l % 2 === 0 ? 1 : 0);
export const burnAfter = R => Math.max(180, (R.burn || Math.max(25, R.t * .6)) * 3);   // seconds a ready dish waits on the stove before burning (3×, at least 3 min)
// seconds a batch stays good on the counter; every fridge in the café keeps it fresh for longer
export const fridgeBonus = st => 1 + Math.min(.75, (st && st.items ? st.items.filter(i => i.type === 'fridge').length : 0) * .25);
export const keepFor = (R, st) => Math.max(1200, (R.keep || Math.max(90, R.t * 2)) * 5) * fridgeBonus(st);   // counter shelf life: 5×, at least 20 min
export const stoveCap = l => 3 + Math.floor(l / 2);

export const GOALS = [
  { id: 'cook1',   n: 'Prepare sua primeira receita',  stat: 'cooked',   goal: 1,   coins: 30,  xp: 5 },
  { id: 'serve5',  n: 'Atenda 5 clientes',             stat: 'served',   goal: 5,   coins: 50,  xp: 10 },
  { id: 'buy1',    n: 'Compre um item na loja',        stat: 'bought',   goal: 1,   coins: 40,  xp: 5 },
  { id: 'seats6',  n: 'Tenha 6 lugares no salão',      count: 'seats',   goal: 6,   coins: 80,  xp: 10 },
  { id: 'happy10', n: 'Encante 10 clientes',           stat: 'happy',    goal: 10,  coins: 100, xp: 15 },
  { id: 'cook20',  n: 'Prepare 20 receitas',           stat: 'cooked',   goal: 20,  coins: 150, xp: 20 },
  { id: 'charm10', n: 'Chegue a 10 de charme',         count: 'charm',   goal: 10,  coins: 120, xp: 15 },
  { id: 'hire1',   n: 'Contrate alguém para a equipe', stat: 'hired',    goal: 1,   coins: 100, xp: 10 },
  { id: 'lvl3',    n: 'Alcance o nível 3',             count: 'level',   goal: 3,   coins: 150, xp: 0 },
  { id: 'serve50', n: 'Atenda 50 clientes',            stat: 'served',   goal: 50,  coins: 300, xp: 40 },
  { id: 'expand',  n: 'Amplie o café',                 stat: 'expanded', goal: 1,   coins: 250, xp: 30 },
  { id: 'lvl5',    n: 'Alcance o nível 5',             count: 'level',   goal: 5,   coins: 400, xp: 0 },
  { id: 'serve200',n: 'Atenda 200 clientes',           stat: 'served',   goal: 200, coins: 800, xp: 100 },
];

export const NAMES = ['Bia','Lulu','Téo','Nina','Juca','Mel','Davi','Cacau','Pipo','Lia','Tito','Zeca','Flor','Bento','Kika','Gabi','Rafa','Duda','Malu','Caio','Iara','Nico','Dora','Beto','Lara','Otto','Vivi','Guto'];
export const SKINS = ['#fde0c8','#f5cba7','#e9b48a','#c98e64','#9c6644','#7a4a2e'];
export const HAIRS = ['#3b2a20','#6b4430','#a0653a','#e8c07a','#2b2b35','#c0533a','#7b5ea7','#d9775a'];
export const SHIRTS = ['#f2a7a0','#a8c3a0','#9cc1e0','#f7d58b','#c7b2e6','#f5b98a','#8fd0c7','#e89cc0','#7d9fd6','#e07a5f'];
export const PANTS = ['#5b6b8c','#6b4430','#4a4a55','#7a8f6b','#3d4f6b'];
export const STYLES = ['short','bob','bun','pony','curly','spiky'];
export const BODIES = ['adult','adult','adult','elder','kid']; // customer models

export const CATS = { mobilia: 'Mobília', cozinha: 'Cozinha', decor: 'Decoração', aberturas: 'Janelas e portas', gift: 'Presente' };
export const MAX_LEVEL = 20;

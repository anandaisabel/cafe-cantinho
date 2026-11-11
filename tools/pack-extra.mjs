// Packs extra CC0 KayKit models (Kay Lousberg, kaylousberg.com) into assets/kaykit-extra.glb:
//   n_*  Forest Nature Pack (trees, bushes, rocks, grass) for the street and the park
//   r_*  more Restaurant Bits pieces (produce crates, fridge, cabinets) for the shop
// usage: node tools/pack-extra.mjs <forest gltf dir> <restaurant gltf dir> assets/kaykit-extra.glb tools/bounds-extra.json
import { NodeIO, Document, getBounds } from '@gltf-transform/core';
import { dedup, prune, mergeDocuments, unpartition, quantize } from '@gltf-transform/functions';
import fs from 'fs';
const [FOREST, REST, OUT, BOUNDS] = process.argv.slice(2);
const pick = {
  n: ['Tree_1_A_Color1', 'Tree_1_B_Color1', 'Tree_1_C_Color1', 'Tree_2_A_Color1', 'Tree_2_C_Color1', 'Tree_3_A_Color1', 'Tree_3_B_Color1', 'Tree_4_A_Color1', 'Tree_4_B_Color1',
      'Bush_1_A_Color1', 'Bush_1_C_Color1', 'Bush_2_A_Color1', 'Bush_3_A_Color1', 'Bush_4_A_Color1', 'Bush_4_C_Color1',
      'Rock_1_A_Color1', 'Rock_1_E_Color1', 'Rock_2_A_Color1', 'Rock_3_A_Color1', 'Grass_1_A_Color1', 'Grass_2_A_Color1', 'Grass_1_C_Color1'],
  r: ['crate_carrots', 'crate_cheese', 'crate_lettuce', 'crate_onions', 'crate_potatoes', 'crate_steak', 'fridge_B', 'kitchencabinet', 'pillar_A', 'table_round_A_decorated', 'table_round_A_small_decorated', 'kitchentable_A_large_decorated'],
};
const io = new NodeIO();
const out = new Document(); out.createBuffer();
const report = {};
for (const [k, list] of Object.entries(pick)) for (const name of list) {
  const file = (k === 'n' ? FOREST : REST) + '/' + name + '.gltf';
  if (!fs.existsSync(file)) { console.log('missing', name); continue; }
  const doc = await io.read(file);
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const b = getBounds(scene), id = k + '_' + name.replace(/_Color1$/, '');
  report[id] = { min: b.min.map(v => +v.toFixed(3)), max: b.max.map(v => +v.toFixed(3)) };
  const wrap = doc.createNode(id);
  for (const n of scene.listChildren()) { scene.removeChild(n); wrap.addChild(n); }
  scene.addChild(wrap);
  mergeDocuments(out, doc);
}
const root = out.getRoot(), scenes = root.listScenes(), main = scenes[0];
for (const s of scenes.slice(1)) { for (const n of s.listChildren()) main.addChild(n); s.dispose(); }
root.setDefaultScene(main);
await out.transform(unpartition(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }), prune());
fs.writeFileSync(BOUNDS, JSON.stringify(report, null, 1));
await io.write(OUT, out);
console.log('ok', fs.statSync(OUT).size, 'textures', root.listTextures().length, 'models', Object.keys(report).length);

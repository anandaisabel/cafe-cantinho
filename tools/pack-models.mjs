// Packs selected CC0 KayKit models (Kay Lousberg, kaylousberg.com) into one GLB.
import { NodeIO, Document } from '@gltf-transform/core';
import { dedup, prune, weld, mergeDocuments, unpartition } from '@gltf-transform/functions';
import { getBounds } from '@gltf-transform/core';
import fs from 'fs'; import path from 'path';
const R = '/tmp/assets/KayKit-Restaurant-Bits-1.0/addons/kaykit_restaurant_bits/Assets/gltf/';
const F = '/tmp/assets/KayKit-Furniture-Bits-1.0/addons/kaykit_furniture_bits/Assets/gltf/';
const C = '/tmp/assets/KayKit-City-Builder-Bits-1.0/addons/kaykit_city_builder_bits/Assets/gltf/';
const pick = {
  r: ['table_round_A_small', 'table_round_A', 'table_round_B', 'chair_A', 'chair_B', 'chair_stool', 'kitchencounter_straight_A', 'kitchencounter_straight_B',
      'kitchencounter_straight_A_decorated', 'stove_multi', 'stove_single', 'oven', 'fridge_A_decorated', 'jar_A_small', 'jar_B_medium', 'jar_C_small', 'jar_D_medium',
      'pot_A', 'pot_B', 'pan_A', 'plate', 'plate_small', 'bowl', 'menu', 'crate_buns', 'crate_tomatoes', 'cuttingboard', 'dishrack_plates', 'kitchentable_A', 'papertowel', 'shelf_papertowel_decorated', 'lid_A'],
  c: ['road_straight', 'road_straight_crossing', 'road_corner', 'streetlight', 'bench', 'bush', 'car_hatchback', 'car_sedan', 'car_taxi', 'firehydrant', 'trash_A', 'building_B', 'building_D', 'building_F', 'base'],
  f: ['chair_A_wood', 'chair_A', 'chair_B_wood', 'chair_stool_wood', 'table_small', 'table_medium', 'lamp_standing', 'lamp_table', 'shelf_B_large_decorated', 'shelf_B_small_decorated',
      'shelf_A_small', 'cabinet_small_decorated', 'cabinet_medium_decorated', 'book_set', 'pictureframe_large_A', 'pictureframe_medium', 'pictureframe_small_A', 'pictureframe_small_B',
      'pictureframe_standing_A', 'cactus_medium_A', 'cactus_small_A', 'cactus_small_B', 'armchair_pillows', 'couch_pillows', 'rug_oval_A', 'rug_rectangle_stripes_A', 'pillow_A', 'table_low'],
};
const io = new NodeIO();
const out = new Document(); out.createBuffer();
const report = {};
for (const [k, list] of Object.entries(pick)) for (const name of list) {
  const file = (k === 'r' ? R : k === 'c' ? C : F) + name + '.gltf';
  if (!fs.existsSync(file)) { console.log('missing', name); continue; }
  const doc = await io.read(file);
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const b = getBounds(scene);
  report[k + '_' + name] = { min: b.min.map(v => +v.toFixed(3)), max: b.max.map(v => +v.toFixed(3)) };
  // wrap all scene roots in a node named after the model
  const wrap = doc.createNode(k + '_' + name);
  for (const n of scene.listChildren()) { scene.removeChild(n); wrap.addChild(n); }
  scene.addChild(wrap);
  mergeDocuments(out, doc);
}
// collapse all scenes into one
const root = out.getRoot(), scenes = root.listScenes(), main = scenes[0];
for (const s of scenes.slice(1)) { for (const n of s.listChildren()) main.addChild(n); s.dispose(); }
root.setDefaultScene(main);
await out.transform(unpartition(), dedup(), prune());
fs.writeFileSync('/home/claude/cafe/tools/bounds.json', JSON.stringify(report, null, 1));
await io.write('/home/claude/cafe/assets/kaykit.glb', out);
console.log('ok', fs.statSync('/home/claude/cafe/assets/kaykit.glb').size, root.listTextures().map(t => t.getImage().byteLength), root.listMaterials().length);

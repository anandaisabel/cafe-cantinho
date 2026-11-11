// Packs the CC0 "KayKit Adventurers Character Pack" (Kay Lousberg, kaylousberg.com) into one small GLB
// for the VIP guests: 5 characters on the same rig, weapons removed, one shared set of the clips the café uses.
// usage: node tools/pack-heroes.mjs <.../Characters/gltf> assets/kaykit-heroes.glb
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, mergeDocuments, unpartition, resample } from '@gltf-transform/functions';
import fs from 'fs';
const SRC = process.argv[2], OUT = process.argv[3];
const NAMES = ['Knight', 'Barbarian', 'Mage', 'Rogue', 'Rogue_Hooded'];
const KEEP = ['Idle', 'Walking_A', 'Sit_Chair_Idle', 'Interact', 'Cheer'];
// café guests come unarmed: drop weapons, shields, books and throwables
const DROP = /(Sword|Shield|Axe|Mug|Spellbook|Wand|Staff|Crossbow|Knife|Throwable)/;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const out = new Document(); out.createBuffer();
let first = true;
for (const n of NAMES) {
  const doc = await io.read(`${SRC}/${n}.glb`);
  const root = doc.getRoot();
  for (const a of root.listAnimations()) if (!first || !KEEP.includes(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const sm of a.listSamplers()) sm.dispose(); a.dispose(); }
  for (const node of root.listNodes()) if (node.getMesh() && DROP.test(node.getName())) node.dispose();
  // wrap the character so the game can find it by name
  const scene = root.getDefaultScene() || root.listScenes()[0];
  const wrap = doc.createNode('hero_' + n);
  for (const c of scene.listChildren()) { scene.removeChild(c); wrap.addChild(c); }
  scene.addChild(wrap);
  first = false;
  mergeDocuments(out, doc);
}
const root = out.getRoot(), scenes = root.listScenes(), main = scenes[0];
for (const s of scenes.slice(1)) { for (const c of s.listChildren()) main.addChild(c); s.dispose(); }
root.setDefaultScene(main);
await out.transform(unpartition(), resample(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }), prune());
await io.write(OUT, out);
console.log('ok', fs.statSync(OUT).size, 'tex', root.listTextures().length, 'anims', root.listAnimations().map(a => a.getName()).join(','), 'children', main.listChildren().map(c => c.getName()).join(','));

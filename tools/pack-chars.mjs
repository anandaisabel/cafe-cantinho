// Packs the CC0 "Mini Characters" by Kenney (www.kenney.nl) into one small GLB:
// 12 skinned characters sharing one colour-map texture, plus the handful of animation clips the game uses.
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, mergeDocuments, unpartition, resample } from '@gltf-transform/functions';
import fs from 'fs';
const SRC = process.argv[2], OUT = process.argv[3];
const NAMES = ['female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f', 'male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f'];
const KEEP = ['idle', 'walk', 'sit', 'pick-up', 'emote-yes', 'emote-no', 'holding-right', 'holding-both', 'interact-right', 'jump'];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const out = new Document(); out.createBuffer();
let first = true;
for (const n of NAMES) {
  const doc = await io.read(`${SRC}/character-${n}.glb`);
  for (const a of doc.getRoot().listAnimations()) if (!first || !KEEP.includes(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const sm of a.listSamplers()) sm.dispose(); a.dispose(); }
  first = false;
  mergeDocuments(out, doc);
}
const root = out.getRoot(), scenes = root.listScenes(), main = scenes[0];
for (const s of scenes.slice(1)) { for (const c of s.listChildren()) main.addChild(c); s.dispose(); }
root.setDefaultScene(main);
await out.transform(unpartition(), resample(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }), prune());
await io.write(OUT, out);
console.log('ok', fs.statSync(OUT).size, 'tex', root.listTextures().length, 'mats', root.listMaterials().length, 'anims', root.listAnimations().map(a => a.getName()).join(','), 'children', main.listChildren().map(c => c.getName()).join(','));

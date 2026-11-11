// Compile every shader the game can need during the loading screen, once.
// One hidden instance of each item, dish and character type stays alive so its shaders are never released
// (a released shader would have to be compiled again later, mid-game, which is what causes hitches).
import { THREE, E } from './engine.js';
import { buildItem } from './models.js';
import { food3d } from './food3d.js';
import { buildChar } from './chars3d.js';
import { ITEMS, RECIPES } from '../config.js';
import { randLook } from '../sim.js';

export async function warmUp() {
  const g = new THREE.Group(); g.position.set(0, -60, 0);
  let x = 0;
  for (const type of Object.keys(ITEMS)) { const e = buildItem({ id: 'w' + type, type, x: 0, y: 0, rot: 0 }); e.group.position.x = x++; g.add(e.group); }
  for (const r of RECIPES) { const f = food3d(r.id); f.position.x = x++; g.add(f); }
  for (const role of ['cust', 'waiter', 'chef']) for (const body of ['adult', 'elder', 'kid']) { const C = buildChar(randLook(body), role); C.root.position.x = x++; g.add(C.root); }
  E.scene.add(g);
  try { if (E.renderer.compileAsync) await E.renderer.compileAsync(E.scene, E.camera); else E.renderer.compile(E.scene, E.camera); } catch (e) { }
  g.visible = false;     // kept (hidden) so the compiled programs stay in use
}

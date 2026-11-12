// Procedural 3D food & drinks. Each model ~0.24 tiles wide, origin at its base.
import { THREE } from './engine.js';
import { mat, mesh, box, sphere, cyl, lathe, cachedGeo, torus, SHARED } from './kit.js';
import { labelTexture } from './textures.js';

const GLOSS = { rough: .25, coat: .6 };
function plate(g, r = .12) {
  lathe(g, [[0, 0], [r * .55, 0], [r * .62, .006], [r, .016], [r * 1.02, .022], [r * .96, .024], [r * .6, .012], [0, .012]], '#fbf7f2', GLOSS, 32);
  return .012;
}
function cup(g, rTop, h, liquid, foamTex) {
  lathe(g, [[0, 0], [.07, 0], [.075, .006], [.11, .012], [.112, .018], [.07, .014], [0, .014]], '#fbf7f2', GLOSS, 28, 'saucer');
  const pts = [[0, .015], [rTop * .55, .015], [rTop * .72, .02], [rTop * .92, h * .55], [rTop, h], [rTop * .9, h], [rTop * .82, h * .55], [rTop * .5, .03], [0, .03]];
  lathe(g, pts, '#ffffff', GLOSS, 28);
  const handle = torus(g, h * .28, .011, '#ffffff', GLOSS, Math.PI * 1.2); handle.position.set(rTop * .98, h * .55, 0); handle.rotation.z = -Math.PI * .6;
  const top = new THREE.Mesh(cachedGeo('disc', () => new THREE.CircleGeometry(1, 28)), foamTex ? new THREE.MeshPhysicalMaterial({ map: foamTex, roughness: .5, clearcoat: .3 }) : mat(liquid, { rough: .15, coat: 1 }));
  top.rotation.x = -Math.PI / 2; top.position.y = h * .86; top.scale.setScalar(rTop * .88); g.add(top);
}
let latteTex;
function latte() {
  return latteTex || (latteTex = labelTexture((x, w, h) => {
    const gr = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, '#f5e3c8'); gr.addColorStop(.75, '#e8c79c'); gr.addColorStop(1, '#a8754f');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff6e8'; x.beginPath(); const cx = w / 2, cy = h / 2 + 10, k = 48;
    x.moveTo(cx, cy + k * .6); x.bezierCurveTo(cx - k * 1.4, cy - k * .3, cx - k * .5, cy - k * 1.1, cx, cy - k * .35); x.bezierCurveTo(cx + k * .5, cy - k * 1.1, cx + k * 1.4, cy - k * .3, cx, cy + k * .6); x.fill();
  }, 256, 256, true));
}
function glass(g, liquid, h = .2) {
  const r = .055;
  cyl(g, r * .92, r * .92, h * .78, liquid, 0, .008, 0, { rough: .3, coat: .5 }, 20);
  lathe(g, [[0, 0], [r * .85, 0], [r * .9, .006], [r * 1.12, h], [r * 1.06, h], [r * .84, .012], [0, .012]], '#e8f4f8', { rough: .05, coat: 1, opacity: .32 }, 24);
  const straw = cyl(g, .006, .006, h * .9, '#e8574f', .02, h * .55, 0, {}, 8); straw.rotation.z = -.35;
}
function wedge(g, color, h, y0, topColor) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.13, -.06); s.quadraticCurveTo(.15, 0, .13, .06); s.lineTo(0, 0);
  const geo = cachedGeo('wedge' + h, () => { const e = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 2 }); e.rotateX(-Math.PI / 2); return e; });
  const m = mesh(geo, mat(color, { rough: .65 }), -.05, y0, 0, g);
  if (topColor) { const t = mesh(cachedGeo('wedgeTop', () => { const e = new THREE.ExtrudeGeometry(s, { depth: .012, bevelEnabled: true, bevelThickness: .006, bevelSize: .01, bevelSegments: 2 }); e.rotateX(-Math.PI / 2); return e; }), mat(topColor, { rough: .3, coat: .5 }), -.05, y0 + h + .006, 0, g); }
  return m;
}

const BUILD = {
  espresso(g) { cup(g, .05, .07, '#3d2215'); },
  cappuccino(g) { cup(g, .068, .085, '#a8754f', latte()); },
  paoqueijo(g) {
    const y = plate(g);
    for (const [x, z, r] of [[-.045, .03, .042], [.045, .03, .042], [0, -.035, .045], [.005, .005, .038]]) {
      const b = mesh(cachedGeo('pq', () => { const s = new THREE.IcosahedronGeometry(1, 3); const p = s.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (Math.sin(p.getX(i) * 9) * Math.cos(p.getZ(i) * 8)) * .05; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .8, p.getZ(i) * k); } s.computeVertexNormals(); return s; }), mat('#e8b157', { rough: .55 }), x, y + r * .72 + (r < .04 ? .04 : 0), z, g);
      b.scale.setScalar(r);
    }
  },
  bolo(g) {
    const y = plate(g);
    wedge(g, '#f29a45', .07, y, '#5e301c');
    box(g, .13, .01, .02, '#e07a2c', .015, y + .033, 0, { rough: .7 }, .004);
    for (let i = 0; i < 3; i++) sphere(g, .012, '#5e301c', -.02 + i * .04, y + .065 - i * .004, .045 - i * .045, { rough: .3, coat: .5 });
    sphere(g, .018, '#fff3e4', .02, y + .1, 0, { rough: .6 });
  },
  sanduiche(g) {
    const y = plate(g);
    for (const [x, z, ry] of [[-.035, 0, .3], [.04, .02, -2.5]]) {
      const s = new THREE.Group(); s.position.set(x, y, z); s.rotation.y = ry; g.add(s);
      const tri = (col, h, yy, sc = 1) => { const sh = new THREE.Shape(); sh.moveTo(-.07 * sc, -.05 * sc); sh.lineTo(.07 * sc, -.05 * sc); sh.lineTo(0, .07 * sc); sh.closePath();
        const geo = cachedGeo('tri' + h + sc, () => { const e = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: .006, bevelSize: .008, bevelSegments: 2 }); e.rotateX(-Math.PI / 2); return e; });
        mesh(geo, mat(col, { rough: .7 }), 0, yy, 0, s); };
      tri('#f3d29b', .018, 0); tri('#7fc25a', .008, .024, 1.08); tri('#e3453c', .008, .032, .9); tri('#fff0c8', .008, .038, .95); tri('#f3d29b', .018, .046);
    }
  },
  suco(g) { glass(g, '#f6a02c'); const o = cyl(g, .035, .035, .008, '#f7b733', .06, .17, 0, { rough: .4 }, 16); o.rotation.z = Math.PI / 2.4; },
  vitamina(g) {
    glass(g, '#ef8aa0');
    for (const [x, z] of [[0, 0], [.02, .015], [-.018, .012], [0, -.02]]) sphere(g, .03, '#fff6f0', x, .2, z, { rough: .7 });
    const s = sphere(g, .024, '#e3364f', 0, .235, 0, { rough: .3, coat: .8 }); s.scale.set(.024, .03, .024);
    sphere(g, .012, '#6fbf4a', 0, .262, 0);
  },
  torta(g) {
    const y = plate(g);
    wedge(g, '#d9a35e', .02, y);
    wedge(g, '#f7e27a', .05, y + .02, '#fff8ec');
    for (let i = 0; i < 4; i++) { const c = mesh(cachedGeo('mer', () => new THREE.ConeGeometry(.016, .03, 12)), mat('#fff8ec', { rough: .6 }), -.03 + i * .03, y + .1, (i % 2 ? .02 : -.02) * (1 - i * .2), g); }
    const l = cyl(g, .018, .018, .006, '#bfe36a', .07, y + .085, 0, { rough: .4 }, 14); l.rotation.x = Math.PI / 2;
  },
  brigadeiro(g) {
    const y = plate(g);
    for (const [x, z] of [[-.045, .03], [.045, .03], [0, -.04]]) {
      lathe(g, [[0, 0], [.024, 0], [.034, .022], [.031, .022], [.02, .004], [0, .004]], '#f2a7a0', { rough: .6 }, 16, 'paper').position.set(x, y, z);
      sphere(g, .028, '#3d1f12', x, y + .03, z, { rough: .45 });
      for (let i = 0; i < 7; i++) { const a = i * 2.4; box(g, .006, .004, .004, ['#f7d58b', '#fff', '#f2a7a0', '#a8c3a0'][i % 4], x + Math.cos(a) * .018, y + .05 - (i % 3) * .005, z + Math.sin(a) * .018, {}, .001); }
    }
  },
  lasanha(g) {
    const y = plate(g);
    const cols = ['#f3cf73', '#c8452f', '#f7e6b8', '#c8452f', '#f3cf73'];
    cols.forEach((c, i) => box(g, .13, .016, .09, c, 0, y + i * .016, 0, { rough: .55 }, .006));
    box(g, .132, .01, .092, '#f6b84e', 0, y + .08, 0, { rough: .4, coat: .4 }, .005);
    for (let i = 0; i < 4; i++) sphere(g, .008, '#c8452f', -.045 + i * .03, y + .09, (i % 2 - .5) * .03);
    const leaf = sphere(g, .016, '#4f9a3c', .02, y + .094, 0); leaf.scale.set(.02, .006, .012);
  },
  dirty(g) {   // stack of used plates a waiter carries to the sink
    for (let i = 0; i < 3; i++) { const p = cyl(g, .1, .085, .014, '#f4ece2', (i % 2) * .01, i * .018, 0, { rough: .4 }, 18); }
    for (const [x, z] of [[.03, .02], [-.025, -.01]]) sphere(g, .012, '#c9a97e', x, .05, z, { rough: .9 });
  },
  // long recipes (hours to days)
  espaguete(g) {
    const y = plate(g);
    for (let i = 0; i < 9; i++) { const a = i * .7, r = .03 + (i % 3) * .018; const t = torus(g, r, .006, '#f2d27a', { rough: .5 }); t.rotation.x = Math.PI / 2; t.position.set(Math.cos(a) * .012, y + .012 + i * .004, Math.sin(a) * .012); }
    const sauce = sphere(g, .05, '#c4402c', 0, y + .05, 0, { rough: .35, coat: .5 }); sauce.scale.set(.05, .018, .05);
    for (const [x, z] of [[-.025, .01], [.022, .018], [0, -.025]]) sphere(g, .016, '#7a3a22', x, y + .062, z, { rough: .6 });
    const leaf = sphere(g, .014, '#4f9a3c', .01, y + .075, 0); leaf.scale.set(.016, .005, .01);
  },
  pizza(g) {
    cyl(g, .125, .125, .014, '#e3b067', 0, 0, 0, { rough: .7 }, 28);
    cyl(g, .108, .108, .006, '#d4472f', 0, .014, 0, { rough: .4 }, 28);
    cyl(g, .1, .1, .005, '#f8e3a6', 0, .019, 0, { rough: .45 }, 24);
    for (let i = 0; i < 6; i++) { const a = i * 1.05, r = i % 2 ? .06 : .035; cyl(g, .016, .016, .004, '#f4f1e6', Math.cos(a) * r, .024, Math.sin(a) * r, { rough: .4 }, 14); }
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + .4, l = sphere(g, .014, '#3f8f36', Math.cos(a) * .05, .028, Math.sin(a) * .05); l.scale.set(.016, .004, .01); }
  },
  pamonha(g) {
    const y = plate(g);
    for (const [x, ry] of [[-.035, .25], [.035, -.2]]) {
      const p = new THREE.Group(); p.position.set(x, y, 0); p.rotation.y = ry; g.add(p);
      const husk = sphere(p, .05, '#b6cf6a', 0, .028, 0, { rough: .7 }); husk.scale.set(.032, .026, .075);
      const corn = sphere(p, .045, '#f5d469', 0, .036, 0, { rough: .5 }); corn.scale.set(.026, .02, .062);
      box(p, .07, .008, .008, '#c79a55', 0, .05, 0, { rough: .8 }, .002);
    }
  },
  churrasco(g) {
    const y = plate(g);
    for (const z of [-.03, .03]) {
      const stick = cyl(g, .004, .004, .25, '#c9a06a', 0, y + .035, z, { rough: .8 }, 6); stick.rotation.z = Math.PI / 2;
      [['#8a3b23', -.07], ['#e0b04a', -.035], ['#7c3320', 0], ['#5f9a3d', .035], ['#8a3b23', .07]].forEach(([c, x]) => box(g, .03, .03, .03, c, x, y + .035, z, { rough: .6 }, .007));
    }
  },
  frango(g) {
    const y = plate(g, .13);
    for (let i = 0; i < 6; i++) { const a = i * 1.05, l = sphere(g, .02, '#6db24a', Math.cos(a) * .095, y + .01, Math.sin(a) * .095); l.scale.set(.024, .008, .016); }
    const body = sphere(g, .07, '#d98a3a', 0, y + .052, 0, { rough: .35, coat: .7 }); body.scale.set(.07, .05, .085);
    for (const x of [-1, 1]) { const leg = sphere(g, .03, '#cf7e33', x * .055, y + .045, .05, { rough: .35, coat: .7 }); leg.scale.set(.026, .024, .04); sphere(g, .01, '#fff6e8', x * .062, y + .045, .09, { rough: .6 }); }
  },
  feijoada(g) {
    lathe(g, [[0, 0], [.07, 0], [.1, .02], [.11, .07], [.1, .09], [.095, .085], [0, .085]], '#7b3f25', { rough: .55 }, 28, 'clay');
    cyl(g, .095, .095, .006, '#2b1712', 0, .08, 0, { rough: .3, coat: .6 }, 24);
    for (let i = 0; i < 5; i++) { const a = i * 1.3; box(g, .028, .014, .02, i % 2 ? '#8a3b23' : '#c06a4a', Math.cos(a) * .045, .088, Math.sin(a) * .045, { rough: .5 }, .005); }
    const o = cyl(g, .028, .028, .006, '#f39a2c', .07, .1, -.02, { rough: .4 }, 16); o.rotation.z = .5;
    for (const x of [-1, 1]) { const ear = torus(g, .018, .006, '#7b3f25', { rough: .55 }); ear.position.set(x * .112, .07, 0); ear.rotation.y = Math.PI / 2; }
  },
  florestanegra(g) {
    const y = plate(g);
    wedge(g, '#3e2117', .03, y);
    wedge(g, '#fff4ea', .015, y + .03);
    wedge(g, '#3e2117', .03, y + .045, '#fff4ea');
    for (let i = 0; i < 3; i++) { sphere(g, .016, '#fff4ea', -.02 + i * .035, y + .1, (i - 1) * .02, { rough: .6 }); sphere(g, .012, '#b3122a', -.02 + i * .035, y + .118, (i - 1) * .02, { rough: .2, coat: 1 }); }
    for (let i = 0; i < 6; i++) box(g, .01, .004, .006, '#2a150e', .03 - i * .012, y + .096, .04 - i * .01, {}, .001);
  },
  // premium recipes
  brownie(g) { const y = plate(g);
    for (const [x, z] of [[-.035, -.025], [.035, -.025], [-.035, .03], [.035, .03]]) {
      box(g, .062, .038, .05, '#53301f', x, y + .02, z, { rough: .55 }, .008);
      box(g, .05, .008, .04, '#3a2015', x, y + .042, z, { rough: .3, coat: .7 }, .004);
      sphere(g, .009, '#f7f1e6', x + .012, y + .05, z - .008, { rough: .3, coat: .6 });
    }
  },
  chai(g) { cup(g, .068, .085, '#c08a52'); const y = .085;
    cyl(g, .036, .036, .01, '#e8cfa8', 0, y, 0, { rough: .4, coat: .4 }, 16);
    cyl(g, .005, .005, .07, '#9a6a3a', .02, y + .035, .01, { rough: .6 }, 6).rotation.z = .25;
    sphere(g, .006, '#8a5a2a', -.012, y + .008, .01, { rough: .6 });
  },
  'pao-mel'(g) { const y = plate(g);
    for (const [x, z] of [[-.03, -.02], [.035, .02]]) {
      lathe(g, [[0, 0], [.044, 0], [.05, .03], [.044, .055], [0, .062]], '#8a5a2a', { rough: .5, coat: .5 }, 18, 'pm').position.set(x, y, z);
      sphere(g, .013, '#fff6ea', x + .01, y + .055, z, { rough: .3, coat: .6 });
    }
  },
  pistachio(g) { const y = plate(g);
    cyl(g, .085, .085, .055, '#cfe3a8', 0, y + .028, 0, { rough: .55 }, 22);
    cyl(g, .086, .086, .012, '#9bc46a', 0, y + .06, 0, { rough: .4, coat: .4 }, 22);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sphere(g, .009, '#7fae4e', Math.cos(a) * .055, y + .07, Math.sin(a) * .055, { rough: .4 }); }
  },
  focaccia(g) { const y = plate(g);
    box(g, .2, .035, .15, '#e0b878', 0, y + .018, 0, { rough: .6 }, .02);
    for (const [x, z] of [[-.05, -.03], [.04, .02], [-.02, .04], [.06, -.04]]) sphere(g, .012, '#7fae4e', x, y + .04, z, { rough: .5 });
    for (const [x, z] of [[-.07, .03], [.03, -.05]]) sphere(g, .016, '#c94a4a', x, y + .042, z, { rough: .35, coat: .5 });
  },
  quiche(g) { const y = plate(g);
    cyl(g, .095, .085, .05, '#e8c98a', 0, y + .025, 0, { rough: .6 }, 20);
    cyl(g, .085, .085, .018, '#f3dca8', 0, y + .055, 0, { rough: .5 }, 20);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(g, .035, .008, .012, '#8cae6a', Math.cos(a) * .04, y + .065, Math.sin(a) * .04, { rough: .5 }, .004); }
  },
  gelato(g) { const y = plate(g);
    lathe(g, [[0, 0], [.055, .01], [.06, .07], [.052, .075], [0, .07]], '#eef4f7', { rough: .2, coat: .6 }, 16, 'gcup').position.y = y;
    for (const [x, z, c] of [[-.025, 0, '#cfe3a8'], [.025, .01, '#f3d6a8'], [0, -.025, '#e8a0b4']]) sphere(g, .035, c, x, y + .085, z, { rough: .5 });
    box(g, .008, .07, .025, '#e8c99a', .04, y + .1, .02, { rough: .6 }, .003);
  },
  affogato(g) { cup(g, .07, .09, '#4a2a1a'); const y = .09;
    sphere(g, .035, '#f3ecd8', 0, y + .01, 0, { rough: .5 });
    cyl(g, .004, .004, .06, '#caa23e', .025, y + .03, .01, { rough: .3, metal: .6 }, 6);
  },
  pavlova(g) { const y = plate(g);
    lathe(g, [[0, 0], [.09, .01], [.085, .06], [.06, .075], [0, .07]], '#fffaf2', { rough: .55 }, 20, 'pav').position.y = y;
    for (const [x, z] of [[-.03, -.02], [.03, .01], [0, .035], [-.045, .03], [.05, -.03]]) sphere(g, .022, '#e3364f', x, y + .085, z, { rough: .35, coat: .55 });
    for (const [x, z] of [[.01, -.04], [-.05, -.01]]) sphere(g, .012, '#9bc46a', x, y + .09, z, { rough: .5 });
  },
  chocquente(g) { cup(g, .072, .092, '#5a3a24'); const y = .092;
    cyl(g, .038, .038, .014, '#f7f1e6', 0, y, 0, { rough: .5 }, 16);
    for (const [x, z] of [[-.015, .01], [.016, -.008], [.004, .022]]) sphere(g, .012, '#fffaf2', x, y + .012, z, { rough: .6 });
    sphere(g, .01, '#8a5a2a', 0, y + .024, 0, { rough: .5 });
  },
  macaron(g) { const y = plate(g);
    for (const [x, z] of [[-.05, -.02], [.02, .02], [.055, -.035]]) {
      cyl(g, .042, .04, .022, '#d9b8e0', x, y + .012, z, { rough: .5 }, 16);
      cyl(g, .038, .038, .012, '#fff1d0', x, y + .034, z, { rough: .4 }, 16);
      cyl(g, .042, .04, .022, '#d9b8e0', x, y + .046, z, { rough: .5 }, 16);
    }
  },
  fondue(g) { const y = plate(g);
    cyl(g, .08, .065, .055, '#caa23e', 0, y + .028, 0, { rough: .25, metal: .7 }, 20);
    cyl(g, .07, .07, .012, '#5a3a24', 0, y + .058, 0, { rough: .2, coat: .9 }, 18);
    for (const [x, z, a] of [[-.07, .05, .6], [.07, .05, -.6]]) { const sk = cyl(g, .005, .005, .13, '#c9a06a', x, y + .07, z, { rough: .6 }, 6); sk.rotation.z = a; }
    sphere(g, .022, '#e3364f', -.09, y + .09, .06, { rough: .35, coat: .5 });
  },
  matchalatte(g) { cup(g, .07, .09, '#cfe3a8'); const y = .09;
    cyl(g, .036, .036, .012, '#eef7e4', 0, y, 0, { rough: .45 }, 16);
    for (let i = 0; i < 3; i++) sphere(g, .008, '#9bc46a', -.012 + i * .012, y + .01, 0, { rough: .5 });
  },
  bolodeouro(g) { const y = plate(g);
    cyl(g, .092, .092, .07, '#6b4a3a', 0, y + .035, 0, { rough: .5 }, 22);
    cyl(g, .094, .094, .014, '#caa23e', 0, y + .076, 0, { rough: .12, metal: .9 }, 22);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; box(g, .022, .016, .022, '#e8c362', Math.cos(a) * .06, y + .09, Math.sin(a) * .06, { rough: .1, metal: .95 }, .004); }
    sphere(g, .018, '#e3364f', 0, y + .095, 0, { rough: .3, coat: .6 });
  },
  moccaccino(g) { cup(g, .068, .085, '#5b3a22'); const y = .085;
    cyl(g, .036, .036, .012, '#f3e3cd', 0, y, 0, { rough: .4, coat: .5 }, 16);
    for (let i = 0; i < 3; i++) sphere(g, .007, '#5a3524', -.014 + i * .014, y + .008, .004, { rough: .5 });
    cyl(g, .004, .004, .05, '#c94a63', .022, y + .03, .012, { rough: .4 }, 6);
  },
};
const cache = new Map();
// Whole versions for the counter (the guest's plate keeps the slice): one round cake, not a pile of slices.
const WHOLE = {
  bolo(g) { const y = plate(g, .13);
    cyl(g, .1, .1, .07, '#f29a45', 0, y + .035, 0, { rough: .65 }, 24);
    cyl(g, .102, .1, .016, '#5e301c', 0, y + .076, 0, { rough: .3, coat: .5 }, 24);             // chocolate topping
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sphere(g, .012, '#5e301c', Math.cos(a) * .072, y + .09, Math.sin(a) * .072, { rough: .3, coat: .5 }); }
    sphere(g, .02, '#fff3e4', 0, y + .095, 0, { rough: .6 });
  },
  torta(g) { const y = plate(g, .13);
    cyl(g, .105, .095, .03, '#d9a35e', 0, y + .015, 0, { rough: .6 }, 24);                       // crust
    cyl(g, .095, .095, .035, '#f7e27a', 0, y + .045, 0, { rough: .4, coat: .3 }, 24);            // lemon cream
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sphere(g, .018, '#fff8ec', Math.cos(a) * .07, y + .07, Math.sin(a) * .07, { rough: .6 }); }   // meringue dots
    const lemon = cyl(g, .022, .022, .006, '#f2d33a', 0, y + .07, 0, { rough: .4 }, 14); lemon.rotation.z = Math.PI / 2;
  },
};
const wholeCache = new Map();
export function food3dWhole(id) {
  if (!WHOLE[id]) return food3d(id);
  let src = wholeCache.get(id);
  if (!src) { src = new THREE.Group(); WHOLE[id](src); src.traverse(o => { if (o.geometry) SHARED.add(o.geometry); if (o.material) SHARED.add(o.material); }); wholeCache.set(id, src); }
  return src.clone(true);
}
export function food3d(id) {
  let src = cache.get(id);
  if (!src) { src = new THREE.Group(); (BUILD[id] || BUILD.espresso)(src); src.traverse(o => { if (o.geometry) SHARED.add(o.geometry); if (o.material) SHARED.add(o.material); }); cache.set(id, src); }
  return src.clone(true);
}

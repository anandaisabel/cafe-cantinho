// Firebase backend for builds outside claude.ai (e.g. GitHub Pages).
// It exposes the same small API the game already uses with the claude.ai artifact db:
//   db.doc(path).get()/set()/delete()/onSnapshot(), db.collection(name).doc(id), .where(f, '==', v).onSnapshot()
//   user.id(), user.profiles()
// Documents are stored as { json, ...top-level scalars }: Firestore rejects arrays inside arrays, and the
// scalars (owner, to, from, name…) stay queryable for the security rules and the gift inbox.
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const load = name => import(/* loaded at runtime from Google's CDN, not bundled */ SDK + name);

export async function connectFirebase(cfg) {
  const [{ initializeApp }, A, F] = await Promise.all([load('firebase-app.js'), load('firebase-auth.js'), load('firebase-firestore.js')]);
  const app = initializeApp(cfg), auth = A.getAuth(app), fs = F.getFirestore(app);
  try { await A.setPersistence(auth, A.browserLocalPersistence); } catch (e) { }
  const existing = await new Promise(res => { const off = A.onAuthStateChanged(auth, u => { off(); res(u); }); });
  if (!existing) await A.signInAnonymously(auth);

  const pack = obj => {
    const out = { json: JSON.stringify(obj) };
    for (const [k, v] of Object.entries(obj || {})) if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) out[k] = v;
    return out;
  };
  const unpack = s => { if (!s || !s.exists()) return null; const d = s.data(); try { return d.json ? JSON.parse(d.json) : d; } catch (e) { return d; } };
  const wrap = s => ({ id: s.id, data: () => unpack(s) });
  const docApi = ref => ({
    get: async () => wrap(await F.getDoc(ref)),
    set: d => F.setDoc(ref, pack(d)),
    delete: () => F.deleteDoc(ref),
    onSnapshot: (cb, err) => F.onSnapshot(ref, s => cb(wrap(s)), err),
  });
  const colApi = (path, filters = []) => ({
    doc: id => docApi(F.doc(fs, path, id)),
    where: (f, op, v) => colApi(path, [...filters, F.where(f, op, v)]),
    onSnapshot: (cb, err) => F.onSnapshot(F.query(F.collection(fs, path), ...filters), s => cb({ docs: s.docs.map(wrap) }), err),
  });
  const db = { doc: p => docApi(F.doc(fs, p)), collection: p => colApi(p) };

  const user = {
    id: async () => auth.currentUser.uid,
    profiles: async () => ({}),
    isAnonymous: () => !!(auth.currentUser && auth.currentUser.isAnonymous),
    email: () => (auth.currentUser && auth.currentUser.email) || '',
    // Google sign-in keeps the same café on every device. On a first sign-in the anonymous café is
    // linked to the Google account; if that account already has a café, we switch to it instead.
    google: async () => {
      const prov = new A.GoogleAuthProvider();
      try { await A.linkWithPopup(auth.currentUser, prov); return 'linked'; }
      catch (e) {
        if (e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use')) {
          const cred = A.GoogleAuthProvider.credentialFromError(e);
          if (cred) { await A.signInWithCredential(auth, cred); return 'switched'; }
        }
        if (e && e.code === 'auth/popup-blocked') { await A.linkWithRedirect(auth.currentUser, prov); return 'redirect'; }
        throw e;
      }
    },
  };
  return { db, user };
}

// Firebase backend for builds outside claude.ai (e.g. GitHub Pages).
// It exposes the same small API the game already uses with the claude.ai artifact db:
//   db.doc(path).get()/set()/delete()/onSnapshot(), db.collection(name).doc(id), .where(f, '==', v).onSnapshot()
//   user.id(), user.profiles(); plus account (sign up / in / Google / reset / out) for the login screen
// Documents are stored as { json, ...top-level scalars }: Firestore rejects arrays inside arrays, and the
// scalars (owner, to, from, name…) stay queryable for the security rules and the gift inbox.
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const load = name => import(/* loaded at runtime from Google's CDN, not bundled */ SDK + name);

export async function connectFirebase(cfg) {
  const [{ initializeApp }, A, F] = await Promise.all([load('firebase-app.js'), load('firebase-auth.js'), load('firebase-firestore.js')]);
  const app = initializeApp(cfg), auth = A.getAuth(app), fs = F.getFirestore(app);
  auth.languageCode = 'pt-BR';   // password-reset e-mails in Portuguese
  try { await A.setPersistence(auth, A.browserLocalPersistence); } catch (e) { }
  try { await A.getRedirectResult(auth); } catch (e) { }   // coming back from a Google redirect sign-in
  await new Promise(res => { const off = A.onAuthStateChanged(auth, () => { off(); res(); }); });

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

  const cur = () => auth.currentUser;
  const user = {
    id: async () => cur().uid,
    profiles: async () => ({}),
    isAnonymous: () => !!(cur() && cur().isAnonymous),
    email: () => (cur() && cur().email) || '',
  };
  // Accounts. An anonymous player (from before login was required) keeps the same id when creating an account,
  // so the café stays where it is. Signing in to an existing account switches to that account's café.
  const google = async () => {
    const prov = new A.GoogleAuthProvider();
    const anon = cur() && cur().isAnonymous;
    try {
      if (anon) await A.linkWithPopup(cur(), prov); else await A.signInWithPopup(auth, prov);
      return 'ok';
    } catch (e) {
      if (e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use')) {
        const cred = A.GoogleAuthProvider.credentialFromError(e);
        if (cred) { await A.signInWithCredential(auth, cred); return 'ok'; }
      }
      if (e && e.code === 'auth/popup-blocked') { if (anon) await A.linkWithRedirect(cur(), prov); else await A.signInWithRedirect(auth, prov); return 'redirect'; }
      throw e;
    }
  };
  const account = {
    user: () => cur() ? { uid: cur().uid, anonymous: cur().isAnonymous } : null,
    signUp: (email, pass) => cur() && cur().isAnonymous
      ? A.linkWithCredential(cur(), A.EmailAuthProvider.credential(email, pass))
      : A.createUserWithEmailAndPassword(auth, email, pass),
    signIn: (email, pass) => A.signInWithEmailAndPassword(auth, email, pass),
    google,
    reset: email => A.sendPasswordResetEmail(auth, email),
    signOut: () => A.signOut(auth),
  };
  user.signOut = account.signOut;
  return { db, user, account };
}

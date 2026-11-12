// Account screen for the GitHub Pages build: nobody plays without signing in (create account, sign in,
// reset password, or Google). An anonymous café from before accounts existed goes along when the account is created.
const ERR = {
  'auth/invalid-email': 'Esse e-mail não parece certo.',
  'auth/missing-email': 'Escreva seu e-mail.',
  'auth/missing-password': 'Escreva sua senha.',
  'auth/weak-password': 'A senha precisa de pelo menos 6 letras ou números.',
  'auth/email-already-in-use': 'Esse e-mail já tem conta. Toque em "Entrar".',
  'auth/credential-already-in-use': 'Esse e-mail já tem conta. Toque em "Entrar".',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Não achamos conta com esse e-mail. Toque em "Criar conta".',
  'auth/too-many-requests': 'Muitas tentativas. Espere um pouquinho e tente de novo.',
  'auth/network-request-failed': 'Sem internet agora. Confira a conexão e tente de novo.',
  'auth/operation-not-allowed': 'Esse jeito de entrar ainda não está ligado no servidor do jogo.',
  'auth/unauthorized-domain': 'Este endereço ainda não está liberado para entrar com Google.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups e tente de novo.',
};
const QUIET = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);
const msgOf = e => ERR[e && e.code] || 'Não deu certo agora. Tente de novo.';
const GOOGLE_G = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>';

// acct: the account API from net-firebase.js. hasCafe: this device already has an anonymous café to keep.
// Resolves once the player is signed in with a real (non-anonymous) account.
export function loginScreen(acct, { hasCafe = false } = {}) {
  return new Promise(resolve => {
    let had = false; try { had = !!localStorage.getItem('cc_had_account'); } catch (e) { }
    let mode = had && !hasCafe ? 'in' : 'up';
    const root = document.createElement('div'); root.className = 'login'; root.id = 'login';
    root.innerHTML = `
      <div class="lcard">
        <div class="lcup"><i></i><i></i><i></i></div>
        <h1>Café Cantinho</h1>
        <div class="lseg"><button data-m="up">Criar conta</button><button data-m="in">Entrar</button></div>
        ${hasCafe ? '<p class="lnote">Seu café deste aparelho vai junto para a conta nova.</p>' : ''}
        <form novalidate>
          <label>E-mail<input class="txt" type="email" name="email" autocomplete="email" inputmode="email" required></label>
          <label>Senha<span class="lpw"><input class="txt" type="password" name="pass" minlength="6" required><button type="button" class="leye" aria-label="Mostrar senha">👁</button></span></label>
          <p class="lerr" role="alert"></p>
          <button class="btn big lgo" type="submit"></button>
        </form>
        <button class="lforgot" type="button">Esqueci minha senha</button>
        <div class="lor"><span>ou</span></div>
        <button class="btn ghost lgoogle" type="button">${GOOGLE_G} Entrar com Google</button>
      </div>`;
    document.body.appendChild(root);
    const $ = s => root.querySelector(s), form = $('form'), email = form.email, pass = form.pass, err = $('.lerr'), go = $('.lgo');
    const show = (t, ok) => { err.textContent = t || ''; err.classList.toggle('ok', !!ok); };
    const paint = () => {
      root.querySelectorAll('.lseg button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
      go.textContent = mode === 'up' ? 'Criar conta e jogar' : 'Entrar e jogar';
      pass.autocomplete = mode === 'up' ? 'new-password' : 'current-password';
      $('.lforgot').style.visibility = mode === 'in' ? 'visible' : 'hidden';
      show('');
    };
    root.querySelectorAll('.lseg button').forEach(b => b.onclick = () => { mode = b.dataset.m; paint(); });
    $('.leye').onclick = () => { pass.type = pass.type === 'password' ? 'text' : 'password'; };
    let busy = false;
    const run = async fn => {
      if (busy) return; busy = true; root.classList.add('busy'); show('');
      try { const ok = await fn(); if (ok) { try { localStorage.setItem('cc_had_account', '1'); } catch (e) { } root.remove(); resolve(); return; } }
      catch (e) { if (!QUIET.has(e && e.code)) show(msgOf(e)); console.warn('login', e && e.code); }
      busy = false; root.classList.remove('busy');
    };
    form.onsubmit = ev => {
      ev.preventDefault();
      const em = email.value.trim(), pw = pass.value;
      if (!em) return show(ERR['auth/missing-email']);
      if (!pw) return show(ERR['auth/missing-password']);
      if (mode === 'up' && pw.length < 6) return show(ERR['auth/weak-password']);
      run(async () => { await (mode === 'up' ? acct.signUp(em, pw) : acct.signIn(em, pw)); return true; });
    };
    $('.lgoogle').onclick = () => run(async () => (await acct.google()) !== 'redirect');
    $('.lforgot').onclick = () => {
      const em = email.value.trim();
      if (!em) { show('Escreva seu e-mail acima e toque de novo em "Esqueci minha senha".'); email.focus(); return; }
      run(async () => { await acct.reset(em); show('Pronto! Enviamos um link para criar uma senha nova. Olhe também a caixa de spam.', true); return false; });
    };
    paint();
  });
}

// Shown when the same café is opened on another device or tab: the newest one wins, this one stops saving.
export function takenOverScreen() {
  if (document.getElementById('takeover')) return;
  const root = document.createElement('div'); root.className = 'login'; root.id = 'takeover';
  root.innerHTML = `<div class="lcard"><div class="lcup"><i></i><i></i><i></i></div><h1>Café aberto em outro lugar</h1>
    <p class="lnote">Você abriu este café em outro aparelho ou aba. Para não misturar o progresso, este aqui parou de salvar.</p>
    <button class="btn big lgo" type="button">Continuar aqui</button></div>`;
  document.body.appendChild(root);
  root.querySelector('.lgo').onclick = () => location.reload();
}

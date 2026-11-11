# Publicar o Café Cantinho (GitHub Pages + Firebase, tudo grátis)

O jogo é um HTML único. O GitHub Pages hospeda de graça, e o Firebase (plano gratuito "Spark")
guarda os cafés na nuvem e liga os vizinhos. Sem o Firebase o jogo funciona igual, salvando só no aparelho.

| Peça | Para quê | Custo |
|---|---|---|
| GitHub (repositório público) | guardar o código e hospedar o site | grátis |
| GitHub Actions | montar o `index.html` e publicar a cada envio | grátis em repositório público |
| Firebase Authentication | login anônimo automático + "Entrar com Google" | grátis |
| Cloud Firestore | cafés na nuvem, vizinhos, presentes e gorjetas | grátis até 50 mil leituras e 20 mil gravações por dia |

---

## 1. GitHub

1. Entre na sua conta pelo terminal (abre o navegador para confirmar):
   ```bash
   gh auth login --hostname github.com --git-protocol https --web
   ```
   ```bash
   gh auth setup-git
   ```
2. Crie o repositório e envie o código (o Claude faz isto depois do login):
   ```bash
   gh repo create cafe-cantinho --public --source . --push
   ```
3. Ligue o Pages com publicação pelo GitHub Actions:
   ```bash
   gh api -X POST repos/{owner}/cafe-cantinho/pages -f build_type=workflow
   ```
4. Cada `git push` na `main` roda `.github/workflows/deploy.yml`: `npm ci` → `python3 build.py` →
   copia `public/` (ícone e manifesto) → publica. Endereço: `https://SEU-USUARIO.github.io/cafe-cantinho/`.

## 2. Firebase (para vizinhos, presentes e save na nuvem)

1. Acesse <https://console.firebase.google.com> → **Adicionar projeto** (nome: `cafe-cantinho`; o Google Analytics pode ficar desligado).
2. **Build › Authentication › Vamos começar**
   - Aba **Método de login**: ative **Anônimo** e **Google**.
   - Aba **Configurações › Domínios autorizados**: adicione `SEU-USUARIO.github.io`.
3. **Build › Firestore Database › Criar banco de dados**
   - Local: `southamerica-east1 (São Paulo)`. Modo: **produção**.
   - Aba **Regras**: apague o conteúdo, cole o arquivo `firestore.rules` deste repositório e clique em **Publicar**.
4. **Configurações do projeto (engrenagem) › Seus apps › Web `</>`** → registre o app (sem Hosting) e copie o
   objeto `firebaseConfig`.
5. Cole em `js/firebase-config.js` no lugar de `null`:
   ```js
   export const FIREBASE_CONFIG = { apiKey: "…", authDomain: "…", projectId: "…", storageBucket: "…", messagingSenderId: "…", appId: "…" };
   ```
   Esses valores **não são segredo**: quem protege os dados são as regras do Firestore.
6. Envie (`git commit` + `git push`) e espere o Actions publicar.

## 3. Jogar

- **iPhone:** abra o endereço no Safari → botão **Compartilhar** → **Adicionar à Tela de Início**. Abre em tela cheia, como app.
- **Mesmo café em vários aparelhos:** Configurações › **Entrar com Google**.
- **Vizinhas:** Vizinhos › **Copiar convite** (ou Compartilhar) e mande o link. Quem abrir vira sua vizinha.
  Só aparecem os cafés que você adicionou, nunca os de desconhecidos.
- **Trazer o café do claude.ai:** na versão do claude.ai, Configurações › Levar meu café › **Exportar**;
  na versão do GitHub Pages, **Importar** e cole o código.

## Como funciona por dentro

- `js/state.js` escolhe o banco: dentro do claude.ai usa o db do artifact; fora, com `FIREBASE_CONFIG`, usa
  `js/net-firebase.js`; sem nada, joga só no aparelho.
- `js/net-firebase.js` imita a API do db do artifact (`doc().get/set`, `collection().where().onSnapshot`) e
  carrega o SDK do Firebase (10.12.2) da CDN do Google só quando precisa.
- Cada café é salvo como `{ json, …campos simples }`: o Firestore não aceita listas dentro de listas, e os campos
  simples (`owner`, `to`, `from`) ficam visíveis para as regras.
- Na nuvem, o café é gravado no máximo a cada 30 s (e sempre ao fechar ou esconder a aba), para caber no plano gratuito.
- `firestore.rules`: cada pessoa só altera o próprio café; presentes são criados por quem envia e lidos e
  apagados por quem recebe.

# Deploy na Cloudflare (conta do cliente) — Bandeiras

O site é estático (Astro → `dist/`). A Cloudflare conecta ao repositório `Dmove-Marketing/bandeiras` e publica a cada push na `main`. Não há VPS nem GitHub Actions neste projeto.

Páginas: `/` (hub) · `/eventos-corporativos/` · `/bio/` · domínio final: `eventos.bandeirasempresarial.com.br`.

## Antes de começar

- [ ] Acesso à conta Cloudflare **do cliente** (perfil que crie Workers e gerencie domínios).
- [ ] Alguém com permissão de **administrador na organização `Dmove-Marketing`** no GitHub (para autorizar o app da Cloudflare).
- [ ] Saber onde está o DNS de `bandeirasempresarial.com.br`:
  - **Já na Cloudflare** → siga o caminho A (Workers), abaixo.
  - **Em outro provedor** → o Workers exige a zona na Cloudflare. Use o caminho B (Pages), que aceita um CNAME no DNS atual.

## Caminho A — Workers (recomendado pela Cloudflare para projetos novos)

O repositório já tem o [wrangler.jsonc](../wrangler.jsonc) (publica `./dist`).

1. Painel Cloudflare → **Workers & Pages** → **Create application** → **Import a repository** (GitHub).
2. Se pedir, **autorize o app "Cloudflare Workers and Pages"** na organização `Dmove-Marketing` e libere **somente o repositório `bandeiras`**.
3. Escolha o repositório `Dmove-Marketing/bandeiras` e preencha:

   | Campo | Valor |
   | --- | --- |
   | Project / Worker name | `bandeiras` (igual ao `name` do `wrangler.jsonc`) |
   | Production branch | `main` |
   | Root directory | `/` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |

   Em **Build variables**, adicione `NODE_VERSION` = `22` (o projeto exige Node ≥ 22.12).
4. **Save and Deploy**. Ao terminar, abra a URL `https://bandeiras.<subdominio>.workers.dev` e confira `/`, `/eventos-corporativos/` e `/bio/`.
5. **Domínio próprio:** no Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → `eventos.bandeirasempresarial.com.br`. DNS e certificado SSL são criados automaticamente (a zona precisa estar nesta conta).

## Caminho B — Pages (DNS fora da Cloudflare)

1. **Workers & Pages** → **Create application** → aba **Pages** → **Import an existing Git repository** → `Dmove-Marketing/bandeiras` → **Begin setup**.
2. Production branch `main` · Build command `npm run build` · Build output directory `dist` · variável `NODE_VERSION` = `22` → **Save and Deploy**.
3. Em **Custom domains** → **Set up a custom domain** → `eventos.bandeirasempresarial.com.br`. A Cloudflare mostra o CNAME a criar no provedor de DNS atual (apontando para `bandeiras.pages.dev`). Crie o registro e aguarde a validação.

> O arquivo `wrangler.jsonc` do repositório não atrapalha o caminho B.

## Validação depois de publicar

- [ ] `https://eventos.bandeirasempresarial.com.br/` abre o hub e o link leva a `/eventos-corporativos/`.
- [ ] `/bio/` mostra os 4 ícones, o mapa e o formulário (Empresa sempre visível, só tipos corporativos).
- [ ] Fontes (Nexa) e imagens do CDN carregam, sem erros no console.
- [ ] Popup de WhatsApp abre com o favicon da marca.
- [ ] **Lead de teste** no formulário (combine antes, pois dispara o n8n real: `https://server3n8n.dmove.com.br/webhook/bandeiras`).
- [ ] Em produção, `/cdn-cgi/trace` responde (usado para capturar o IP do lead) — em desenvolvimento local ele dá 404, é esperado.

## Rotina depois do primeiro deploy

- **Publicar:** commit → push na `main` → a Cloudflare builda e publica sozinha.
- **Preview:** branches e PRs geram URLs de preview, sem afetar a produção.
- **Build falhou?** O resultado aparece como check no GitHub e em **Deployments** no painel; dá para refazer o build pelo próprio GitHub.
- **Ativar o GTM depois:** preencher `tracking.gtm_id` no `config.json` e dar push.

## Pendências do projeto

- GTM ID (sem GTM por enquanto).
- Avatar do WhatsApp usa o favicon; trocar se o cliente enviar outra imagem.
- OG image e favicon definitivos.

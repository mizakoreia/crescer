# Deploy — link público grátis

Arquitetura: **Vercel** (frontend web estático) + **Supabase nuvem** (Postgres/Auth/Storage) + **Supabase Edge Functions** (IA, PDF, exportação). Custo zero.

Os passos abaixo exigem login nas TUAS contas — por isso não são automatizáveis. Cada um leva poucos minutos.

## 1. GitHub

Repo local já está pronto (branch `main`, remote `origin` → `github.com/Mizakoreia/crescer.git`).

1. Cria repo vazio: <https://github.com/new> → nome `crescer` → **sem** README/gitignore/license.
2. Push:
   ```sh
   git push -u origin main
   ```
   (primeira vez abre o navegador pra autenticar)

Se teu usuário não for `Mizakoreia`: `git remote set-url origin https://github.com/SEU-USER/crescer.git`.

## 2. Supabase (backend)

1. <https://supabase.com> → **New project** (free tier). Guarda a senha do banco.
2. SQL Editor → New query → cola **todo** o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) → **Run**. (São as 2 migrations juntas.)
3. Settings → API → copia **Project URL** e **anon public key**.

## 3. Vercel (frontend)

1. <https://vercel.com> → **Add New → Project** → importa o repo `crescer`.
   O `vercel.json` já define build (`expo export --platform web`), output (`dist`) e rewrite SPA.
2. Antes de **Deploy**, em **Environment Variables** adiciona:
   | Name | Value |
   |---|---|
   | `EXPO_PUBLIC_SUPABASE_URL` | (Project URL do passo 2.3) |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | (anon key do passo 2.3) |
3. **Deploy** → sai o link `https://crescer-xxx.vercel.app`. **Esse é o link público** — manda pra quem quiser testar.

Cada `git push` novo → Vercel rebuilda sozinho.

## 4. Edge Functions (IA ✨ / PDF / exportação)

Sem este passo o app funciona (auth, diário, saúde, agenda, trabalho); só os 3 botões de função dão erro.

```sh
npm i -g supabase
supabase login
supabase link --project-ref SEU-REF        # SEU-REF está na URL do projeto Supabase
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy
```

Atalho: depois de `supabase login`, roda [`scripts/deploy.ps1`](scripts/deploy.ps1) — ele faz link + secret + deploy + git push de uma vez.

## Testar depois no ar

1. Abre o link do Vercel no celular/PC.
2. Cria conta profissional → **Nova criança** → **Convidar responsável** (copia o código).
3. Noutra conta (aba anônima) → **Aceitar convite** → liga os consentimentos (inclui *Recursos automáticos* pra IA).
4. Volta na profissional → **Diário** registra o dia → **✨ Enriquecer** → revisa a narrativa.
5. **Resumo semanal** → Revisar e compartilhar → **Gerar PDF**.

## Domínio próprio (opcional, grátis)

Vercel → Project → Settings → Domains → adiciona um domínio que já tenhas, ou usa o `*.vercel.app`.

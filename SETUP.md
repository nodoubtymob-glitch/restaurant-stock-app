# Restaurant Stock Control - Setup Guide

## Pré-requisitos

- Node.js 16+
- npm ou yarn
- Conta no Supabase
- Conta no Vercel

## 1. Clonar e Instalar

```bash
git clone <seu-repo>
cd restaurant-stock-app
npm install
```

## 2. Configurar Variáveis de Ambiente

Copie o `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

As credenciais já estão preenchidas. Não commit o `.env.local`.

## 3. Executar SQL no Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Crie uma nova query
5. Cole o conteúdo de `supabase/migrations/001_init_schema.sql`
6. Execute (Cmd+Enter)

### Possíveis erros:

- **"permission denied"**: Use a key de service role no admin client, não a anon key
- **"storage bucket already exists"**: Ignore, é seguro

## 4. Criar Primeiro Admin

No Supabase SQL Editor, execute:

```sql
-- Cria usuário no auth
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, instance_id, aud, role)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated'
)
ON CONFLICT DO NOTHING;

-- Manualmente, crie o profile correspondente via Dashboard:
-- Supabase > Profiles > Insert Row
-- id: <copy do user id acima>
-- email: admin@test.com
-- role: admin
```

Ou use o dashboard:
1. Vá para **Authentication > Users**
2. Clique **Add user**
3. Email: `admin@test.com`
4. Password: `password123`
5. **Create user**
6. Copie o **User ID**
7. Vá para **SQL Editor** e execute:

```sql
INSERT INTO profiles (id, email, role)
VALUES ('<USER-ID>', 'admin@test.com', 'admin');
```

## 5. Executar Localmente

```bash
npm run dev
```

Acesse http://localhost:3000

- Login: `admin@test.com` / `password123`
- Redirect automático para `/dashboard`

## 6. Testar Fluxo

### Admin
- [ ] Login como admin
- [ ] Ir para Dashboard
- [ ] Criar categoria (ex: "Bebidas")
- [ ] Criar unidade (ex: "Garrafa")
- [ ] Criar produto (ex: "Cerveja Brahma")
- [ ] Registrar entrada (ex: +12 garrafas)
- [ ] Registrar saída (ex: -5 garrafas)
- [ ] Ver histórico
- [ ] Convidar funcionário

### Funcionário
- [ ] Criar funcionário via admin (página `/admin/usuarios`)
- [ ] Login como funcionário
- [ ] Não conseguir acessar `/admin` (redirect)
- [ ] Ir para `/stock/saida`
- [ ] Registrar saída (não vê preço)
- [ ] Ver `/historico`

## 7. Deploy no Vercel

```bash
git push origin main
```

No Vercel:
1. Conecte seu repositório GitHub
2. Variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy

## Troubleshooting

**"Cannot find module '@supabase/auth-helpers-nextjs'"**
```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

**RLS Policy "denied"**
- Check Supabase > Policies
- Ensure the policy matches your role
- Verify role in `profiles` table

**Login not working**
- Confirm user exists in `auth.users`
- Confirm profile exists in `profiles` with correct role
- Check `.env.local` URLs

**Photos not uploading**
- Verify storage bucket `product-photos` exists
- Check storage policies in RLS
- Ensure file size < 10MB

## Próximas Funcionalidades

- [ ] Gráficos de faturamento
- [ ] Alertas de estoque baixo
- [ ] Filtros avançados no histórico
- [ ] Export de relatórios (PDF/CSV)
- [ ] Dark mode toggle
- [ ] Notificações

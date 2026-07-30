# 🍽️ Restaurant Stock Control

Sistema de controle de estoque para restaurantes e bares.

## Features

✅ **Autenticação** — Login email/senha via Supabase  
✅ **Controle de Estoque** — Entrada/Saída de produtos  
✅ **Histórico** — Audit trail completo de movimentações  
✅ **Faturamento** — Cálculo automático de bruto/líquido  
✅ **Roles** — Admin (acesso total) e Funcionário (só saída)  
✅ **Segurança** — Preços ocultos de funcionários via RLS  
✅ **Fotos** — Upload de imagens de produtos  
✅ **Responsivo** — Mobile-first, tela de toque  

## Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Deploy**: Vercel

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.local.example .env.local

# 3. Setup database (ver SETUP.md)

# 4. Run
npm run dev
```

Acesse http://localhost:3000

**Demo Login:**
- Email: `admin@test.com`
- Senha: `password123`

## Documentação

Veja [SETUP.md](./SETUP.md) para instruções completas de instalação e troubleshooting.

## Estrutura de Pastas

```
app/
  ├── login/              # Página de login
  ├── dashboard/          # Dashboard admin
  ├── admin/              # Seção admin (produtos, categorias, etc)
  │   ├── products/
  │   ├── categories/
  │   ├── units/
  │   ├── usuarios/
  │   └── reports/
  ├── stock/              # Entrada/Saída de estoque
  │   ├── entrada/
  │   └── saida/
  ├── historico/          # Histórico de movimentações
  └── api/                # API routes

lib/
  ├── supabase/           # Clientes Supabase
  ├── auth.ts             # Auth utilities
  └── types.ts            # TypeScript types

components/
  ├── auth/               # Componentes de auth
  ├── layout/             # Navbar, Sidebar
  └── ...                 # Outros componentes

supabase/
  └── migrations/         # SQL scripts
```

## Próximos Passos

1. ✅ Estrutura base criada
2. ⏳ Implementar CRUD de produtos
3. ⏳ Implementar formulários de entrada/saída
4. ⏳ Dashboard com gráficos
5. ⏳ Gerenciamento de usuários
6. ⏳ Relatórios detalhados

## License

MIT

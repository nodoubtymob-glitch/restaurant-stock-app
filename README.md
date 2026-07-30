# 🔥 Brasaroots Control

App de controle de estoque e faturamento para bar e restaurante. PWA instalável, mobile-first.

## Funcionalidades

- **Login** por e-mail/senha (Supabase Auth), com papéis **Admin** e **Funcionário**
- **Produtos** com foto, categoria, unidade, preço de custo/venda, validade e estoque mínimo
- **Categorias** e **Unidades** editáveis pelo admin
- **Entrada e Saída** de estoque com histórico completo (quem, quando, quanto)
- **Dashboard**: faturamento bruto e líquido por período, gráfico de vendas e alertas de estoque baixo
- **Equipe**: admin cria/remove funcionários (só registram saída, **não veem preços nem faturamento**)
- **Segurança**: preços isolados em tabela própria com RLS — funcionários não acessam nem via API
- **PWA**: instalável no celular, ícone próprio, funciona como app

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · Vercel

## Rodar localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com suas chaves do Supabase
npm run dev
```

O schema do banco está em `supabase/migrations/001_init_schema.sql`.

## Papéis

| Recurso | Admin | Funcionário |
|--------|:-----:|:-----------:|
| Registrar saída | ✅ | ✅ |
| Registrar entrada | ✅ | — |
| Ver/editar produtos e preços | ✅ | — |
| Dashboard e faturamento | ✅ | — |
| Gerenciar equipe | ✅ | — |

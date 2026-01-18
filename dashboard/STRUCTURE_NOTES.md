# 📁 Estrutura de Pastas - Notas Importantes

## ⚠️ IMPORTANTE: React Router vs Next.js

Este projeto usa **React Router v6** com **Vite**, não Next.js.

### Route Groups (Next.js Only)

**Route Groups** (`(marketing)`, `(dashboard)`) são uma feature exclusiva do **Next.js App Router** (v13+).

**No React Router:**
- ❌ Route Groups não existem nativamente
- ✅ Usamos layouts condicionais via componentes
- ✅ Estrutura de pastas é apenas organização (não gera rotas automaticamente)

## 📁 Estrutura Atual (React Router)

```
src/
├── components/
│   ├── Layout.tsx              # Dashboard Layout (com Sidebar)
│   ├── MarketingLayout.tsx     # Marketing Layout (sem Sidebar)
│   └── DashboardLayout.tsx     # Wrapper (preparado para migração)
├── pages/
│   ├── Landing.tsx             # Marketing: Landing Page (usa MarketingLayout)
│   ├── Dashboard.tsx           # Dashboard: usa Layout internamente
│   ├── Clients.tsx             # Dashboard: usa Layout internamente
│   └── ...
└── App.tsx                     # Rotas definidas aqui (React Router)
```

## 🔄 Como Funciona Atualmente

### Marketing Routes (Públicas)
- **Rota**: `/` → `<MarketingLayout><Landing /></MarketingLayout>`
- **Layout**: Sem sidebar, header/footer públicos
- **Uso**: Landing page, marketing pages

### Dashboard Routes (Autenticadas)
- **Rotas**: `/admin/*`, `/tech/*`, `/master/*`
- **Layout**: Cada página usa `<Layout>` internamente (com sidebar)
- **Uso**: Aplicação SaaS completa

## 🎯 Se Quiser Migrar para Next.js (Futuro)

Para usar Route Groups reais, você precisaria:

1. **Instalar Next.js:**
   ```bash
   npm install next react react-dom
   ```

2. **Estrutura de Pastas Next.js:**
   ```
   src/app/
   ├── (marketing)/
   │   ├── layout.tsx           # MarketingLayout
   │   └── page.tsx             # Landing Page
   ├── (dashboard)/
   │   ├── layout.tsx           # DashboardLayout (com Sidebar)
   │   ├── dashboard/
   │   │   └── page.tsx
   │   ├── clients/
   │   │   └── page.tsx
   │   └── ...
   └── layout.tsx               # Root Layout (AuthProvider, etc.)
   ```

3. **Converter componentes:**
   - Mudar de Client Components para Server Components quando possível
   - Adaptar rotas de `/admin/*` para estrutura de pastas

## ✅ Status Atual

- ✅ Landing Page criada (`/`)
- ✅ MarketingLayout criado
- ✅ DashboardLayout criado (wrapper)
- ✅ Rotas funcionando com React Router
- ⚠️ Route Groups não aplicáveis (precisa Next.js)

## 📝 Nota Final

A estrutura atual funciona perfeitamente com React Router. Se você quiser Route Groups nativos, precisaria migrar para Next.js (grande refatoração). Por enquanto, mantemos React Router com layouts condicionais.

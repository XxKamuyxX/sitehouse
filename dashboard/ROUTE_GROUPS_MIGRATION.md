# 🏗️ Route Groups Migration Plan

## ⚠️ Situação Atual

Este projeto usa **React Router v6** com **Vite**, não Next.js. Route Groups são uma feature exclusiva do **Next.js App Router**.

## 📋 Abordagem Recomendada

Como não podemos usar Route Groups diretamente, criamos uma estrutura organizada que **simula** Route Groups e facilita futura migração para Next.js.

### Estrutura Atual (React Router)

```
src/
  ├── components/
  │   ├── Layout.tsx (Dashboard Layout - com Sidebar)
  │   └── MarketingLayout.tsx (Marketing Layout - sem Sidebar)
  ├── pages/
  │   ├── Landing.tsx (Marketing - usa MarketingLayout)
  │   ├── Dashboard.tsx (App - usa Layout internamente)
  │   ├── Clients.tsx (App - usa Layout internamente)
  │   └── ...
  └── App.tsx (Rotas definidas aqui)
```

### Estrutura Futura (Next.js - Se migrar)

```
src/app/
  ├── (marketing)/
  │   ├── layout.tsx (MarketingLayout)
  │   └── page.tsx (Landing Page)
  ├── (dashboard)/
  │   ├── layout.tsx (DashboardLayout - com Sidebar)
  │   ├── dashboard/
  │   │   └── page.tsx
  │   ├── clients/
  │   │   └── page.tsx
  │   └── ...
  └── layout.tsx (Root Layout - AuthProvider, etc.)
```

## ✅ Solução Implementada

1. **MarketingLayout criado** - Layout público sem sidebar
2. **Landing Page criada** - Página pública em `/`
3. **DashboardLayout criado** - Wrapper do Layout existente (para futura migração)

## 🔄 Próximos Passos (Opcional - Migração para Next.js)

Se você quiser migrar para Next.js no futuro para usar Route Groups nativamente:

1. **Instalar Next.js:**
   ```bash
   npm install next react react-dom
   ```

2. **Estrutura de pastas:**
   - Criar `src/app/(marketing)/` e `src/app/(dashboard)/`
   - Mover páginas para estrutura de pastas do Next.js
   - Converter componentes para Server Components quando possível

3. **Configuração:**
   - Criar `next.config.js`
   - Atualizar scripts no `package.json`
   - Adaptar API routes (já estão no formato Next.js!)

## 📝 Notas

- **A estrutura atual funciona perfeitamente** com React Router
- **Route Groups são um conceito Next.js** - não aplicável diretamente
- **A Landing Page já está configurada** para mostrar em `/`
- **Dashboard rotas continuam usando Layout** (como antes)

## 🎯 Resultado

- ✅ Landing Page pública em `/` (MarketingLayout)
- ✅ Dashboard rotas em `/admin/*` (Layout com Sidebar)
- ✅ Estrutura preparada para futura migração Next.js

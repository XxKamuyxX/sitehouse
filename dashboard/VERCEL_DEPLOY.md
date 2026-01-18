# 🚀 Vercel Deployment Configuration

## ✅ Configuração Atual

Este projeto usa **Vercel Auto-Detection** com configuração mínima para SPA routing.

### Arquivo `vercel.json`

- ✅ `vercel.json` - Configurado para SPAs (React Router)
  - Rewrites todas as rotas (exceto `/api/*` e arquivos estáticos) para `index.html`
  - Permite que o React Router funcione corretamente no Vercel

### Auto-Detection

O Vercel detecta automaticamente:
- **Framework**: Vite (detectado automaticamente)
- **Build Command**: `npm run build` (do `package.json`)
- **Output Directory**: `dist` (padrão do Vite)
- **Install Command**: `npm install` (padrão)

### API Routes

As API routes em `/api` são detectadas automaticamente pelo Vercel:
- `/api/stripe/create-checkout.ts`
- `/api/stripe/create-customer.ts`
- `/api/webhooks/stripe.ts`

**Runtime**: Vercel escolhe automaticamente a versão do Node.js (geralmente Node.js 18.x ou 20.x).

## 📋 Variáveis de Ambiente Necessárias

Configure no Vercel Dashboard > Settings > Environment Variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_COUPON_ID=...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_URL=https://your-domain.vercel.app
FIREBASE_SERVICE_ACCOUNT={...}
```

## 🔧 Se Precisar Configurar Manualmente

Se você precisar configurar runtime específico no futuro, crie `vercel.json` na raiz:

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.7"
    }
  }
}
```

**NOTA**: Evite especificar versões exatas de runtime. Deixe o Vercel escolher automaticamente.

## ✅ Status

- ✅ `vercel.json` configurado para SPA routing
- ✅ `package.json` sem `engines`
- ✅ Vercel auto-detection habilitado
- ✅ API routes funcionando
- ✅ React Router funcionando corretamente (sem erros 404)

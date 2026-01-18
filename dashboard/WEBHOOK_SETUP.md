# Stripe Webhook Setup Guide

Este guia explica como configurar o webhook do Stripe para automatizar assinaturas e comissões de afiliados.

## 📋 Pré-requisitos

1. Conta Stripe configurada
2. Product e Price criados no Stripe Dashboard
3. Variáveis de ambiente configuradas:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (será obtido após criar o webhook)

## 🚀 Configuração do Webhook no Stripe Dashboard

### 1. Criar o Webhook Endpoint

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Description**: "Subscription and Commission Webhook"
   - **Events to send**: Selecione:
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`

### 2. Obter o Webhook Secret

1. Após criar o endpoint, clique nele
2. Na seção **"Signing secret"**, clique em **"Reveal"**
3. Copie o secret (começa com `whsec_...`)
4. Adicione como variável de ambiente: `STRIPE_WEBHOOK_SECRET`

## 🔧 Implementação

### Opção 1: Vercel (Recomendado)

O arquivo `api/webhooks/stripe.ts` já está configurado para Vercel.

**Estrutura de arquivos:**
```
dashboard/
  api/
    webhooks/
      stripe.ts
```

**Variáveis de ambiente no Vercel:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (JSON stringificado do service account)

### Opção 2: Firebase Cloud Functions

1. Instale as dependências:
```bash
npm install stripe firebase-admin
```

2. Crie uma Cloud Function:
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2025-12-15.clover',
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Implementação similar ao arquivo stripe.ts
  // ...
});
```

3. Configure as secrets:
```bash
firebase functions:config:set stripe.secret_key="sk_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

### Opção 3: Express/Node.js Backend

1. Instale as dependências:
```bash
npm install stripe express firebase-admin
```

2. Crie o endpoint:
```typescript
// server/routes/webhooks.ts
import express from 'express';
import Stripe from 'stripe';
// ... importações do webhook handler

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // Implementação do handler
});

export default router;
```

## 📝 Eventos Processados

### `invoice.payment_succeeded`
- ✅ Atualiza `subscriptionStatus: 'active'` no documento do usuário
- ✅ Define `lastPaymentDate` e `isActive: true`
- ✅ Processa comissão de afiliado (se aplicável)
- ✅ Atualiza `lastPaymentDate` na empresa

### `invoice.payment_failed`
- ⚠️ Atualiza `subscriptionStatus: 'past_due'` no documento do usuário

### `customer.subscription.deleted`
- ❌ Atualiza `subscriptionStatus: 'canceled'` no documento do usuário

## 🔍 Verificação e Testes

### 1. Testar Localmente (Stripe CLI)

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# ou baixar de https://stripe.com/docs/stripe-cli

# Fazer login
stripe login

# Escutar eventos localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Em outro terminal, disparar evento de teste
stripe trigger invoice.payment_succeeded
```

### 2. Verificar Logs

- **Vercel**: Dashboard > Functions > Logs
- **Firebase**: Console > Functions > Logs
- **Custom**: Verificar logs do servidor

### 3. Verificar no Firestore

Após um evento de pagamento bem-sucedido, verifique:
- `users/{userId}`: `subscriptionStatus` deve ser `'active'`
- `companies/{companyId}`: `lastPaymentDate` deve estar atualizado
- `referral_ledger`: Nova entrada criada (se houver referrer)
- `companies/{referrerId}`: `wallet.pending` deve ter aumentado

## 🛠️ Troubleshooting

### Erro: "Webhook signature verification failed"
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de que o body está sendo passado como raw (não JSON parseado)

### Erro: "Company not found for customer"
- Verifique se `stripeCustomerId` foi salvo corretamente na criação da empresa
- Verifique se o customer ID no Stripe corresponde ao `stripeCustomerId` no Firestore

### Comissão não processada
- Verifique se `company.referredBy` existe
- Verifique logs para erros na função `processPaymentCommission`
- Verifique se o valor do pagamento está em BRL

### Status não atualizado
- Verifique permissões do Firestore (regras de segurança)
- Verifique se o usuário admin existe para a empresa
- Verifique logs para erros específicos

## 📚 Recursos

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## 🔐 Segurança

⚠️ **IMPORTANTE**: 
- Nunca exponha `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET` no frontend
- Sempre verifique a assinatura do webhook antes de processar eventos
- Use HTTPS para todos os endpoints de webhook
- Monitore logs para atividades suspeitas

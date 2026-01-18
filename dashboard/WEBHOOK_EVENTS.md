# Stripe Webhook Events - Documentação Completa

## 📋 Eventos Processados

### 1. `customer.subscription.created` ✅

**Quando dispara:** Imediatamente quando o usuário inicia o período de teste de 7 dias.

**Ações:**
- Encontra empresa por `subscription.metadata.companyId` ou `customer.email`
- Define `subscriptionStatus: 'trialing'` no documento do usuário
- Define `isActive: true` para **conceder acesso imediatamente**
- Salva `stripeCustomerId` na empresa se ainda não estiver salvo

**Código:**
```typescript
await db.collection('users').doc(userId).update({
  subscriptionStatus: 'trialing',
  isActive: true, // ← Acesso concedido imediatamente
  updatedAt: Timestamp.now(),
});
```

**Resultado:** Usuário tem acesso completo durante os 7 dias de teste, sem pagar nada.

---

### 2. `invoice.payment_succeeded` ✅

**Quando dispara:** 
- **Dia 8**: Primeiro pagamento após o término do trial
- **Mensalmente**: Todo mês após o primeiro pagamento

**Ações:**
- Encontra empresa pelo `stripeCustomerId` do invoice
- Define `subscriptionStatus: 'active'` no documento do usuário
- Define `lastPaymentDate: Timestamp.now()`
- Define `isActive: true`
- **Processa comissão de afiliado:**
  - Verifica se `company.referredBy` existe
  - Se sim, calcula comissão baseada no tier atual
  - Cria entrada no `referral_ledger` com status `'pending'`
  - Adiciona valor ao `wallet.pending` do referrer
  - Atualiza `referralStats` (totalEarnings, activeReferrals, currentTier)
- Atualiza `lastPaymentDate` na empresa

**Código:**
```typescript
// 1. Atualiza status da subscription
await db.collection('users').doc(userId).update({
  subscriptionStatus: 'active',
  lastPaymentDate: Timestamp.now(),
  isActive: true,
  updatedAt: Timestamp.now(),
});

// 2. Processa comissão de afiliado (se aplicável)
await processAffiliateCommission(companyId, amountPaid);
```

**Resultado:** 
- Subscription ativa e pagamento registrado
- Comissão de afiliado processada e adicionada à wallet do referrer

---

### 3. `customer.subscription.deleted` ✅

**Quando dispara:** Quando o usuário cancela a subscription ou ela é cancelada pelo Stripe.

**Ações:**
- Encontra empresa pelo `stripeCustomerId`
- Define `subscriptionStatus: 'canceled'` no documento do usuário
- Define `isActive: false` para **revogar acesso**

**Código:**
```typescript
await db.collection('users').doc(userId).update({
  subscriptionStatus: 'canceled',
  isActive: false, // ← Acesso revogado
  updatedAt: Timestamp.now(),
});
```

**Resultado:** Usuário não tem mais acesso ao sistema.

---

## 🔐 Segurança

### Verificação de Assinatura

O webhook **DEVE** consumir o raw body (não JSON parseado) para verificar a assinatura do Stripe:

```typescript
// CRÍTICO: bodyParser deve ser false no config
export const config = {
  api: {
    bodyParser: false, // ← Raw body necessário
  },
};

// Verificação de assinatura
const bodyBuffer = rawBody instanceof Buffer 
  ? rawBody 
  : typeof rawBody === 'string' 
  ? Buffer.from(rawBody, 'utf8')
  : Buffer.from(JSON.stringify(rawBody), 'utf8');

event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
```

**Por que isso é importante?**
- Stripe assina o raw body com a chave secreta
- Se o body for parseado como JSON antes da verificação, a assinatura não corresponderá
- Isso previne ataques onde alguém tenta enviar eventos falsos

---

## 📊 Fluxo Completo da Subscription

### Dia 0 (Assinatura)

1. Usuário clica em "Assinar - 7 dias grátis"
2. Frontend chama `/api/stripe/create-checkout`
3. Backend cria sessão de checkout no Stripe
4. Usuário é redirecionado para Stripe Checkout
5. Usuário insere método de pagamento (Cartão)
6. Stripe cria subscription com `trial_period_days: 7`

**Evento disparado:** `customer.subscription.created`
- Status: `trialing`
- Acesso: **CONCEDIDO** (`isActive: true`)

### Dias 1-7 (Período de Teste)

- Usuário tem acesso completo
- Nenhuma cobrança é feita
- Subscription permanece com status `trialing`

### Dia 8 (Primeiro Pagamento)

**Evento disparado:** `invoice.payment_succeeded`
- Amount: R$ 40,00 (ou R$ 34,00 se cupom aplicado)
- Status: `active`
- Acesso: **MANTIDO** (`isActive: true`)
- Comissão: Processada se houver referrer

### Mensal (Após o Primeiro Pagamento)

**Evento disparado:** `invoice.payment_succeeded` (repetido mensalmente)
- Amount: R$ 40,00 (sem desconto após o primeiro mês)
- Status: `active`
- Acesso: **MANTIDO**
- Comissão: **NÃO** processada (apenas no primeiro pagamento)

### Cancelamento

**Evento disparado:** `customer.subscription.deleted`
- Status: `canceled`
- Acesso: **REVOGADO** (`isActive: false`)

---

## 🧪 Testando

### Com Stripe CLI

```bash
# Escutar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Disparar evento de teste
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### Verificar Logs

No Vercel Dashboard > Functions > Logs, você verá:

```
Processing subscription created for company {companyId} (trial starts)
Updated user {userId} subscription status to trialing (access granted)
Successfully activated trial for company {companyId}

Processing payment for company {companyId}: 40.00 BRL
Updated user {userId} subscription status to active
Commission processed: 6.00 BRL for referrer {referrerId} (Tier: silver)
Successfully processed payment for company {companyId}

Updated user {userId} subscription status to canceled (access revoked)
```

---

## ⚠️ Observações Importantes

1. **Comissão apenas no primeiro pagamento:**
   - A comissão de afiliado é processada apenas quando `invoice.payment_succeeded` é disparado pela primeira vez (dia 8)
   - Pagamentos mensais subsequentes não geram novas comissões
   - Isso é intencional - o referrer ganha apenas uma vez por indicação

2. **Trial não gera comissão:**
   - Durante o trial (dias 1-7), nenhuma comissão é processada
   - Comissão só acontece quando o primeiro pagamento é bem-sucedido

3. **Status 'trialing' vs 'active':**
   - `trialing`: Subscription existe mas ainda não houve pagamento
   - `active`: Subscription existe e pagamento foi processado
   - Ambos concedem acesso (`isActive: true`)

4. **Acesso imediato:**
   - Quando `customer.subscription.created` é disparado, o acesso é concedido imediatamente
   - Não é necessário aguardar confirmação de pagamento
   - Isso permite que o usuário use o sistema durante o trial

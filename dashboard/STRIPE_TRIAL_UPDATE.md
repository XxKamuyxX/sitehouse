# Stripe Checkout - Período de Teste de 7 Dias

## 📋 Atualização Implementada

O checkout do Stripe foi atualizado para incluir um **período de teste gratuito de 7 dias** antes da primeira cobrança, mantendo o desconto de indicação.

## 🔧 Alterações Realizadas

### 1. Backend Checkout Session (`src/api/stripe-backend-example.ts`)

- Adicionado `trial_period_days: 7` no `subscription_data`
- O cupom de desconto (15% off) é aplicado ao primeiro invoice gerado **APÓS** o término do trial (dia 8)
- Comentários adicionados explicando o comportamento

```typescript
subscription_data: {
  trial_period_days: 7, // 7-day free trial before first charge
  metadata: {
    companyId,
  },
},
```

### 2. UI Updates

#### Página de Expiração (`Expired.tsx`)
- Banner destacando "🎁 7 dias grátis para testar"
- Texto explicativo sobre o período de teste
- Botão atualizado: "Assinar - 7 dias grátis"

#### Página de Configurações (`Settings.tsx`)
- Banner destacando "🎁 7 dias grátis para testar"
- Mensagem atualizada para indicar que o desconto se aplica após o trial
- Texto atualizado sobre métodos de pagamento (Card recomendado para trial)

### 3. Webhook Handler (`api/webhooks/stripe.ts`)

- Comentários atualizados explicando o comportamento do trial
- O webhook `invoice.payment_succeeded` será chamado quando o primeiro pagamento acontecer (dia 8)
- Processamento de comissão de afiliado acontece normalmente quando o pagamento é processado

## 📊 Fluxo Completo

1. **Dia 0 (Assinatura)**
   - Usuário clica em "Assinar - 7 dias grátis"
   - Stripe Checkout solicita método de pagamento (Cartão recomendado)
   - Subscription é criada imediatamente com status `active` (trial)
   - Nenhuma cobrança é feita

2. **Dias 1-7 (Período de Teste)**
   - Usuário tem acesso completo ao sistema
   - Nenhuma cobrança é feita
   - Stripe mantém o método de pagamento salvo

3. **Dia 8 (Fim do Trial - Primeiro Pagamento)**
   - Stripe gera automaticamente o primeiro invoice
   - Se cupom de desconto (referral) estiver ativo:
     - Aplica 15% de desconto no invoice
     - Valor cobrado: R$ 40,00 - 15% = R$ 34,00
   - Se não houver cupom:
     - Valor cobrado: R$ 40,00
   - Evento `invoice.payment_succeeded` é disparado
   - Webhook processa:
     - Atualiza `subscriptionStatus: 'active'`
     - Define `lastPaymentDate`
     - Processa comissão de afiliado (se aplicável)

4. **Mensal (Após o Primeiro Pagamento)**
   - Stripe cobra automaticamente todo mês
   - Sem desconto (apenas no primeiro pagamento após trial)
   - Webhook processa cada pagamento normalmente

## 🎯 Comportamento do Cupom

- **Cupom de Indicação (15% off)**
  - Aplicado apenas no **primeiro invoice gerado após o trial** (dia 8)
  - Não se aplica aos pagamentos mensais subsequentes
  - Ocupa apenas 1 uso do cupom

## 💳 Métodos de Pagamento

- **Cartão (Recomendado para Trial)**
  - Melhor experiência: cobrança automática após trial sem intervenção
  - Sem necessidade de enviar código PIX manualmente

- **PIX**
  - Funciona, mas após o trial, o Stripe gerará um código PIX para pagamento
  - Requer que o usuário pague manualmente o código gerado
  - Pode causar atraso ou esquecimento

- **Boleto**
  - Similar ao PIX - requer pagamento manual após o trial

## ⚙️ Configuração Necessária no Stripe Dashboard

1. **Product e Price**
   - Product: "Mensalidade Gestor"
   - Price: R$ 40,00/mês (recurring)

2. **Coupon (Opcional - para indicações)**
   - ID: `FIRST_MONTH_15` (ou o ID que você configurou)
   - Percent off: 15%
   - Duration: Once (apenas uma vez)
   - Redeemable by: Specific customers (quando aplicado via código de indicação)

3. **Webhook Endpoint**
   - URL: `https://seu-dominio.com/api/webhooks/stripe`
   - Events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

## 🧪 Testando

### Teste Local com Stripe CLI

```bash
# Escutar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Disparar evento de teste (simula pagamento após trial)
stripe trigger invoice.payment_succeeded
```

### Teste no Stripe Dashboard (Test Mode)

1. Use cartões de teste:
   - Sucesso: `4242 4242 4242 4242`
   - Falha: `4000 0000 0000 0002`
   
2. Crie uma subscription com trial
3. Avance o trial manualmente no Stripe Dashboard (ou aguarde 7 dias)
4. Verifique se o invoice foi gerado corretamente
5. Verifique se o webhook foi chamado
6. Verifique no Firestore se os dados foram atualizados

## 📝 Notas Importantes

- **Trial não afeta comissão de afiliado**: A comissão é calculada quando o pagamento é processado (dia 8), não durante o trial
- **Status da subscription**: Stripe cria a subscription como `active` imediatamente, mas o primeiro invoice só é gerado após o trial
- **Cancelamento durante trial**: Se o usuário cancelar durante o trial, nenhuma cobrança será feita
- **Cupom + Trial**: O cupom é aplicado no primeiro invoice após o trial, não durante o trial (trial é grátis)

## 🔍 Verificação no Firestore

Após o primeiro pagamento (dia 8), verifique:

- `users/{userId}`:
  - `subscriptionStatus: 'active'`
  - `lastPaymentDate: Timestamp`
  - `isActive: true`

- `companies/{companyId}`:
  - `lastPaymentDate: Timestamp`

- `referral_ledger`: (se aplicável)
  - Nova entrada criada
  - `status: 'pending'`
  - `releaseDate: Timestamp (now + 30 days)`

- `companies/{referrerId}`: (se aplicável)
  - `wallet.pending`: Aumentado com valor da comissão
  - `referralStats.totalEarnings`: Aumentado
  - `referralStats.activeReferrals`: Incrementado

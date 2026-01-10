# 🔐 Configuração Stripe - Guia de Setup

## ⚠️ IMPORTANTE: Segurança

**NUNCA** commite chaves secretas do Stripe no repositório. Sempre use variáveis de ambiente.

## 📋 Variáveis de Ambiente Necessárias

### 1. No Vercel Dashboard

Acesse Vercel Dashboard > Settings > Environment Variables e adicione:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
STRIPE_COUPON_ID=YOUR_COUPON_ID_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_URL=https://your-domain.vercel.app
```

### 2. Localmente (`.env.local`)

Crie `.env.local` na raiz do projeto `dashboard/` (este arquivo NÃO será commitado):

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
STRIPE_COUPON_ID=YOUR_COUPON_ID_HERE
NEXT_PUBLIC_URL=http://localhost:5173
```

⚠️ **NOTA**: Substitua os placeholders pelas suas credenciais reais do Stripe Dashboard.

## 🔑 Onde Encontrar as Credenciais

### Stripe Dashboard

1. **API Keys**: [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
   - Copie a **Publishable key** (começa com `pk_test_...`)
   - Copie a **Secret key** (começa com `sk_test_...`)

2. **Products & Prices**: [dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
   - Crie um Product (ex: "Mensalidade Gestor - R$ 40,00/mês")
   - Crie um Price para esse Product
   - Copie o **Price ID** (começa com `price_...`)

3. **Coupons**: [dashboard.stripe.com/test/coupons](https://dashboard.stripe.com/test/coupons)
   - Crie um Coupon de 15% off
   - Copie o **Coupon ID**

4. **Webhooks**: [dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
   - Crie um endpoint apontando para: `https://seu-dominio.vercel.app/api/webhooks/stripe`
   - Copie o **Signing secret** (começa com `whsec_...`)

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Webhook endpoint configurado no Stripe Dashboard
- [ ] Webhook secret adicionado às variáveis de ambiente
- [ ] Product e Price criados no Stripe Dashboard
- [ ] Coupon de 15% off criado (opcional)
- [ ] Testado checkout em modo test
- [ ] Verificado logs de webhook
- [ ] Pronto para produção (trocar para chaves de produção)

## 🚨 Boas Práticas de Segurança

1. ✅ **Sempre use variáveis de ambiente** para chaves secretas
2. ✅ **Nunca commite** `.env.local` ou arquivos com chaves hardcoded
3. ✅ **Use diferentes chaves** para test e production
4. ✅ **Rotacione chaves** regularmente
5. ✅ **Revise commits** antes de fazer push

# 🔐 Firestore Security Rules - Field-Level Protection

## ⚠️ IMPORTANTE: Segurança de Campos Sensíveis

As regras do Firestore foram atualizadas para implementar **segurança em nível de campo**, impedindo que usuários alterem dados sensíveis através do client SDK.

## 🛡️ Campos Protegidos

### 1. **Companies Collection** - Campos Bloqueados

Usuários **NÃO podem alterar** os seguintes campos diretamente (apenas Admin SDK/Backend):

- `wallet` - Saldo do usuário (pending, available, totalPaid)
- `subscriptionStatus` - Status da subscription (se armazenado aqui)
- `stripeCustomerId` - ID do customer no Stripe
- `affiliateCode` - Código único de afiliado
- `referralStats` - Estatísticas de indicações (counts, earnings, tier)
- `firstMonthDiscount` - Flag de desconto do primeiro mês
- `discountExpirationDate` - Data de expiração do desconto
- `referredBy` - ID da empresa que indicou este usuário
- `lastPaymentDate` - Data do último pagamento

**Resultado**: Apenas o backend (webhook do Stripe, Admin SDK) pode modificar esses campos.

### 2. **Users Collection** - Campos Bloqueados

Usuários **NÃO podem alterar** os seguintes campos:

- `subscriptionStatus` - Status da subscription (trialing, active, canceled, past_due)
- `isActive` - Flag de acesso ativo/inativo
- `role` - Função do usuário (admin, tech, master)
- `companyId` - ID da empresa associada

**Resultado**: Apenas o backend (webhook do Stripe, Admin SDK) pode modificar `subscriptionStatus` e `isActive`.

### 3. **Referral Ledger Collection** - Bloqueio Total de Escrita

Usuários **NÃO podem criar, atualizar ou deletar** entradas no ledger.

- `read`: Apenas leitura própria (onde `referrerId == companyId`)
- `write`: **BLOQUEADO** (apenas Admin SDK via backend)

**Resultado**: Apenas o backend (funções de processamento de comissão) pode criar/atualizar entradas no ledger.

### 4. **Payout Requests Collection** - Bloqueio de Atualização

Usuários **podem criar** suas próprias solicitações de saque, mas **NÃO podem atualizar**.

- `create`: Permitido (usuário pode solicitar saque)
- `update`: **BLOQUEADO** para usuários (apenas Master/Admin SDK)

**Resultado**: Apenas o Master Admin pode marcar solicitações como pagas ou rejeitadas.

## 🔧 Como Funciona

### Verificação de Campos Alterados

As regras usam `diff().affectedKeys()` para verificar quais campos foram alterados:

```javascript
!request.resource.data.diff(resource.data).affectedKeys().hasAny([
  'wallet',
  'subscriptionStatus',
  'stripeCustomerId',
  // ... outros campos sensíveis
])
```

**Lógica**: Se **qualquer** dos campos sensíveis foi alterado, a operação é **BLOQUEADA**.

### Exceções

#### Master Admin
- O Master Admin pode atualizar **qualquer** campo, incluindo os sensíveis
- Isso permite operações administrativas necessárias

#### Backend (Admin SDK)
- O Admin SDK **ignora** as regras do Firestore
- Webhooks e funções backend podem atualizar campos sensíveis normalmente
- Isso é **intencional** - apenas código do servidor pode modificar dados financeiros

## 📋 Exemplos de Bloqueios

### ❌ Bloqueado (via Client SDK)

```javascript
// ❌ NÃO FUNCIONA - Usuário tentando aumentar seu saldo
await updateDoc(doc(db, 'companies', companyId), {
  wallet: {
    available: 999999,  // ← BLOQUEADO
    pending: 0,
    totalPaid: 0
  }
});

// ❌ NÃO FUNCIONA - Usuário tentando se tornar "ativo"
await updateDoc(doc(db, 'users', userId), {
  subscriptionStatus: 'active',  // ← BLOQUEADO
  isActive: true
});

// ❌ NÃO FUNCIONA - Usuário tentando criar comissão fake
await addDoc(collection(db, 'referral_ledger'), {
  referrerId: companyId,
  amount: 1000,  // ← BLOQUEADO (create não permitido)
  status: 'pending'
});
```

### ✅ Permitido (via Client SDK)

```javascript
// ✅ FUNCIONA - Atualizar informações básicas da empresa
await updateDoc(doc(db, 'companies', companyId), {
  name: 'Novo Nome',
  address: 'Nova Endereço',
  phone: '11999999999'
});

// ✅ FUNCIONA - Criar solicitação de saque
await addDoc(collection(db, 'payout_requests'), {
  companyId: companyId,
  amount: 100,
  pixKey: 'chave@pix',
  status: 'pending'  // ← Obrigatório
});

// ✅ FUNCIONA - Atualizar próprio perfil (campos não sensíveis)
await updateDoc(doc(db, 'users', userId), {
  name: 'Novo Nome',
  email: 'novo@email.com'
});
```

### ✅ Funciona (via Admin SDK / Backend)

```javascript
// ✅ FUNCIONA - Webhook atualizando status de subscription
await db.collection('users').doc(userId).update({
  subscriptionStatus: 'active',  // ← Admin SDK ignora regras
  isActive: true,
  lastPaymentDate: Timestamp.now()
});

// ✅ FUNCIONA - Processar comissão de afiliado
await db.collection('companies').doc(referrerId).update({
  'wallet.pending': newPending,  // ← Admin SDK ignora regras
  'referralStats.totalEarnings': newTotalEarnings,
  'referralStats.activeReferrals': newActiveReferrals
});

// ✅ FUNCIONA - Criar entrada no ledger
await db.collection('referral_ledger').add({
  referrerId: referrerId,
  amount: commissionAmount,  // ← Admin SDK ignora regras
  status: 'pending',
  releaseDate: releaseDate
});
```

## 🧪 Testando as Regras

### 1. Teste de Bloqueio de Campo Sensível

```javascript
// No console do navegador (Client SDK)
try {
  await updateDoc(doc(db, 'companies', 'YOUR_COMPANY_ID'), {
    wallet: { available: 999999 }
  });
  console.error('❌ ERRO: Campo deveria ser bloqueado!');
} catch (error) {
  if (error.code === 'permission-denied') {
    console.log('✅ SUCESSO: Campo bloqueado corretamente');
  } else {
    console.error('❌ ERRO INESPERADO:', error);
  }
}
```

### 2. Teste de Atualização Permitida

```javascript
// No console do navegador (Client SDK)
try {
  await updateDoc(doc(db, 'companies', 'YOUR_COMPANY_ID'), {
    name: 'Novo Nome',
    address: 'Novo Endereço'
  });
  console.log('✅ SUCESSO: Campos não sensíveis atualizados');
} catch (error) {
  console.error('❌ ERRO:', error);
}
```

## 📚 Referências

- [Firestore Security Rules - Field-level Security](https://firebase.google.com/docs/firestore/security/rules-conditions#field-level_security)
- [diff() and affectedKeys()](https://firebase.google.com/docs/reference/rules/rules.firestore.Resource#methods)
- [Admin SDK Bypasses Rules](https://firebase.google.com/docs/reference/admin/node/admin.firestore.Firestore)

## 🔒 Boas Práticas

1. ✅ **Nunca confie no Client SDK** para dados sensíveis
2. ✅ **Use Admin SDK** para todas as operações financeiras
3. ✅ **Valide no Backend** mesmo que as regras bloqueiem
4. ✅ **Monitore logs** para tentativas de acesso negado
5. ✅ **Teste as regras** regularmente

## ⚠️ Notas Importantes

- As regras bloqueiam **apenas operações via Client SDK**
- **Admin SDK** (usado no backend) **ignora** todas as regras
- Isso é **intencional** - permite que webhooks e funções backend funcionem normalmente
- Master Admin ainda pode atualizar campos sensíveis via Client SDK (necessário para operações administrativas)

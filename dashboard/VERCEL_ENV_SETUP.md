# 🔐 Vercel Environment Variables Setup

## ⚠️ IMPORTANTE: Adicionar FIREBASE_SERVICE_ACCOUNT Manualmente

A variável `FIREBASE_SERVICE_ACCOUNT` precisa ser adicionada manualmente no Vercel Dashboard devido ao tamanho e formato do JSON.

### 📋 Como Adicionar:

1. Acesse: https://vercel.com/[seu-usuario]/dashboard/settings
2. Vá em: **Settings** → **Environment Variables**
3. Clique em **Add New**
4. **Name:** `FIREBASE_SERVICE_ACCOUNT`
5. **Value:** Cole o JSON completo do Firebase Service Account (obtenha no Firebase Console → Project Settings → Service Accounts)
   
   **⚠️ IMPORTANTE:** O JSON deve ser uma string única (toda em uma linha), mantendo os `\n` no `private_key` (não converter para quebras de linha reais).
6. Selecione **Production**, **Preview** e **Development**
7. Clique em **Save**

### 🔗 Links Úteis:
- Vercel Dashboard: https://vercel.com/dashboard
- Environment Variables: https://vercel.com/[seu-usuario]/dashboard/settings/environment-variables

### ⚠️ NOTA:
- A variável deve ser uma **string JSON válida** (toda em uma linha)
- Mantenha os `\n` no `private_key` (não converter para quebras de linha reais)
- Esta variável é usada pelas API routes (webhooks) que precisam de privilégios de admin do Firebase

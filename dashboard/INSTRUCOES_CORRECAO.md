# 🔧 INSTRUÇÕES PARA CORRIGIR ERROS DE PERMISSÃO

## ⚠️ PROBLEMA IDENTIFICADO

Os erros "Missing or insufficient permissions" estão ocorrendo porque:
1. As regras do Firestore estão muito restritivas
2. A função `getUserCompanyId()` pode estar retornando `null` quando o documento do usuário não tem `companyId`
3. Queries de lista precisam que as regras `allow read` sejam mais permissivas para filtros

## 📋 SOLUÇÃO - PASSO A PASSO

### **PASSO 1: VERIFICAR O DOCUMENTO DO USUÁRIO**

1. Acesse o **Firebase Console**: https://console.firebase.google.com
2. Vá em **Firestore Database** → **Data**
3. Procure pela collection `users`
4. Encontre o documento do seu usuário (use o `uid` do Firebase Auth)
5. **VERIFIQUE** se o campo `companyId` existe e tem um valor (não pode ser `null` ou vazio)

**Se o `companyId` não existir ou estiver vazio:**
- Você precisa criar/atualizar o documento do usuário com um `companyId` válido
- O `companyId` deve corresponder ao ID de um documento na collection `companies`

### **PASSO 2: ATUALIZAR AS REGRAS DO FIRESTORE**

1. No **Firebase Console**, vá em **Firestore Database** → **Rules**
2. **COPIE TODO O CONTEÚDO** do arquivo `dashboard/FIREBASE_RULES.txt`
3. **COLE no editor de regras** (substitua tudo que está lá)
4. Clique em **"Publicar"** para aplicar as novas regras

### **PASSO 3: VERIFICAR SE O `companyId` ESTÁ SENDO CARREGADO**

1. Abra o **Console do navegador** (F12 → Console)
2. Faça login no sistema
3. Procure por mensagens de log que começam com "User metadata loaded:"
4. **VERIFIQUE** se o `companyId` está sendo exibido corretamente

**Se o `companyId` aparecer como `null` ou `undefined`:**
- O documento do usuário não tem `companyId` configurado
- Você precisa atualizar o documento do usuário manualmente no Firebase Console

### **PASSO 4: ATUALIZAR DOCUMENTO DO USUÁRIO (SE NECESSÁRIO)**

Se o seu usuário não tem `companyId`, você precisa:

1. No **Firebase Console** → **Firestore Database** → **Data**
2. Vá para `users/{seu-userId}`
3. Clique em **"Editar documento"**
4. Adicione/atualize o campo `companyId` com o ID da sua empresa
5. Se você não sabe qual é o `companyId`, procure na collection `companies`
6. Salve o documento

### **PASSO 5: TESTAR**

1. Recarregue a página da aplicação (F5)
2. Tente acessar a página de Clientes
3. Verifique se os erros desapareceram

## 🔍 DEBUG ADICIONAL

Se os erros persistirem após seguir todos os passos:

1. **Abra o Console do navegador** (F12 → Console)
2. **Procure por erros** relacionados a Firestore
3. **Verifique** se há mensagens específicas sobre permissões
4. **Compare** o `companyId` no console com o `companyId` no documento do usuário

## 📝 NOTAS IMPORTANTES

- As regras do Firestore **não suportam** `allow list` como permissão separada
- Queries de lista (`getDocs`) são verificadas pelas regras `allow read`
- O filtro `where('companyId', '==', companyId)` na query deve corresponder à verificação `resource.data.companyId == getUserCompanyId()` na regra

## ✅ CHECKLIST FINAL

- [ ] Documento do usuário tem `companyId` preenchido
- [ ] Regras do Firestore foram atualizadas
- [ ] Regras foram publicadas no Firebase Console
- [ ] Console do navegador não mostra mais erros de permissão
- [ ] Página de Clientes carrega corretamente
- [ ] Página de Configurações carrega corretamente

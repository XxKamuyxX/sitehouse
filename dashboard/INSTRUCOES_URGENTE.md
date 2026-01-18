# 🚨 INSTRUÇÕES URGENTES - CORREÇÃO DE PERMISSÕES

## ⚠️ PROBLEMA

Os erros "Missing or insufficient permissions" estão ocorrendo porque o documento do usuário no Firestore pode não ter o campo `companyId` preenchido, ou as regras do Firestore estão muito restritivas.

## ✅ SOLUÇÃO - FAÇA NESTA ORDEM

### **1. ATUALIZE AS REGRAS DO FIRESTORE (OBRIGATÓRIO)**

1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Rules** (no menu lateral)
4. **COPIE TODO O CONTEÚDO** do arquivo `FIREBASE_RULES.txt` nesta pasta
5. **COLE no editor de regras** (substitua TUDO)
6. Clique em **"Publicar"** (botão azul no topo)

### **2. VERIFIQUE O DOCUMENTO DO USUÁRIO (CRÍTICO)**

1. No Firebase Console, vá em **Firestore Database** → **Data**
2. Procure pela collection `users`
3. Encontre o documento do seu usuário (o ID é o mesmo do Firebase Auth)
4. **VERIFIQUE se o campo `companyId` existe e tem um valor válido**

**Se `companyId` estiver faltando ou vazio:**

1. Procure na collection `companies` para encontrar o ID da sua empresa
2. Volte para o documento do usuário
3. Clique em **"Editar documento"**
4. Adicione/atualize o campo:
   - **Campo:** `companyId`
   - **Tipo:** string
   - **Valor:** (o ID da sua empresa, ex: "minha-empresa-abc123")
5. Salve o documento

### **3. TESTE A APLICAÇÃO**

1. Recarregue a página da aplicação (F5)
2. Abra o Console do navegador (F12 → Console)
3. Faça login novamente
4. Verifique se os erros desapareceram
5. Tente acessar a página de Clientes

## 🔍 VERIFICAÇÃO DE LOGS

Após fazer login, verifique no Console do navegador:

- **Procure por:** `User metadata loaded:`
- **Verifique se:** O `companyId` aparece corretamente (não `null` ou `undefined`)

**Se aparecer `null` ou `undefined`:** O documento do usuário não tem `companyId` configurado → Volte ao Passo 2

## 📋 REGRAS ATUALIZADAS

As novas regras incluem:
- ✅ Função `hasCompanyId()` melhorada para validação segura
- ✅ Função `getUserCompanyId()` simplificada e mais robusta
- ✅ Remoção de regras `allow list` que não existem no Firestore
- ✅ Queries de lista são verificadas pelas regras `allow read` (padrão do Firestore)

## ⚡ SOLUÇÃO RÁPIDA (SE O PROBLEMA PERSISTIR)

Se após seguir todos os passos ainda houver erros:

1. **Abra o Console do navegador** (F12)
2. **Verifique** se há mensagens específicas de erro
3. **Copie a mensagem de erro completa** e me envie
4. **Verifique** se o `companyId` no documento do usuário corresponde ao ID de um documento existente na collection `companies`

## ✅ CHECKLIST

- [ ] Regras do Firestore atualizadas e publicadas
- [ ] Documento do usuário tem `companyId` preenchido
- [ ] `companyId` corresponde a um documento existente em `companies`
- [ ] Console do navegador mostra `companyId` carregado corretamente
- [ ] Erros de permissão desapareceram

## 🆘 SE NADA FUNCIONAR

Se mesmo após seguir todos os passos o problema persistir:

1. **Faça logout** e **login novamente** na aplicação
2. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
3. **Verifique** se o documento do usuário realmente tem `companyId`
4. **Verifique** se existe um documento na collection `companies` com o mesmo ID

---

**ARQUIVOS IMPORTANTES:**
- `FIREBASE_RULES.txt` - Regras atualizadas (copiar para Firebase Console)
- `INSTRUCOES_CORRECAO.md` - Instruções detalhadas completas

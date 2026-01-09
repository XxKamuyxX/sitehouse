# 🚨 INSTRUÇÕES URGENTES - ATUALIZAR REGRAS DO FIRESTORE

## ⚠️ PROBLEMAS CORRIGIDOS

1. **Master Admin** agora pode listar todos os usuários/proprietários
2. **Clientes Públicos** podem aprovar Work Orders sem fazer login

## 📋 COMO APLICAR AS REGRAS

### Passo 1: Acessar Firebase Console
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto

### Passo 2: Ir para Firestore Rules
1. No menu lateral, clique em **"Firestore Database"**
2. Clique na aba **"Rules"** (no topo)

### Passo 3: Copiar e Colar as Novas Regras
1. Abra o arquivo `dashboard/FIREBASE_RULES.txt` neste projeto
2. **Copie TODO o conteúdo** do arquivo (Ctrl+A, Ctrl+C)
3. No Firebase Console, **cole as regras** no editor (substitua tudo que está lá)
4. Clique em **"Publicar"** (botão no topo direito)

### Passo 4: Verificar
1. Aguarde alguns segundos para as regras serem aplicadas
2. Teste:
   - **Master Dashboard**: Deve carregar a lista de empresas sem erro
   - **Aprovação Pública**: Cliente deve conseguir aprovar OS sem login

## ✅ O QUE FOI CORRIGIDO

### 1. Master Admin - Acesso Total
- ✅ Master pode **ler** todos os usuários (para listar proprietários)
- ✅ Master pode **escrever** todos os usuários (para gerenciar)
- ✅ Master pode **ler** todas as empresas
- ✅ Master pode **atualizar** todas as empresas

### 2. Aprovação Pública de Work Orders
- ✅ Clientes podem **ler** Work Orders sem login (já funcionava)
- ✅ Clientes podem **atualizar** apenas campos de aprovação sem login:
  - `approved`
  - `rejected`
  - `approvedAt`
  - `rejectedAt`
  - `updatedAt`
- ✅ Outros campos continuam protegidos (apenas usuários autenticados)

## 🔒 SEGURANÇA MANTIDA

- ✅ Todas as outras regras de segurança foram mantidas
- ✅ Usuários regulares só acessam dados da própria empresa
- ✅ Apenas campos específicos podem ser atualizados publicamente
- ✅ Master tem acesso total apenas para gerenciamento

## ⚡ IMPORTANTE

**APLIQUE AS REGRAS IMEDIATAMENTE** para resolver os problemas de permissão!

Se você não aplicar as regras no Firebase Console, os erros continuarão acontecendo.

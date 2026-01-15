# 🔐 Security Setup Guide

Este documento contém as instruções para configurar as proteções de segurança do sistema.

## ✅ Configurações Implementadas Automaticamente

### 1. Firestore Security Rules
- **Arquivo:** `dashboard/firestore.rules`
- **Status:** ✅ Criado
- **Ação Necessária:** 
  1. Acesse o [Firebase Console](https://console.firebase.google.com/)
  2. Vá em **Firestore Database** → **Regras**
  3. Cole o conteúdo do arquivo `firestore.rules`
  4. Clique em **Publicar**

### 2. Email Domain Validation
- **Status:** ✅ Implementado
- **Bloqueia:** Emails temporários/descartáveis (yopmail.com, 10minutemail.com, etc.)
- **Localização:** `src/utils/security.ts`

### 3. Phone Verification (OTP)
- **Status:** ✅ Implementado
- **Componente:** `src/components/PhoneVerificationModal.tsx`
- **Funcionalidade:** Requer verificação de telefone via SMS antes de criar orçamentos/OS

### 4. Tax ID Registry (CNPJ/CPF Lock)
- **Status:** ✅ Implementado
- **Funcionalidade:** Impede que o mesmo CNPJ/CPF seja usado em múltiplas contas

---

## 🔧 Configurações Manuais (REQUERIDAS)

### 1. Firebase App Check (ANTI-BOT)

**Objetivo:** Impede que scripts/hackers chamem seu banco de dados fora do seu site.

#### Passo a Passo:

1. **Acesse o Firebase Console:**
   - https://console.firebase.google.com/
   - Selecione seu projeto

2. **Ative o App Check:**
   - Menu lateral → **Build** → **App Check**
   - Clique em **"Get Started"** ou **"Register"**

3. **Configure reCAPTCHA v3:**
   - Escolha **reCAPTCHA v3** como provedor
   - Siga as instruções para registrar seu domínio
   - Adicione seu domínio de produção (ex: `gestorvitreo.com.br`)
   - Adicione `localhost` para desenvolvimento

4. **Ative a Proteção:**
   - Marque as opções para proteger:
     - ✅ Firestore
     - ✅ Cloud Functions (se aplicável)
   - Clique em **"Enforce"**

**Resultado:** Apenas requisições do seu site oficial serão aceitas. Tentativas via Postman/scripts serão bloqueadas.

---

### 2. Domain Locking (Authorized Domains)

**Objetivo:** Impede que o sistema de login funcione em sites clonados.

#### Passo a Passo:

1. **Acesse Firebase Authentication:**
   - Firebase Console → **Authentication** → **Settings** → **Authorized domains**

2. **Limpe Domínios Não Autorizados:**
   - Delete todos os domínios que NÃO são seus
   - Mantenha apenas:
     - `localhost` (para desenvolvimento)
     - Seu domínio oficial (ex: `gestorvitreo.com.br`)

3. **Adicione Domínios de Produção:**
   - Clique em **"Add domain"**
   - Digite seu domínio oficial
   - Clique em **"Add"**

**Resultado:** Se alguém copiar seu site para outro domínio, o login falhará com erro "Domínio não autorizado".

---

### 3. Deploy das Firestore Rules

1. **Via Firebase CLI (Recomendado):**
   ```bash
   cd dashboard
   firebase deploy --only firestore:rules
   ```

2. **Via Console:**
   - Firebase Console → **Firestore Database** → **Regras**
   - Cole o conteúdo de `dashboard/firestore.rules`
   - Clique em **"Publicar"**

---

## 🛡️ Camadas de Segurança Implementadas

### Camada 1: Email Domain Filter
- ✅ Bloqueia emails descartáveis no cadastro
- ✅ Lista de 20+ domínios bloqueados

### Camada 2: Phone Verification
- ✅ OTP via SMS (Firebase Phone Auth)
- ✅ Verificação obrigatória antes de ações críticas
- ✅ `phone_registry` impede reuso de números

### Camada 3: Tax ID Lock
- ✅ CNPJ/CPF único por conta
- ✅ Verificação no salvamento de dados da empresa
- ✅ `tax_id_registry` impede reuso de documentos

### Camada 4: Premium Gate
- ✅ Trial único de 7 dias
- ✅ Read-only mode após trial expirado
- ✅ Modal de paywall para ações bloqueadas

### Camada 5: Firestore Rules
- ✅ Isolamento multi-tenant (empresas)
- ✅ Proteção de dados por `companyId`
- ✅ Prevenção de edição manual de comissões (referrals)

---

## 🔒 Testes de Segurança

Após configurar, teste:

1. **Email Descartável:**
   - Tente cadastrar com `teste@yopmail.com`
   - ✅ Deve ser bloqueado

2. **Phone Verification:**
   - Crie uma conta nova
   - Tente criar um orçamento sem verificar telefone
   - ✅ Deve abrir modal de verificação

3. **Tax ID Duplicado:**
   - Use um CNPJ já cadastrado
   - ✅ Deve ser bloqueado

4. **App Check:**
   - Tente fazer uma requisição via Postman/curl
   - ✅ Deve retornar erro 403 (App Check failed)

5. **Domain Lock:**
   - Acesse o site de um domínio não autorizado
   - ✅ Login deve falhar

---

## 📝 Notas Importantes

- **Firebase Phone Auth:** Requer reCAPTCHA configurado (já incluído no modal)
- **Phone Registry:** Criado automaticamente após verificação bem-sucedida
- **Tax ID Registry:** Criado automaticamente ao salvar dados da empresa
- **Fail-Open Strategy:** Em caso de erro nas verificações, o sistema permite a ação (para não bloquear usuários legítimos por bugs)

---

## 🚨 Troubleshooting

### Phone OTP não envia
- Verifique se reCAPTCHA está configurado no Firebase
- Confirme que o número está no formato correto (Brasil: +55...)

### Tax ID bloqueado incorretamente
- Verifique no Firestore se o documento existe em `tax_id_registry`
- Se necessário, delete manualmente o documento para liberar

### App Check bloqueando requisições legítimas
- Verifique se o domínio está autorizado
- Confirme que reCAPTCHA v3 está ativo e funcionando

---

**Última atualização:** Janeiro 2026

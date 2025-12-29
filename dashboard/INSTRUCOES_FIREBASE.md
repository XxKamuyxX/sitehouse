# 🔥 Como Obter as Credenciais do Firebase

## Passo a Passo

### 1. Acesse o Firebase Console
- Vá para: https://console.firebase.google.com/
- Faça login com sua conta Google

### 2. Crie um Novo Projeto (ou use um existente)
- Clique em "Adicionar projeto" ou selecione um projeto existente
- Nome do projeto: `house-manutencao-dashboard` (ou outro nome de sua preferência)
- Aceite os termos e continue

### 3. Configure o Authentication
- No menu lateral, clique em **"Authentication"**
- Clique em **"Começar"**
- Vá para a aba **"Sign-in method"**
- Clique em **"Email/Password"**
- Ative a opção e clique em **"Salvar"**

### 4. Configure o Firestore Database
- No menu lateral, clique em **"Firestore Database"**
- Clique em **"Criar banco de dados"**
- Escolha o modo **"Produção"** ou **"Teste"** (para desenvolvimento, pode usar "Teste")
- Escolha a localização (ex: `southamerica-east1` para Brasil)
- Clique em **"Habilitar"**

### 5. Configure as Regras do Firestore
- Na aba **"Regras"**, cole o seguinte código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem acessar
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

- Clique em **"Publicar"**

### 6. Obtenha as Credenciais
- No menu lateral, clique no ícone de **⚙️ Configurações** (ao lado de "Visão geral do projeto")
- Role até a seção **"Seus apps"**
- Clique no ícone **`</>`** (Web) para adicionar um app web
- Dê um nome (ex: "Dashboard Web")
- **NÃO** marque a opção "Também configurar o Firebase Hosting"
- Clique em **"Registrar app"**
- Você verá um objeto JavaScript com as credenciais, algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "house-manutencao.firebaseapp.com",
  projectId: "house-manutencao",
  storageBucket: "house-manutencao.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

### 7. Atualize o arquivo .env
- Abra o arquivo `dashboard/.env`
- Substitua os valores de exemplo pelos valores reais do seu Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy... (valor do apiKey)
VITE_FIREBASE_AUTH_DOMAIN=house-manutencao.firebaseapp.com (valor do authDomain)
VITE_FIREBASE_PROJECT_ID=house-manutencao (valor do projectId)
VITE_FIREBASE_STORAGE_BUCKET=house-manutencao.appspot.com (valor do storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012 (valor do messagingSenderId)
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef... (valor do appId)
```

### 8. Crie o Primeiro Usuário
- No Firebase Console, vá em **Authentication** → **Users**
- Clique em **"Adicionar usuário"**
- Digite um email e senha
- Clique em **"Adicionar usuário"**
- Use essas credenciais para fazer login no dashboard

## ✅ Pronto!

Agora você pode:
1. Reiniciar o servidor de desenvolvimento (`npm run dev`)
2. Acessar `http://localhost:5173`
3. Fazer login com o usuário criado
4. Começar a usar o dashboard!

## 🔒 Segurança

⚠️ **IMPORTANTE:** O arquivo `.env` está no `.gitignore` e não será commitado. 
Nunca compartilhe suas credenciais do Firebase publicamente!




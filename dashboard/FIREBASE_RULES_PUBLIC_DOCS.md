# Firebase Security Rules - Public Document Access

## ⚠️ IMPORTANTE: Atualizar Regras do Firestore

Para que as páginas públicas de documentos funcionem corretamente, você precisa atualizar as regras de segurança do Firestore.

### Regras Necessárias

Acesse o Firebase Console → Firestore Database → Rules e adicione as seguintes regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para usuários autenticados (dashboard)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Regra específica para quotes - permitir leitura pública
    match /quotes/{quoteId} {
      // Permitir leitura pública (para visualizar o orçamento)
      allow read: if true;
      
      // Permitir atualização apenas do campo 'status' e 'updatedAt' para usuários não autenticados
      allow update: if request.resource.data.diff(resource.data).unchangedKeys()
        .hasAll(['clientId', 'clientName', 'items', 'subtotal', 'discount', 'total', 'warranty', 'observations', 'diagnosis', 'createdAt'])
        && request.resource.data.status in ['approved', 'rejected']
        && request.resource.data.updatedAt is timestamp;
      
      // Usuários autenticados podem fazer tudo
      allow read, write: if request.auth != null;
    }
    
    // Regra específica para workOrders - permitir leitura pública
    match /workOrders/{osId} {
      // Permitir leitura pública (para visualizar a OS)
      allow read: if true;
      
      // Usuários autenticados podem fazer tudo
      allow read, write: if request.auth != null;
    }
    
    // Regra específica para receipts - permitir leitura pública
    match /receipts/{receiptId} {
      // Permitir leitura pública (para visualizar o recibo)
      allow read: if true;
      
      // Usuários autenticados podem fazer tudo
      allow read, write: if request.auth != null;
    }
    
    // Outras collections permanecem protegidas
    match /clients/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /expenses/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /settings/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Regras do Firebase Storage

Para permitir upload e leitura de imagens:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir leitura pública de imagens
    match /work-orders/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Outros caminhos requerem autenticação
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Explicação das Regras

1. **Leitura Pública**: Permite que qualquer pessoa leia documentos usando o ID. Isso é necessário para que clientes possam visualizar seus documentos sem login.

2. **Atualização Limitada (Quotes)**: Usuários não autenticados podem atualizar apenas:
   - Campo `status` (apenas para 'approved' ou 'rejected')
   - Campo `updatedAt` (timestamp)
   - Todos os outros campos devem permanecer inalterados

3. **Storage**: Permite leitura pública de imagens em `work-orders/`, mas apenas usuários autenticados podem fazer upload.

### Teste

Após atualizar as regras:
1. Acesse `/p/quote/{quoteId}` sem fazer login
2. Acesse `/p/os/{osId}` sem fazer login
3. Acesse `/p/receipt/{receiptId}` sem fazer login
4. Verifique se os documentos carregam corretamente
5. Teste os botões de WhatsApp
6. Teste o upload de imagens (requer login)




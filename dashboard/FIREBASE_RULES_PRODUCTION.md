# Firebase Rules - Produção (CORRIGIDAS)

## ⚠️ IMPORTANTE: Regras Corrigidas

As regras abaixo foram corrigidas para funcionar corretamente com operações de criação, atualização e exclusão.

**Problema anterior:** A regra `allow write` estava verificando `resource.data.companyId` em operações de criação, mas `resource` não existe durante a criação.

**Solução:** Separar as regras em `create`, `update` e `delete` para cada collection.

## 🔧 Regras de Produção (CORRIGIDAS)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user's companyId from user document
    function getUserCompanyId() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId;
    }
    
    // Clients - apenas usuários autenticados com companyId correspondente
    match /clients/{clientId} {
      allow read: if request.auth != null && 
                     resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
      allow update, delete: if request.auth != null && 
                               resource.data.companyId == getUserCompanyId() &&
                               request.resource.data.companyId == getUserCompanyId();
    }
    
    // Work Orders - leitura pública, escrita apenas com companyId correspondente
    match /workOrders/{workOrderId} {
      allow read: if true; // Público para visualização
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
      allow update: if (request.auth != null && 
                        resource.data.companyId == getUserCompanyId() &&
                        request.resource.data.companyId == getUserCompanyId()) ||
                      // Permitir update de aprovação para não autenticados
                      (request.resource.data.diff(resource.data).unchangedKeys()
                        .hasAll(['quoteId', 'clientName', 'scheduledDate', 'technician', 'status', 'checklist', 'notes', 'photos', 'technicalInspection', 'createdAt', 'companyId'])
                        && (request.resource.data.keys().hasOnly(['approved', 'rejected', 'approvedAt', 'rejectedAt', 'updatedAt', 'feedbackSubmitted', 'feedbackRating', 'feedbackDate'])
                            || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['approved', 'rejected', 'approvedAt', 'rejectedAt', 'updatedAt', 'feedbackSubmitted', 'feedbackRating', 'feedbackDate'])));
      allow delete: if request.auth != null && 
                       resource.data.companyId == getUserCompanyId();
    }
    
    // Expenses - apenas usuários autenticados com companyId correspondente
    match /expenses/{expenseId} {
      allow read: if request.auth != null && 
                     resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
      allow update, delete: if request.auth != null && 
                               resource.data.companyId == getUserCompanyId() &&
                               request.resource.data.companyId == getUserCompanyId();
    }
    
    // Quotes - leitura pública, escrita apenas com companyId correspondente
    match /quotes/{quoteId} {
      allow read: if true; // Público
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
      allow update: if (request.auth != null && 
                        resource.data.companyId == getUserCompanyId() &&
                        request.resource.data.companyId == getUserCompanyId()) ||
                      // Permitir update de status para não autenticados
                      (request.resource.data.diff(resource.data).unchangedKeys()
                        .hasAll(['clientId', 'clientName', 'items', 'subtotal', 'discount', 'total', 'warranty', 'observations', 'diagnosis', 'createdAt', 'companyId'])
                        && request.resource.data.status in ['approved', 'rejected']
                        && request.resource.data.updatedAt is timestamp);
      allow delete: if request.auth != null && 
                       resource.data.companyId == getUserCompanyId();
    }
    
    // Receipts - leitura pública, escrita apenas com companyId correspondente
    match /receipts/{receiptId} {
      allow read: if true; // Público
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
      allow update, delete: if request.auth != null && 
                               resource.data.companyId == getUserCompanyId() &&
                               request.resource.data.companyId == getUserCompanyId();
    }
    
    // Settings - acesso apenas autenticado (configurações globais)
    match /settings/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Companies - acesso apenas ao próprio companyId
    match /companies/{companyId} {
      allow read: if request.auth != null && 
                     resource.id == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.id == getUserCompanyId();
      allow update, delete: if request.auth != null && 
                               resource.id == getUserCompanyId() &&
                               request.resource.id == getUserCompanyId();
    }
    
    // Users - acesso apenas ao próprio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == userId;
    }
  }
}
```

## 📋 Como Aplicar

1. **Acesse o Firebase Console** → Firestore Database → Rules
2. **Copie as regras acima** e cole no editor de regras
3. **Publique as regras** (botão "Publish")
4. **Teste criando um novo cliente** no dashboard

## ✅ O que foi corrigido

- **Clients:** Separado `create`, `update` e `delete` (antes tinha `write` que falhava em create)
- **Work Orders:** Separado `create`, `update` e `delete`
- **Expenses:** Separado `create`, `update` e `delete`
- **Quotes:** Separado `create`, `update` e `delete`
- **Receipts:** Separado `create`, `update` e `delete`

Agora as operações de criação devem funcionar corretamente!

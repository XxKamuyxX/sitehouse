# Firebase Rules - Migração de Dados (TEMPORÁRIO)

## ⚠️ ATENÇÃO: Regras Temporárias para Migração

Para permitir que o script de migração funcione, você precisa **temporariamente** atualizar as regras do Firestore para permitir que usuários autenticados leiam documentos sem `companyId`.

### Regras Temporárias (APENAS PARA MIGRAÇÃO)

Acesse o Firebase Console → Firestore Database → Rules e use estas regras **TEMPORARIAMENTE**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user's companyId
    function getUserCompanyId() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId;
    }
    
    // Regras para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Regras específicas para collections que precisam de companyId
    match /clients/{clientId} {
      allow read: if request.auth != null && 
                     (resource.data.companyId == getUserCompanyId() || 
                      !resource.data.keys().hasAny(['companyId']));
      allow write: if request.auth != null && 
                      (request.resource.data.companyId == getUserCompanyId() || 
                       !request.resource.data.keys().hasAny(['companyId']));
    }
    
    match /workOrders/{workOrderId} {
      allow read: if request.auth != null && 
                     (resource.data.companyId == getUserCompanyId() || 
                      !resource.data.keys().hasAny(['companyId']));
      allow write: if request.auth != null && 
                      (request.resource.data.companyId == getUserCompanyId() || 
                       !request.resource.data.keys().hasAny(['companyId']));
    }
    
    match /expenses/{expenseId} {
      allow read: if request.auth != null && 
                     (resource.data.companyId == getUserCompanyId() || 
                      !resource.data.keys().hasAny(['companyId']));
      allow write: if request.auth != null && 
                      (request.resource.data.companyId == getUserCompanyId() || 
                       !request.resource.data.keys().hasAny(['companyId']));
    }
    
    match /quotes/{quoteId} {
      // Permitir leitura pública
      allow read: if true;
      allow write: if request.auth != null && 
                      (request.resource.data.companyId == getUserCompanyId() || 
                       !request.resource.data.keys().hasAny(['companyId']));
    }
    
    match /receipts/{receiptId} {
      // Permitir leitura pública
      allow read: if true;
      allow write: if request.auth != null && 
                      (request.resource.data.companyId == getUserCompanyId() || 
                       !request.resource.data.keys().hasAny(['companyId']));
    }
    
    // Settings - acesso apenas autenticado
    match /settings/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Companies - acesso apenas autenticado
    match /companies/{companyId} {
      allow read, write: if request.auth != null && 
                            (resource.id == getUserCompanyId() || 
                             request.resource.id == getUserCompanyId());
    }
  }
}
```

### Após a Migração

**IMPORTANTE:** Após executar a migração com sucesso, **REVERTA** para as regras de produção que exigem `companyId` em todos os documentos.

### Regras de Produção (APÓS MIGRAÇÃO)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function getUserCompanyId() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId;
    }
    
    // Regras gerais - usuários autenticados podem ler/escrever seus próprios dados
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
                            resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
    }
    
    match /workOrders/{workOrderId} {
      allow read: if true; // Público para visualização
      allow write: if request.auth != null && 
                      resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
    }
    
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
                            resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
    }
    
    match /quotes/{quoteId} {
      allow read: if true; // Público
      allow write: if request.auth != null && 
                      resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
      // Permitir update de status para não autenticados
      allow update: if request.resource.data.diff(resource.data).unchangedKeys()
        .hasAll(['clientId', 'clientName', 'items', 'subtotal', 'discount', 'total', 'warranty', 'observations', 'diagnosis', 'createdAt', 'companyId'])
        && request.resource.data.status in ['approved', 'rejected']
        && request.resource.data.updatedAt is timestamp;
    }
    
    match /receipts/{receiptId} {
      allow read: if true; // Público
      allow write: if request.auth != null && 
                      resource.data.companyId == getUserCompanyId();
      allow create: if request.auth != null && 
                       request.resource.data.companyId == getUserCompanyId();
    }
    
    match /settings/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /companies/{companyId} {
      allow read, write: if request.auth != null && 
                            resource.id == getUserCompanyId();
    }
  }
}
```

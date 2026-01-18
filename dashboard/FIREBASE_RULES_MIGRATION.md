# Firebase Rules - Migração de Dados

## ⚠️ PROBLEMA: Erros de Permissão na Migração

Se você está vendo erros "Missing or insufficient permissions" ao tentar executar a migração, isso significa que as regras do Firestore estão bloqueando a leitura de documentos sem `companyId`.

## 🔧 SOLUÇÃO: Atualizar Regras do Firestore

Você precisa atualizar as regras do Firestore para permitir que usuários autenticados leiam documentos sem `companyId` **temporariamente** durante a migração.

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

**⚠️ IMPORTANTE:** Use estas regras **APÓS** executar a migração com sucesso.

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
      allow update: if request.auth != null && 
                      (resource.data.companyId == getUserCompanyId() &&
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

## 📋 Passo a Passo para Migração

1. **Acesse o Firebase Console** → Firestore Database → Rules
2. **Copie as regras temporárias** acima e cole no editor de regras
3. **Publique as regras** (botão "Publish")
4. **Acesse o dashboard** → `/admin/settings`
5. **Role até "Migração de Dados"** e clique em "Migrar Dados Antigos"
6. **Aguarde a conclusão** da migração
7. **Volte ao Firebase Console** e **reverta para as regras de produção** acima
8. **Publique as regras de produção**

## ✅ Verificação

Após a migração, verifique no Firebase Console que todos os documentos nas coleções `clients`, `workOrders`, `expenses`, `quotes` e `receipts` possuem o campo `companyId` preenchido.

# Firebase Security Rules - Public Quote Access

## ⚠️ IMPORTANTE: Atualizar Regras do Firestore

Para que a página pública de orçamentos funcione corretamente, você precisa atualizar as regras de segurança do Firestore.

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
    
    // Regra específica para quotes - permitir leitura e atualização de status para usuários não autenticados
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
    
    // Outras collections permanecem protegidas
    match /clients/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /workOrders/{document=**} {
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

### Explicação das Regras

1. **Leitura Pública (`allow read: if true`)**: Permite que qualquer pessoa leia um documento de quote usando o ID. Isso é necessário para que clientes possam visualizar seus orçamentos sem login.

2. **Atualização Limitada**: Usuários não autenticados podem atualizar apenas:
   - Campo `status` (apenas para 'approved' ou 'rejected')
   - Campo `updatedAt` (timestamp)
   - Todos os outros campos devem permanecer inalterados

3. **Segurança**: A regra garante que:
   - Não é possível alterar valores, itens, ou outras informações críticas
   - Apenas o status pode ser alterado
   - Usuários autenticados (dashboard) mantêm acesso completo

### Alternativa: Cloud Function (Mais Seguro)

Se preferir uma abordagem mais segura, você pode criar uma Cloud Function que:
1. Recebe o `quoteId` e o `status` desejado
2. Valida a requisição (opcional: token ou senha)
3. Atualiza o Firestore com permissões de admin

Isso evita expor regras de escrita no Firestore, mas requer mais configuração.

### Teste

Após atualizar as regras:
1. Acesse `/p/{quoteId}` sem fazer login
2. Verifique se o orçamento carrega corretamente
3. Teste os botões de Aprovar/Rejeitar
4. Verifique no dashboard se o status foi atualizado




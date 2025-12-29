# Configuração do Sistema de Feedback

## ⚠️ IMPORTANTE: Configurar Link do Google My Business

Para que o botão "Avaliar no Google" funcione corretamente, você precisa atualizar o link no arquivo `src/pages/Feedback.tsx`.

### Passo a Passo:

1. **Obter o Link de Avaliação do Google My Business:**
   - Acesse: https://www.google.com/business/
   - Faça login na sua conta do Google My Business
   - Vá em "Perfil" → "Obter link de avaliação"
   - Copie o link gerado (formato: `https://g.page/r/SEU_ID/review`)

2. **Atualizar o Código:**
   - Abra `dashboard/src/pages/Feedback.tsx`
   - Localize a função `handleGoogleReview()` (linha ~60)
   - Substitua `'https://g.page/r/YOUR_GOOGLE_MY_BUSINESS_ID/review'` pelo seu link real

### Exemplo:

```typescript
const handleGoogleReview = () => {
  const googleReviewUrl = 'https://g.page/r/SUA_EMPRESA/review'; // Seu link aqui
  window.open(googleReviewUrl, '_blank');
};
```

## Funcionalidades Implementadas

### 1. Relatório Fotográfico (WorkOrderDetails)
- ✅ Seção "Relatório Fotográfico" na página de detalhes da OS
- ✅ Upload de fotos via URL (simples, sem Storage configurado)
- ✅ Grid responsivo para visualização das fotos
- ✅ Botão para remover fotos
- ✅ Validação de URLs inválidas (mostra placeholder)

### 2. Sistema de Feedback/NPS
- ✅ Link de feedback gerado automaticamente quando OS é concluída
- ✅ Página pública `/feedback/:osId` (sem autenticação)
- ✅ Interface de 5 estrelas
- ✅ Botão "Avaliar no Google" aparece apenas para avaliações de 5 estrelas
- ✅ Feedback salvo no Firestore (`feedbackSubmitted`, `feedbackRating`, `feedbackDate`)
- ✅ Mensagem de agradecimento após envio

## Estrutura de Dados no Firestore

### WorkOrder (atualizado):
```typescript
{
  // ... campos existentes
  photos?: string[];              // Array de URLs das fotos
  feedbackLink?: string;          // Link gerado automaticamente
  feedbackSubmitted?: boolean;    // Se o feedback foi enviado
  feedbackRating?: number;         // Nota de 1 a 5
  feedbackDate?: Timestamp;        // Data do feedback
  completedDate?: Timestamp;       // Data de conclusão
}
```

## Regras do Firestore

Adicione estas regras para permitir feedback público:

```javascript
match /workOrders/{osId} {
  // Permitir leitura pública (para visualizar feedback)
  allow read: if true;
  
  // Permitir atualização apenas dos campos de feedback para usuários não autenticados
  allow update: if request.resource.data.diff(resource.data).unchangedKeys()
    .hasAll(['quoteId', 'clientName', 'scheduledDate', 'technician', 'status', 'checklist', 'notes', 'photos', 'feedbackLink', 'completedDate'])
    && request.resource.data.feedbackSubmitted == true
    && request.resource.data.feedbackRating is int
    && request.resource.data.feedbackRating >= 1
    && request.resource.data.feedbackRating <= 5
    && request.resource.data.feedbackDate is timestamp;
  
  // Usuários autenticados podem fazer tudo
  allow read, write: if request.auth != null;
}
```

## Como Usar

1. **Adicionar Fotos na OS:**
   - Acesse a OS em "Ordens de Serviço" → "Ver Detalhes"
   - Role até "Relatório Fotográfico"
   - Cole a URL da imagem e clique em "Adicionar"

2. **Gerar Link de Feedback:**
   - Quando mudar o status da OS para "Concluído", o link é gerado automaticamente
   - O link aparece na seção "Link de Feedback"
   - Copie e compartilhe com o cliente

3. **Cliente Avalia:**
   - Cliente acessa o link `/feedback/{osId}`
   - Seleciona de 1 a 5 estrelas
   - Se der 5 estrelas, aparece botão para avaliar no Google
   - Feedback é salvo automaticamente




# Mudanças Pendentes - Resumo

## ✅ Já Implementado
- [x] Cliente: Apenas nome obrigatório
- [x] Serviços: Todos convertidos para unidade
- [x] PDF: Removido boleto
- [x] PDF: Removido texto sobre materiais originais
- [x] Componente Diagnosis criado

## 🔄 Em Progresso / Pendente

### QuoteNew.tsx
1. Adicionar estados: warranty, observations, customServiceName, customServicePrice, showCustomService, diagnosis
2. Adicionar função addCustomService
3. Adicionar formulário de serviço manual na UI
4. Adicionar cards de Garantia e Observações na sidebar
5. Atualizar loadQuote para carregar warranty, observations, diagnosis
6. Atualizar handleSave para salvar warranty, observations, diagnosis
7. Atualizar handleGeneratePDF para passar warranty e observations
8. Remover lógica de isFixed e isMeter (tudo é unit agora)
9. Adicionar componente Diagnosis na página

### QuotePDF.tsx
1. Adicionar logo (Image component) - precisa converter logo.png para base64 ou usar URL
2. Atualizar formatDate para incluir hora
3. Adicionar warranty e observations no PDF (já está nos props, falta renderizar)

### Novos Componentes
1. ✅ Diagnosis.tsx - Criado
2. ⏳ ReceiptPDF.tsx - Criar recibo para serviços finalizados
3. ⏳ Finance.tsx - Criar módulo financeiro completo

### Financeiro
- Criar página Finance.tsx com:
  - Receitas (de orçamentos aprovados)
  - Despesas
  - Relatórios (mensal, anual)
  - Gráficos
  - Filtros por período

### Work Orders
- Adicionar opção de gerar recibo quando OS está "completed"
- Recibo deve ter: garantia, detalhamento do serviço, fotos antes/depois




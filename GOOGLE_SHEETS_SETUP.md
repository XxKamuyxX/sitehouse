# Configuração do Google Sheets para Receber Leads

## Passo a Passo

### 1. Criar a Planilha no Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Na primeira linha (A1), adicione os seguintes cabeçalhos:

```
Nome | Telefone | GCLID | UTM Source | UTM Medium | UTM Campaign | Timestamp | Page URL | User Agent
```

### 2. Criar o Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com)
2. Clique em "Novo projeto"
3. Cole o código do arquivo `google-apps-script.js`
4. **IMPORTANTE**: Substitua `SEU_SPREADSHEET_ID_AQUI` pelo ID da sua planilha
   - O ID está na URL da planilha: `https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit`
5. Substitua `'Leads'` pelo nome da sua aba (se diferente)

### 3. Publicar o Script

1. No Google Apps Script, clique em "Implantar" > "Nova implantação"
2. Selecione tipo: "Aplicativo da Web"
3. Configure:
   - **Executar como**: Eu
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em "Implantar"
5. **Copie a URL gerada** (algo como: `https://script.google.com/macros/s/.../exec`)

### 4. Atualizar o Código do Site

1. Abra `src/components/WhatsAppModal.tsx`
2. Encontre a linha:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
3. Substitua pela URL que você copiou no passo 3

### 5. Atualizar o Número do WhatsApp

1. No mesmo arquivo `WhatsAppModal.tsx`
2. Encontre a linha:
   ```typescript
   const whatsappNumber = '5531999999999';
   ```
3. Substitua pelo seu número (formato: 5531999999999, sem espaços ou caracteres especiais)

## Estrutura dos Dados Enviados

O formulário envia os seguintes dados para o Google Sheets:

- **Nome**: Nome completo do cliente
- **Telefone**: Telefone formatado (apenas números são salvos)
- **GCLID**: Google Click ID (se presente na URL)
- **UTM Source**: Origem da campanha
- **UTM Medium**: Meio da campanha
- **UTM Campaign**: Nome da campanha
- **Timestamp**: Data e hora do envio (ISO format)
- **Page URL**: URL da página onde o formulário foi preenchido
- **User Agent**: Informações do navegador do usuário

## Teste

1. Preencha o formulário no site
2. Verifique se os dados aparecem na planilha
3. Verifique se o WhatsApp abre com a mensagem correta

## Troubleshooting

### Dados não aparecem na planilha
- Verifique se o script foi publicado corretamente
- Verifique se a URL no código está correta
- Verifique os logs do Google Apps Script (Execuções)

### Erro de permissão
- Certifique-se de que o script está configurado como "Qualquer pessoa"
- Verifique se você autorizou o script na primeira execução

### WhatsApp não abre
- Verifique se o número está no formato correto (sem espaços, sem +)
- Teste a URL manualmente: `https://wa.me/5531999999999`





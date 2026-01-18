# Cabeçalhos da Planilha Google Sheets

## Cabeçalhos para a Primeira Linha (Linha 1)

Copie e cole estes cabeçalhos na primeira linha da sua planilha:

```
Nome | Telefone | GCLID | UTM Source | UTM Medium | UTM Campaign | Timestamp | Page URL | User Agent
```

Ou, se preferir em português mais descritivo:

```
Nome Completo | Telefone/WhatsApp | Google Click ID | Origem (UTM Source) | Meio (UTM Medium) | Campanha (UTM Campaign) | Data/Hora | URL da Página | Navegador
```

## Descrição dos Campos

1. **Nome** - Nome completo do cliente
2. **Telefone** - Telefone/WhatsApp (apenas números)
3. **GCLID** - Google Click ID (para rastreamento de anúncios do Google)
4. **UTM Source** - Origem do tráfego (ex: google, facebook, instagram)
5. **UTM Medium** - Meio de tráfego (ex: cpc, email, social)
6. **UTM Campaign** - Nome da campanha
7. **Timestamp** - Data e hora do envio (formato ISO)
8. **Page URL** - URL da página onde o formulário foi preenchido
9. **User Agent** - Informações do navegador e sistema operacional

## Exemplo de Dados

```
João Silva | 31982798513 | gclid.abc123 | google | cpc | cortina-vidro-bh | 2024-01-15T10:30:00.000Z | https://seusite.com.br/ | Mozilla/5.0...
```

## Configuração no Google Sheets

1. Crie uma nova planilha
2. Renomeie a primeira aba para "Leads"
3. Cole os cabeçalhos na linha 1
4. Formate a linha 1 como cabeçalho (negrito, cor de fundo)
5. Copie o ID da planilha da URL
6. Use esse ID no código do Google Apps Script





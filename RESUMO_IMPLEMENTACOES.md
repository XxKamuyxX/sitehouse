# Resumo das Implementações - House Manutenção

## ✅ Implementações Concluídas

### 1. Informações de Contato
- ✅ **Endereço** adicionado no Footer: Rua Rio Grande do Norte, 726, Savassi, Belo Horizonte
- ✅ **WhatsApp** atualizado: (31) 98279-8513
- ✅ Link clicável do WhatsApp no footer

### 2. Blog Implementado
- ✅ Sistema de blog completo usando Astro Content Collections
- ✅ 4 posts criados:
  1. Manutenção Preventiva
  2. Roldanas Premium
  3. Vedação Perfeita
  4. Segurança em Primeiro Lugar
- ✅ Página de listagem: `/blog`
- ✅ Páginas individuais: `/blog/[slug]`
- ✅ Link "Blog" adicionado no menu fixo
- ✅ Guia criado em `GUIA_BLOG.md` para adicionar novos posts

### 3. Google Sheets - Configuração
- ✅ Código do Google Apps Script atualizado
- ✅ ID da planilha: `18ZTTPPWBfnKmWrJl86zE0QD4EczGPr6u-mJ2c56RxCA`
- ✅ Nome da aba: `Página1`
- ✅ Arquivo `CABECALHOS_PLANILHA.md` com todos os cabeçalhos necessários

### 4. GCLID Tracking
- ✅ Script de captura de GCLID e UTM parameters implementado
- ✅ Dados armazenados em `sessionStorage`
- ✅ Função global `window.getTrackingParams()` disponível
- ✅ Dados enviados para Google Sheets junto com o formulário

## 📋 Cabeçalhos da Planilha

Na primeira linha da planilha "Página1", você deve ter:

```
Nome | Telefone | GCLID | UTM Source | UTM Medium | UTM Campaign | Timestamp | Page URL | User Agent
```

## 🔧 Próximos Passos

### 1. Configurar Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com)
2. Crie um novo projeto
3. Cole o código do arquivo `google-apps-script.js`
4. O código já está configurado com:
   - ID da planilha: `18ZTTPPWBfnKmWrJl86zE0QD4EczGPr6u-mJ2c56RxCA`
   - Nome da aba: `Página1`
5. Salve o projeto
6. Clique em "Implantar" > "Nova implantação"
7. Selecione tipo: "Aplicativo da Web"
8. Configure:
   - **Executar como**: Eu
   - **Quem tem acesso**: Qualquer pessoa
9. Clique em "Implantar"
10. **Copie a URL gerada** (algo como: `https://script.google.com/macros/s/.../exec`)

### 2. Atualizar URL no Código

1. Abra `src/components/WhatsAppModal.tsx`
2. Encontre a linha 117:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
3. Substitua `YOUR_SCRIPT_ID` pela URL que você copiou no passo anterior

### 3. Adicionar Cabeçalhos na Planilha

Certifique-se de que a planilha "Página1" tem os seguintes cabeçalhos na linha 1:

| Nome | Telefone | GCLID | UTM Source | UTM Medium | UTM Campaign | Timestamp | Page URL | User Agent |
|------|----------|-------|------------|------------|--------------|-----------|----------|------------|

## 📝 Como Adicionar Novos Posts no Blog

1. Crie um arquivo `.md` na pasta `src/content/blog/`
2. Use o formato do frontmatter (veja `GUIA_BLOG.md`)
3. Execute `npm run build`
4. O post aparecerá automaticamente em `/blog`

## 📊 Dados Coletados

O formulário coleta e envia os seguintes dados:

- **Nome**: Nome completo do cliente
- **Telefone**: Telefone/WhatsApp (apenas números)
- **GCLID**: Google Click ID (se presente na URL)
- **UTM Source**: Origem do tráfego
- **UTM Medium**: Meio do tráfego
- **UTM Campaign**: Nome da campanha
- **Timestamp**: Data e hora do envio (ISO format)
- **Page URL**: URL da página onde o formulário foi preenchido
- **User Agent**: Informações do navegador

## 🎯 Status Final

✅ Endereço no site
✅ WhatsApp atualizado
✅ Blog completo com 4 posts
✅ Google Sheets configurado
✅ GCLID tracking implementado
✅ Sistema pronto para receber leads

## 📞 Informações de Contato no Site

- **Endereço**: Rua Rio Grande do Norte, 726, Savassi, Belo Horizonte - MG
- **WhatsApp**: (31) 98279-8513
- **Link**: https://wa.me/5531982798513





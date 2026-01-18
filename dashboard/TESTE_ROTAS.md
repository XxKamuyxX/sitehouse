# 🧪 Teste de Rotas - Sistema de Gêmeo Digital

## URLs para Testar:

### 1. Studio Mode (MASTER apenas)
```
http://localhost:5173/admin/studio
```
**Espera-se:** Grade com 13 thumbnails renderizados

### 2. Template Manager
```
http://localhost:5173/master/templates
```
**Espera-se:** Lista de templates com badge "Motor"

### 3. Lista de Orçamentos
```
http://localhost:5173/admin/quotes
```
**Espera-se:** Botão roxo "👁️ Validar" em cada orçamento

### 4. Criar Orçamento
```
http://localhost:5173/admin/quotes/new
```
**Espera-se:** Campo "Lado de Abertura" no modal de item

### 5. Proposta Cliente (substitua ID)
```
http://localhost:5173/proposta/[ID_DO_ORCAMENTO]
```
**Espera-se:** Proposta mobile-first com renderização interativa

---

## ✅ Checklist de Verificação:

- [ ] Você está logado como Master?
- [ ] O console (F12) mostra algum erro?
- [ ] Você consegue acessar `/admin/studio`?
- [ ] Você vê o botão "Validar" em `/admin/quotes`?
- [ ] O campo "Lado de Abertura" aparece ao criar item?

---

## 🔍 Como Verificar se Você é Master:

1. Abra o Console (F12)
2. Digite: `localStorage.getItem('userMetadata')`
3. Procure por: `"role":"master"`

Se não for master, você precisa alterar no Firestore:
```
Collection: companies
Document: [seu_company_id]
Field: role = "master"
```

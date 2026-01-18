# 🧪 TESTE PASSO A PASSO - Sistema de Gêmeo Digital

**Como Testar Todas as Funcionalidades Novas**  
**Atualizado:** 18 de Janeiro de 2026

---

## ✅ O QUE JÁ FUNCIONOU

- [x] **Studio Mode** - http://localhost:5173/admin/studio ✅ FUNCIONANDO

---

## 🎯 TESTE COMPLETO - 5 PASSOS

### PASSO 1: Criar Orçamento de Teste 📝

**URL:** http://localhost:5173/admin/quotes/new

**Ações:**

1. **Selecionar/Criar Cliente:**
   - Se não tiver, clique "+ Novo Cliente"
   - Preencha nome e dados
   - Salve

2. **Adicionar Item de Instalação:**
   - Clique no botão verde **"+ Adicionar Item de Instalação"**
   - Aparecerá um MODAL

3. **No Modal, Preencher:**
   ```
   ┌────────────────────────────────────┐
   │ Tipo de Serviço                    │
   │ [Cortina de Vidro ▼]              │
   │                                    │
   │ Largura (m)      Altura (m)        │
   │ [6.5]            [2.4]             │
   │                                    │
   │ Preço por m²                       │
   │ [850]                              │
   │                                    │
   │ Cor do Vidro                       │
   │ [Incolor] [Verde] [Fumê] [Bronze] │
   │                           ↑ CLIQUE │
   │                                    │
   │ Espessura do Vidro                 │
   │ [4mm] [6mm] [8mm] [10mm] [12mm]   │
   │              ↑ CLIQUE              │
   │                                    │
   │ Cor do Perfil                      │
   │ [Branco] [Preto] [Fosco] [Bronze] │
   │                          ↑ CLIQUE  │
   │                                    │
   │ ** ROLE PARA BAIXO! **             │
   │                                    │
   │ Lado de Abertura (Opcional)        │
   │ ┌──────────┐  ┌──────────┐       │
   │ │⬅️ Esquerda│  │➡️ Direita │       │
   │ └──────────┘  └──────────┘       │
   │  ↑ CLIQUE                          │
   │                                    │
   │ [Salvar Item]                      │
   └────────────────────────────────────┘
   ```

4. **Verificar:**
   - Item apareceu na lista?
   - Mostra dimensões 6.5m x 2.4m?
   - Mostra Bronze/Bronze?

5. **Salvar Orçamento:**
   - Preencha os campos obrigatórios
   - Clique "Salvar Orçamento"

---

### PASSO 2: Validar Projeto 👁️

**URL:** http://localhost:5173/admin/quotes

**Ações:**

1. **Encontrar o orçamento criado**

2. **Clicar no botão roxo "👁️ Validar"**
   ```
   [👁️ Validar] [💬 WhatsApp] [📄 Detalhes]
       ↑ AQUI
   ```

3. **O QUE DEVE APARECER:**
   ```
   ┌────────────────────────────────────────┐
   │ Validação de Engenharia           [X]  │
   ├────────────────────────────────────────┤
   │ ┌──────────┐  ┌──────────┐            │
   │ │RENDERIZAÇÃO│  │CHECKLIST │            │
   │ │            │  │          │            │
   │ │ [PIVÔ] [⬅️] │  │✓ Dimensões│            │
   │ │  F1    F2  │  │✓ Folhas   │            │
   │ │ [⬅️] [⬅️]  │  │✓ Normas   │            │
   │ │  F3    F4  │  │          │            │
   │ │            │  │ℹ️ Nenhum  │            │
   │ │Bronze #cd7f│  │  problema │            │
   │ │     32     │  │          │            │
   │ └──────────┘  └──────────┘            │
   ├────────────────────────────────────────┤
   │         [✓ Aprovar Projeto]            │
   └────────────────────────────────────────┘
   ```

4. **VERIFIQUE:**
   - [  ] Folhas estão numeradas? (F1, F2, F3...)
   - [  ] Há setas de direção? (⬅️)
   - [  ] Há labels? (MÓVEL, PIVÔ)
   - [  ] Bronze está no tom correto?
   - [  ] Checklist mostra validações?

---

### PASSO 3: Ver Proposta Cliente 📱

**URL:** http://localhost:5173/proposta/[ID_DO_ORCAMENTO]

**Como Pegar o ID:**

1. Na lista de orçamentos (`/admin/quotes`)
2. Clique "Detalhes" no orçamento
3. Copie o ID da URL
4. OU abra Firestore e copie o ID do documento

**Ações:**

1. **Acesse:** `http://localhost:5173/proposta/SEU_ID_AQUI`

2. **O QUE DEVE APARECER:**
   ```
   ┌─────────────────────────┐
   │ [Logo] House Manutenção │
   │ ┌─────────────────────┐ │
   │ │Cliente: Nome        │ │
   │ │Total: R$ 1.500      │ │
   │ └─────────────────────┘ │
   │                         │
   │ ┌─────────────────────┐ │
   │ │📦 Cortina de Vidro  │ │
   │ │   6.5m x 2.4m       │ │
   │ │   R$ 1.500       ▼ │ │
   │ └─────────────────────┘ │
   │                         │
   │ [CLIQUE PARA EXPANDIR]  │
   │                         │
   │ ┌─────────────────────┐ │
   │ │ [RENDERIZAÇÃO]      │ │
   │ │  COM RÓTULOS!       │ │
   │ │ F1, F2, F3...       │ │
   │ │ Setas ⬅️            │ │
   │ │ Bronze #cd7f32      │ │
   │ └─────────────────────┘ │
   │                         │
   │ ┌─────────────────────┐ │
   │ │💬 Aprovar WhatsApp  │ │
   │ └─────────────────────┘ │
   └─────────────────────────┘
   ```

3. **VERIFIQUE:**
   - [  ] Item aparece?
   - [  ] Expande ao clicar?
   - [  ] Renderização aparece?
   - [  ] Rótulos estão visíveis?
   - [  ] Bronze está correto?

---

### PASSO 4: Testar Campo "Lado de Abertura" 🔄

**URL:** http://localhost:5173/admin/quotes/new

**Ações:**

1. **Adicionar Novo Item:**
   - Clique "+ Adicionar Item de Instalação"

2. **Preencher Básico:**
   - Serviço: Cortina de Vidro
   - Largura: 6.5m
   - Altura: 2.4m

3. **IMPORTANTE - ROLE O MODAL PARA BAIXO! 👇**
   - Use a barra de rolagem DO MODAL
   - Role até o final

4. **DEVE APARECER:**
   ```
   Lado de Abertura / Estacionamento
   (Opcional)
   
   ┌──────────────┐  ┌──────────────┐
   │⬅️ Esquerda   │  │➡️ Direita     │
   │Pivô à       │  │Pivô à        │
   │esquerda     │  │direita       │
   └──────────────┘  └──────────────┘
   
   💡 Define de qual lado ficará o pivô
   ```

5. **TESTE:**
   - [  ] Clique em "⬅️ Esquerda" → Fica azul?
   - [  ] Clique em "➡️ Direita" → Fica azul?
   - [  ] Alterna entre os dois?

6. **Salve o Item e o Orçamento**

7. **Valide e Veja a Diferença:**
   - Esquerda: Pivô em F1, setas ⬅️
   - Direita: Pivô em F8, setas ➡️

---

### PASSO 5: Comparar Esquerda vs Direita 🔄

**Criar 2 Orçamentos:**

**Orçamento A:**
- Lado de Abertura: ⬅️ Esquerda
- Resultado ao validar:
  ```
  [PIVÔ] [⬅️] [⬅️] [⬅️] [⬅️] [⬅️]
    F1    F2   F3   F4   F5   F6
  ```

**Orçamento B:**
- Lado de Abertura: ➡️ Direita
- Resultado ao validar:
  ```
  [➡️] [➡️] [➡️] [➡️] [➡️] [PIVÔ]
   F1   F2   F3   F4   F5    F6
  ```

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: "Botão Validar não aparece"

**Causa:** Orçamento antigo sem `engine_config_snapshot`

**Solução:**
- Crie um NOVO orçamento seguindo PASSO 1
- Orçamentos antigos não têm os dados necessários

---

### Problema 2: "Campo Lado de Abertura não aparece"

**Causa:** Modal não rolou até o final

**Solução:**
- **ROLE O MODAL PARA BAIXO!**
- O campo está no final, depois de "Cor do Perfil"

---

### Problema 3: "Renderização não aparece"

**Causa:** Item sem `engine_config_snapshot`

**Solução:**
- Use a versão atualizada (recarregue a página: Ctrl+F5)
- O sistema agora gera automaticamente ao salvar

---

### Problema 4: "Proposta cliente não renderiza"

**Causa:** Orçamento criado antes da atualização

**Solução:**
- Crie um NOVO orçamento DEPOIS desta atualização
- Orçamentos antigos não têm estrutura completa

---

## ✅ CHECKLIST FINAL

### Studio Mode:
- [x] Acessa `/admin/studio`
- [x] Vê 13 thumbnails
- [x] Bronze no tom correto

### Criar Orçamento:
- [ ] Acessa `/admin/quotes/new`
- [ ] Adiciona item de instalação
- [ ] **ROL A O MODAL**
- [ ] Vê campo "Lado de Abertura"
- [ ] Seleciona ⬅️ ou ➡️
- [ ] Salva item
- [ ] Salva orçamento

### Validação:
- [ ] Acessa `/admin/quotes`
- [ ] Vê botão "👁️ Validar"
- [ ] Clica no botão
- [ ] Modal abre
- [ ] Vê renderização COM rótulos
- [ ] Vê folhas F1, F2, F3...
- [ ] Vê setas ⬅️ ou ➡️
- [ ] Vê labels MÓVEL, PIVÔ
- [ ] Vê bronze #cd7f32
- [ ] Vê checklist

### Proposta Cliente:
- [ ] Copia ID do orçamento
- [ ] Acessa `/proposta/ID`
- [ ] Vê proposta mobile
- [ ] Expande item
- [ ] Vê renderização
- [ ] Vê rótulos
- [ ] Testa botão WhatsApp

---

## 🚀 COMEÇAR AGORA

### 1. Recarregue a Página (IMPORTANTE!)

```
Ctrl + F5
```

Isso garante que você está usando a versão mais nova do código!

### 2. Vá para Criar Orçamento

```
http://localhost:5173/admin/quotes/new
```

### 3. Siga o PASSO 1 acima

Crie um orçamento completo com todas as informações.

### 4. Depois, teste PASSO 2 (Validar)

Veja os rótulos funcionando!

---

## 💡 DICA IMPORTANTE

**ORÇAMENTOS ANTIGOS NÃO VÃO FUNCIONAR!**

Os orçamentos criados ANTES desta atualização não têm:
- `engine_config_snapshot`
- `ladoAbertura`
- Estrutura completa para renderização

**SOLUÇÃO:** Crie um orçamento NOVO seguindo este guia!

---

## 📸 O QUE VOCÊ DEVE VER

### Modal de Criar Item:

```
ROLE ATÉ O FINAL! 👇

┌────────────────────────────────────┐
│ Cor do Vidro                       │
│ [Incolor] [Verde] [Fumê] [Bronze] │
│                                    │
│ Espessura do Vidro                 │
│ [4mm] [6mm] [8mm] [10mm] [12mm]   │
│                                    │
│ Cor do Perfil                      │
│ [Branco] [Preto] [Fosco] [Bronze] │
│                                    │
│ ⬇️ AQUI EMBAIXO ⬇️                 │
│                                    │
│ Lado de Abertura / Estacionamento  │
│ (Opcional)                         │
│                                    │
│ ┌──────────────┐  ┌──────────────┐│
│ │⬅️ Esquerda   │  │➡️ Direita     ││
│ │Pivô à       │  │Pivô à        ││
│ │esquerda     │  │direita       ││
│ └──────────────┘  └──────────────┘│
│                                    │
│ 💡 Define de qual lado...          │
│                                    │
│ [Cancelar]        [Salvar Item]    │
└────────────────────────────────────┘
```

### Modal de Validação:

```
┌────────────────────────────────────┐
│ Validação de Engenharia       [X] │
├────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐        │
│ │RENDERIZAÇÃO│  │CHECKLIST │        │
│ │          │  │          │        │
│ │ [PIVÔ]   │  │✓ Tudo OK │        │
│ │   F1     │  │          │        │
│ │ [⬅️MÓVEL]│  │ℹ️ Nenhum │        │
│ │   F2     │  │  problema│        │
│ │ [⬅️MÓVEL]│  │          │        │
│ │   F3     │  │💡 Validado│        │
│ │          │  │          │        │
│ │ Bronze   │  │          │        │
│ │#cd7f32   │  │          │        │
│ └──────────┘  └──────────┘        │
├────────────────────────────────────┤
│      [Fechar] [✓ Aprovar]          │
└────────────────────────────────────┘
```

---

## 🎉 SUCESSO!

Se você conseguiu ver tudo acima, PARABÉNS! 🎉

Todas as 4 melhorias estão funcionando:
1. ✅ Bronze #cd7f32
2. ✅ Rótulos F1, F2, F3...
3. ✅ Setas ⬅️ ➡️
4. ✅ Campo Lado de Abertura

---

## 📞 Se Não Funcionar

Me envie print/foto de:

1. **Console (F12)** com erros em vermelho
2. **Tela do modal** ao criar item (rolado até o final)
3. **Tela de validação** (se abrir)

Assim posso identificar o problema exato!

---

🎯 **COMECE PELO PASSO 1 - CTRL+F5 E CRIE NOVO ORÇAMENTO!**

# 🎨 Template Manager Atualizado - Guia Completo

**Status:** ✅ COMPLETO  
**Data:** 18 de Janeiro de 2026  
**Arquivo:** `src/pages/master/TemplateManager.tsx`

---

## 📦 O Que Foi Adicionado

O formulário de criação de templates agora suporta **configuração de Motor de Engenharia** para cálculo automático!

### Novos Recursos:

1. ✅ **Select "Tipo de Motor"** - 8 tipos de motores predefinidos
2. ✅ **Editor JSON** - Para configurar regras avançadas
3. ✅ **Botão "Carregar Padrão"** - Preenche JSON automaticamente
4. ✅ **Botão "Testar"** - Preview da configuração antes de salvar
5. ✅ **Validação em Tempo Real** - Indica se JSON está válido
6. ✅ **Badge "Motor"** - Identifica templates com motor configurado

---

## 🎯 Como Usar - Passo a Passo

### **Cenário 1: Criar Template SEM Motor (Estático)**

Use para templates que são apenas imagens de referência, sem cálculo automático.

```
1. Preencha "Nome do Projeto"
2. Selecione "Categoria"
3. Faça upload da imagem
4. Deixe "Tipo de Motor" em branco
5. Clique em "Salvar Projeto"
```

**Exemplo:** Template de "Espelho Bisotado 80x60cm" (medida fixa, sem variações)

---

### **Cenário 2: Criar Template COM Motor (Dinâmico)**

Use para templates que precisam calcular dimensões, materiais e preços automaticamente.

```
1. Preencha "Nome do Projeto"
2. Selecione "Categoria"
3. Faça upload da imagem

4. MOTOR DE ENGENHARIA:
   a) Selecione "Tipo de Motor" (ex: Sacada KS)
   b) O JSON será preenchido automaticamente
   c) Edite o JSON se necessário
   d) Clique em "Testar" para visualizar
   e) Se estiver OK, clique em "Salvar Projeto"
```

**Exemplo:** Template de "Sacada KS 6-12 Folhas" (usuário escolhe largura, altura, cor, etc)

---

## 🔧 Tipos de Motor Disponíveis

### 1. **Sacada KS (Empilhável)**
- **ID:** `sacada_ks`
- **Uso:** Envidraçamento de sacadas com folhas empilháveis
- **Características:** Pivô central, 6-12 folhas, vidro temperado obrigatório

### 2. **Janela de Correr**
- **ID:** `janela_correr`
- **Uso:** Janelas com folhas deslizantes
- **Características:** 2-6 folhas, sistema de trilho, sobreposição

### 3. **Janela Maxim-Ar**
- **ID:** `janela_maximar`
- **Uso:** Janelas que inclinam para abrir
- **Características:** Basculante, abertura superior

### 4. **Porta Pivotante**
- **ID:** `porta_pivotante`
- **Uso:** Portas de vidro com pivô
- **Características:** Vidro temperado, dobradiça pivô

### 5. **Box Frontal**
- **ID:** `box_frontal`
- **Uso:** Box de banheiro frontal
- **Características:** 2 folhas (1 fixa + 1 móvel), vidro 8mm mínimo

### 6. **Box de Canto (L)**
- **ID:** `box_canto`
- **Uso:** Box de banheiro em L
- **Características:** 2 lados, canto 90°

### 7. **Guarda-Corpo Torre**
- **ID:** `guarda_corpo_torre`
- **Uso:** Guarda-corpo com torres de inox
- **Características:** Vidro fixo, altura mínima 1.05m (norma)

### 8. **Vidro Fixo**
- **ID:** `vidro_fixo`
- **Uso:** Vitrines, divisórias, vidros sem abertura
- **Características:** Perfil U, sem movimento

---

## 📝 Estrutura do JSON (engine_config)

### Campos Obrigatórios:

```json
{
  "engine_id": "sacada_ks",           // Tipo do motor
  "regras_fisicas": {                 // Regras de cálculo
    "tipo_movimento": "empilhavel",   // Como as folhas se movem
    "tem_pivo": true,                 // Se tem pivô central
    "folgas": {                       // Espaçamentos (em mm)
      "padrao": 15,
      "lateral": 20,
      "superior": 15,
      "inferior": 15
    },
    "largura_minima_folha": 0.5,      // Metros
    "largura_maxima_folha": 1.0,      // Metros
    "espessura_vidro_padrao": 8       // Milímetros
  },
  "mapeamento_materiais": {           // Cores disponíveis
    "vidro": {
      "incolor": { "hex": "#E6F5FA", "nome": "Incolor" }
    },
    "perfil": {
      "branco_fosco": { "hex": "#F5F7FA", "nome": "Branco Fosco" }
    }
  }
}
```

### Campos Importantes:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `engine_id` | string | Identificador do motor |
| `regras_fisicas.folgas.*` | number | Folgas em milímetros |
| `regras_fisicas.largura_*_folha` | number | Limites em metros |
| `regras_fisicas.espessura_vidro_padrao` | number | Espessura padrão (mm) |
| `mapeamento_materiais.vidro` | object | Cores de vidro disponíveis |
| `mapeamento_materiais.perfil` | object | Cores de perfil disponíveis |

---

## 🎨 Exemplo Completo - Sacada KS

### 1. Preencher Formulário:

```
Nome: Sacada KS Empilhável
Categoria: Cobertura
Tipo de Motor: Sacada KS (Empilhável)
```

### 2. JSON Gerado Automaticamente:

```json
{
  "engine_id": "sacada_ks",
  "regras_fisicas": {
    "tipo_movimento": "empilhavel",
    "tem_pivo": true,
    "permite_abertura_dupla": false,
    "folgas": {
      "padrao": 15,
      "lateral": 20,
      "superior": 15,
      "inferior": 15
    },
    "fator_empilhamento": 0.04,
    "largura_minima_folha": 0.5,
    "largura_maxima_folha": 1.0,
    "area_maxima_folha": 2.5,
    "peso_maximo_folha": 50,
    "altura_minima": 1.2,
    "altura_maxima": 3.0,
    "espessuras_vidro_permitidas": [6, 8, 10],
    "espessura_vidro_padrao": 8,
    "tipos_vidro_permitidos": ["temperado"],
    "tipo_vidro_obrigatorio": "temperado",
    "tipo_perfil": "linha_ks_standard",
    "espessura_perfil": 30,
    "calcular_folhas_automatico": true,
    "exigir_numero_folhas_par": true,
    "permitir_folhas_asimetricas": false
  },
  "mapeamento_materiais": {
    "vidro": {
      "incolor": { "hex": "#E6F5FA", "nome": "Incolor" },
      "fume": { "hex": "#3C4146", "nome": "Fumê" },
      "verde": { "hex": "#B4DCBE", "nome": "Verde" },
      "bronze": { "hex": "#B49178", "nome": "Bronze" }
    },
    "perfil": {
      "branco_fosco": { "hex": "#F5F7FA", "nome": "Branco Fosco" },
      "preto_anodizado": { "hex": "#35383D", "nome": "Preto Anodizado" },
      "bronze": { "hex": "#8B6F47", "nome": "Bronze" }
    }
  }
}
```

### 3. Testar Renderização:

Clique em **"Testar"** para ver:
- ✅ Tipo de motor
- ✅ Tipo de movimento
- ✅ Folgas configuradas
- ✅ Limites de folha
- ✅ Cores de vidro disponíveis
- ✅ Cores de perfil disponíveis

### 4. Salvar:

Clique em **"Salvar Projeto"** - o template será salvo com `engine_config` no Firestore.

---

## 🔍 Modal de Teste - O Que Ele Mostra

### Seção 1: Informações Básicas
```
┌─────────────────────────────────────┐
│ Tipo de Motor: sacada_ks           │
│ Tipo de Movimento: empilhavel      │
└─────────────────────────────────────┘
```

### Seção 2: Regras Físicas
```
┌─────────────────────────────────────┐
│ Folga Padrão: 15mm                 │
│ Folga Lateral: 20mm                │
│ Folga Superior: 15mm               │
│ Largura Mín. Folha: 0.5m           │
│ Largura Máx. Folha: 1.0m           │
│ Espessura Padrão: 8mm              │
└─────────────────────────────────────┘
```

### Seção 3: Materiais Disponíveis
```
┌─── VIDROS ───────────────────────┐
│ ■ Incolor (#E6F5FA)             │
│ ■ Fumê (#3C4146)                │
│ ■ Verde (#B4DCBE)               │
│ ■ Bronze (#B49178)              │
└─────────────────────────────────┘

┌─── PERFIS ───────────────────────┐
│ ■ Branco Fosco (#F5F7FA)        │
│ ■ Preto Anodizado (#35383D)     │
│ ■ Bronze (#8B6F47)              │
└─────────────────────────────────┘
```

---

## 🎯 Validações Automáticas

### ✅ Validações ao Salvar:

1. **Nome não vazio**
2. **Categoria selecionada**
3. **Imagem fornecida**
4. **JSON válido** (se motor fornecido)
5. **engine_id presente** (se motor fornecido)
6. **regras_fisicas presente** (se motor fornecido)

### 🔍 Validação em Tempo Real:

- **Ícone Verde (✓)** - JSON válido
- **Ícone Vermelho (!)** - JSON inválido
- **Fundo vermelho** - Erro de sintaxe

---

## 🎨 UI/UX - Melhorias Visuais

### 1. **Seção Motor de Engenharia**
- Separada visualmente com borda superior
- Ícone `Settings` para identificação
- Texto explicativo
- Opcional (pode ser deixada em branco)

### 2. **Editor JSON**
- Fonte monoespaçada para código
- Altura fixa (256px) com scroll
- Validação visual (verde/vermelho)
- Botões de ação no topo direito

### 3. **Badge "Motor"**
- Templates com motor exibem badge azul
- Ícone `Settings` + texto "Motor"
- Facilita identificação visual

### 4. **Modal de Teste**
- Fullscreen responsivo
- Scroll automático
- Informações organizadas em cards
- Cores dos materiais visualizadas

---

## 📊 Fluxo de Dados

```
┌───────────────────────────────────────────────────────────┐
│  ADMIN SELECIONA "Sacada KS"                              │
└────────────────────┬──────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────────────────┐
│  handleEngineTypeChange()                                 │
│  - Busca DEFAULT_ENGINE_CONFIGS['sacada_ks']             │
│  - Preenche engineConfigJson com JSON.stringify()        │
│  - Marca jsonValid = true                                │
└────────────────────┬──────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────────────────┐
│  ADMIN EDITA JSON (opcional)                              │
│  handleJsonChange()                                       │
│  - Valida JSON.parse()                                   │
│  - Atualiza ícone (verde/vermelho)                       │
└────────────────────┬──────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────────────────┐
│  ADMIN CLICA "TESTAR"                                     │
│  handleTestRendering()                                    │
│  - Valida JSON                                           │
│  - Abre modal com preview                                │
│  - Exibe regras e cores                                  │
└────────────────────┬──────────────────────────────────────┘
                     ↓
┌───────────────────────────────────────────────────────────┐
│  ADMIN CLICA "SALVAR PROJETO"                             │
│  handleSave()                                             │
│  - Valida campos obrigatórios                            │
│  - Parse JSON → engineConfig                             │
│  - Upload imagem                                         │
│  - Salva no Firestore com engine_config                 │
└───────────────────────────────────────────────────────────┘
```

---

## 🔗 Integração com Gêmeo Digital

### Como o Template Será Usado:

```typescript
// 1. Usuário seleciona template no orçamento
const template = await buscarTemplate('template_id');

// 2. Template tem engine_config
if (template.engine_config) {
  const engineConfig = template.engine_config;
  
  // 3. Extrair regras
  const rules: EngineRules = {
    tipo_movimento: engineConfig.regras_fisicas.tipo_movimento,
    folga_padrao: engineConfig.regras_fisicas.folgas.padrao,
    // ... etc
  };
  
  // 4. Usuário preenche dimensões
  const props: EngineProps = {
    largura: 6.5,
    altura: 2.4,
    cor_vidro_id: 'incolor',
    cor_perfil_id: 'branco_fosco',
    // ... etc
  };
  
  // 5. Renderizar
  <EngineRenderer props={props} rules={rules} />
  
  // 6. Salvar output no orçamento
  const output = await renderizar(props, rules);
  await salvarNoOrcamento({
    engine_config_snapshot: engineConfig,
    resultado_calculo: output,
  });
}
```

---

## ✅ Checklist de Testes

### Teste 1: Template SEM Motor
- [ ] Criar template sem selecionar tipo de motor
- [ ] Salvar normalmente
- [ ] Verificar no Firestore: `engine_config` deve ser `undefined`

### Teste 2: Template COM Motor (JSON Automático)
- [ ] Selecionar "Sacada KS"
- [ ] JSON deve ser preenchido automaticamente
- [ ] Clicar em "Testar"
- [ ] Modal deve abrir com preview
- [ ] Salvar
- [ ] Verificar no Firestore: `engine_config` deve ter dados

### Teste 3: Template COM Motor (JSON Customizado)
- [ ] Selecionar "Janela de Correr"
- [ ] Editar JSON (mudar folga_padrao de 12 para 15)
- [ ] Clicar em "Testar"
- [ ] Modal deve mostrar 15mm
- [ ] Salvar
- [ ] Verificar no Firestore: folga deve ser 15

### Teste 4: Validação JSON
- [ ] Digitar JSON inválido (ex: `{ nome: "teste" }` sem aspas)
- [ ] Ícone vermelho deve aparecer
- [ ] Fundo vermelho no textarea
- [ ] Botão "Testar" deve ficar desabilitado
- [ ] Botão "Salvar" deve funcionar e alertar erro

### Teste 5: Badge "Motor"
- [ ] Criar 1 template sem motor
- [ ] Criar 1 template com motor
- [ ] Lista deve mostrar badge azul apenas no segundo

---

## 🚀 Próximos Passos

### Fase 4: Implementar Motores Reais

1. ⏳ Criar componentes de motor (`SacadaKSEngine.tsx`, etc)
2. ⏳ Substituir preview do modal por renderização real
3. ⏳ Integrar com `engine_config` do template
4. ⏳ Adicionar cálculo de materiais e preços

### Fase 5: Formulário de Orçamento

1. ⏳ Atualizar QuoteNew.tsx para usar templates com motor
2. ⏳ Adicionar campos de entrada (largura, altura, cor)
3. ⏳ Renderizar preview em tempo real
4. ⏳ Salvar `engine_config_snapshot` no item do orçamento

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/master/TemplateManager.tsx` | Formulário atualizado |
| `src/engines/types.ts` | Tipos de motor |
| `src/engines/EXEMPLO_USO_TIPOS.tsx` | Exemplos de uso |
| `src/constants/materiais.js` | Cores realistas |
| `src/types/digitalTwin.ts` | Tipos do Gêmeo Digital |

---

## 🎉 Conclusão

O formulário de Template Manager agora está **completo e pronto para uso**!

### Principais Conquistas:

✅ **8 tipos de motor predefinidos**  
✅ **Configurações JSON automáticas**  
✅ **Validação em tempo real**  
✅ **Preview antes de salvar**  
✅ **Integração com Gêmeo Digital preparada**  

### Como Começar:

1. Acesse o Template Manager no dashboard master
2. Crie um novo template
3. Selecione um tipo de motor
4. Clique em "Testar" para visualizar
5. Salve o template

🎉 **Sistema de Templates com Motor de Engenharia - Pronto!**

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Mantido por:** Equipe Gestor Vitreo

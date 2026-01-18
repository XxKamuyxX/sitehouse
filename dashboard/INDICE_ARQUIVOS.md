# 📑 Índice de Arquivos - Sistema de Gêmeo Digital

**Guia de Navegação Rápida**

---

## 🎯 Por Onde Começar?

Escolha seu perfil:

### 👔 **Gerente/Stakeholder (Não Técnico)**
Comece por:
1. **RESUMO_EXECUTIVO.md** ← Você está aqui!
2. **README_GEMEO_DIGITAL.md** (visão geral)

### 👨‍💻 **Desenvolvedor (Implementação)**
Comece por:
1. **GEMEO_DIGITAL_GUIA_RAPIDO.md** ← Comece aqui!
2. **src/types/digitalTwin.ts** (veja os tipos)
3. **EXEMPLO_INTEGRACAO.tsx** (copie código)
4. **CHECKLIST_IMPLEMENTACAO.md** (siga as fases)

### 🏗️ **Arquiteto/Tech Lead (Visão Técnica)**
Comece por:
1. **GEMEO_DIGITAL_SCHEMA.md** ← Comece aqui!
2. **ARQUITETURA_VISUAL.md** (diagramas)
3. **src/types/digitalTwin.ts** (estrutura)

---

## 📂 Árvore de Arquivos

```
dashboard/
│
├── 📘 DOCUMENTAÇÃO
│   │
│   ├── 📄 INDICE_ARQUIVOS.md           ← VOCÊ ESTÁ AQUI
│   │   └── Guia de navegação rápida entre todos os arquivos
│   │
│   ├── 📊 RESUMO_EXECUTIVO.md          ⭐ STAKEHOLDERS
│   │   ├── O que foi criado (resumo)
│   │   ├── Benefícios mensuráveis
│   │   ├── ROI esperado
│   │   ├── Próximas etapas
│   │   └── Recomendação final
│   │
│   ├── 🔷 README_GEMEO_DIGITAL.md      ⭐ TODOS
│   │   ├── Visão geral do sistema
│   │   ├── Índice de todos os arquivos
│   │   ├── Como começar (3 passos)
│   │   ├── Exemplos de templates
│   │   └── FAQ e troubleshooting
│   │
│   ├── 🚀 GEMEO_DIGITAL_GUIA_RAPIDO.md ⭐ DESENVOLVEDORES
│   │   ├── Guia prático de uso
│   │   ├── Como instalar e configurar
│   │   ├── Como popular templates
│   │   ├── Próximas etapas de implementação
│   │   ├── Testes manuais
│   │   └── Troubleshooting
│   │
│   ├── 📖 GEMEO_DIGITAL_SCHEMA.md      ⭐ ARQUITETOS
│   │   ├── Documentação técnica completa
│   │   ├── Estrutura do Firestore
│   │   ├── Fluxo de dados detalhado
│   │   ├── Exemplos práticos
│   │   ├── Validações e regras
│   │   └── Guia de implementação
│   │
│   ├── 🏗️ ARQUITETURA_VISUAL.md       ⭐ ARQUITETOS
│   │   ├── Diagramas ASCII completos
│   │   ├── Estrutura do Firestore (visual)
│   │   ├── Fluxo de dados (passo a passo)
│   │   ├── Hierarquia de componentes
│   │   ├── Algoritmo de cálculo (pseudocódigo)
│   │   └── Exemplo completo de dados
│   │
│   └── ✅ CHECKLIST_IMPLEMENTACAO.md   ⭐ DESENVOLVEDORES
│       ├── 10 fases de desenvolvimento
│       ├── Checklist de tarefas (checkbox)
│       ├── Progresso visual (barra)
│       ├── Próximos passos imediatos
│       └── Estimativas de tempo
│
│
├── 💻 CÓDIGO
│   │
│   ├── src/types/digitalTwin.ts        ⭐ TIPOS TYPESCRIPT
│   │   ├── Interface Template
│   │   ├── Interface EngineConfig
│   │   ├── Interface RegrasFisicas
│   │   ├── Interface MapeamentoMateriais
│   │   ├── Interface OrcamentoItem
│   │   ├── Interface ResultadoCalculo
│   │   ├── Interface Orcamento
│   │   ├── EXEMPLO_SACADA_KS (JSON completo)
│   │   ├── EXEMPLO_JANELA_4_FOLHAS (JSON completo)
│   │   └── EXEMPLO_ITEM_ORCAMENTO (JSON completo)
│   │
│   ├── scripts/seedTemplates.ts        ⭐ SCRIPT DE SEED
│   │   ├── Conecta no Firestore
│   │   ├── Cria 5 templates iniciais:
│   │   │   1. Sacada KS
│   │   │   2. Janela 4 Folhas
│   │   │   3. Janela 2 Folhas
│   │   │   4. Box Frontal
│   │   │   5. Guarda-Corpo Torre
│   │   ├── Verifica duplicados
│   │   └── Uso: npm run seed:templates
│   │
│   └── EXEMPLO_INTEGRACAO.tsx          ⭐ EXEMPLOS REACT
│       ├── Hook: useTemplatesComEngenharia()
│       ├── Hook: useQuoteItemBuilder()
│       ├── Componente: TemplateSelectorModal
│       ├── Componente: ItemEditor
│       ├── Componente: EngineOverrideModal
│       ├── Componente: ResultadoCalculoView
│       ├── Função: calcularEngenharia()
│       └── Componente: QuoteItemComEngenharia (completo)
│
│
└── ⚙️ CONFIGURAÇÃO
    │
    ├── package.json                    (atualizado)
    │   └── Script: "seed:templates"
    │
    └── FIREBASE_RULES.txt              (existente)
        └── Regras para templates e quotes
```

---

## 🎯 Navegação por Objetivo

### 1. "Quero ENTENDER o sistema"

```
1️⃣ README_GEMEO_DIGITAL.md (visão geral)
     ↓
2️⃣ GEMEO_DIGITAL_SCHEMA.md (conceitos técnicos)
     ↓
3️⃣ ARQUITETURA_VISUAL.md (diagramas)
```

### 2. "Quero IMPLEMENTAR rapidamente"

```
1️⃣ GEMEO_DIGITAL_GUIA_RAPIDO.md (passo a passo)
     ↓
2️⃣ src/types/digitalTwin.ts (veja os tipos)
     ↓
3️⃣ EXEMPLO_INTEGRACAO.tsx (copie componentes)
     ↓
4️⃣ CHECKLIST_IMPLEMENTACAO.md (siga as fases)
```

### 3. "Quero POPULAR o banco de dados"

```
1️⃣ Abra terminal em /dashboard
     ↓
2️⃣ npm install
     ↓
3️⃣ npm run seed:templates
     ↓
4️⃣ Verifique no Firebase Console
```

### 4. "Quero CONVENCER stakeholders"

```
1️⃣ RESUMO_EXECUTIVO.md (apresentação)
     ↓
2️⃣ README_GEMEO_DIGITAL.md (seção Benefícios)
```

### 5. "Quero ARQUITETAR o sistema"

```
1️⃣ GEMEO_DIGITAL_SCHEMA.md (estrutura completa)
     ↓
2️⃣ ARQUITETURA_VISUAL.md (diagramas)
     ↓
3️⃣ src/types/digitalTwin.ts (tipos e interfaces)
```

---

## 📊 Matriz de Arquivos

| Arquivo | Tamanho | Público-Alvo | Propósito | Prioridade |
|---------|---------|--------------|-----------|-----------|
| **INDICE_ARQUIVOS.md** | Pequeno | Todos | Navegação | 🟢 Leia primeiro |
| **RESUMO_EXECUTIVO.md** | Médio | Stakeholders | Decisão | 🔴 Crítico |
| **README_GEMEO_DIGITAL.md** | Médio | Todos | Visão geral | 🔴 Crítico |
| **GEMEO_DIGITAL_GUIA_RAPIDO.md** | Grande | Devs | Implementação | 🔴 Crítico |
| **GEMEO_DIGITAL_SCHEMA.md** | Grande | Arquitetos | Referência | 🟡 Importante |
| **ARQUITETURA_VISUAL.md** | Grande | Arquitetos | Diagramas | 🟡 Importante |
| **CHECKLIST_IMPLEMENTACAO.md** | Grande | Devs | Progresso | 🟡 Importante |
| **src/types/digitalTwin.ts** | Grande | Devs | Código | 🔴 Crítico |
| **scripts/seedTemplates.ts** | Médio | Devs | Setup | 🟡 Importante |
| **EXEMPLO_INTEGRACAO.tsx** | Grande | Devs | Exemplos | 🟡 Importante |

---

## 🔍 Busca Rápida

### Preciso de informação sobre...

#### "Como funciona a engine de cálculo?"
→ **ARQUITETURA_VISUAL.md** (seção "Algoritmo de Cálculo")

#### "Quais templates estão disponíveis?"
→ **README_GEMEO_DIGITAL.md** (seção "Exemplos de Templates")

#### "Como criar um novo template?"
→ **GEMEO_DIGITAL_SCHEMA.md** (seção "Template")  
→ **scripts/seedTemplates.ts** (veja exemplo de código)

#### "Como funciona o override?"
→ **GEMEO_DIGITAL_SCHEMA.md** (seção "Override de Regras")  
→ **EXEMPLO_INTEGRACAO.tsx** (componente `EngineOverrideModal`)

#### "Qual a estrutura do banco de dados?"
→ **GEMEO_DIGITAL_SCHEMA.md** (seção "Estrutura das Coleções")  
→ **ARQUITETURA_VISUAL.md** (seção "Estrutura do Firestore")

#### "Como calcular materiais?"
→ **EXEMPLO_INTEGRACAO.tsx** (função `calcularEngenharia()`)  
→ **ARQUITETURA_VISUAL.md** (pseudocódigo completo)

#### "Como implementar na UI?"
→ **EXEMPLO_INTEGRACAO.tsx** (todos os componentes)  
→ **CHECKLIST_IMPLEMENTACAO.md** (Fase 3-5)

#### "Quanto tempo vai levar?"
→ **RESUMO_EXECUTIVO.md** (seção "Próximas Etapas")  
→ **CHECKLIST_IMPLEMENTACAO.md** (estimativas)

#### "Qual o retorno do investimento?"
→ **RESUMO_EXECUTIVO.md** (seção "ROI Esperado")

---

## 📝 Resumo de Cada Arquivo

### 📊 RESUMO_EXECUTIVO.md
**Para quem:** Gerentes, Stakeholders, Decisores  
**Tempo de leitura:** 10 minutos  
**Conteúdo:** Resumo executivo não técnico com benefícios, ROI, próximos passos e recomendação.

### 🔷 README_GEMEO_DIGITAL.md
**Para quem:** Todos (entrada principal)  
**Tempo de leitura:** 15 minutos  
**Conteúdo:** Visão geral completa do sistema, como começar, exemplos de templates, FAQ.

### 🚀 GEMEO_DIGITAL_GUIA_RAPIDO.md
**Para quem:** Desenvolvedores (implementação)  
**Tempo de leitura:** 20 minutos  
**Conteúdo:** Guia prático passo a passo, como instalar, popular, implementar, testar.

### 📖 GEMEO_DIGITAL_SCHEMA.md
**Para quem:** Arquitetos, Tech Leads (referência técnica)  
**Tempo de leitura:** 30 minutos  
**Conteúdo:** Documentação técnica completa, estrutura do Firestore, fluxo de dados, validações.

### 🏗️ ARQUITETURA_VISUAL.md
**Para quem:** Arquitetos, Tech Leads (visual)  
**Tempo de leitura:** 25 minutos  
**Conteúdo:** Diagramas ASCII completos, fluxo visual, pseudocódigo do algoritmo.

### ✅ CHECKLIST_IMPLEMENTACAO.md
**Para quem:** Desenvolvedores (gerenciamento)  
**Tempo de leitura:** 15 minutos (+ uso contínuo)  
**Conteúdo:** Checklist de 10 fases, tarefas detalhadas, progresso visual.

### 💻 src/types/digitalTwin.ts
**Para quem:** Desenvolvedores (código)  
**Tempo de leitura:** 20 minutos  
**Conteúdo:** Todas as interfaces TypeScript, exemplos JSON completos, documentação inline.

### 🔧 scripts/seedTemplates.ts
**Para quem:** Desenvolvedores (setup)  
**Tempo de leitura:** 10 minutos  
**Conteúdo:** Script para popular Firestore com 5 templates iniciais.

### 🎨 EXEMPLO_INTEGRACAO.tsx
**Para quem:** Desenvolvedores (exemplos)  
**Tempo de leitura:** 30 minutos  
**Conteúdo:** 8 componentes React completos, hooks, funções, prontos para copiar.

### 📑 INDICE_ARQUIVOS.md
**Para quem:** Todos (navegação)  
**Tempo de leitura:** 5 minutos  
**Conteúdo:** Este arquivo - índice de navegação entre documentos.

---

## 🎓 Roteiro de Aprendizagem

### Para Desenvolvedores Junior:

```
Dia 1: Entendimento
├── 1h: README_GEMEO_DIGITAL.md
├── 1h: GEMEO_DIGITAL_GUIA_RAPIDO.md
└── 30min: src/types/digitalTwin.ts (ler comentários)

Dia 2: Prática
├── 30min: npm install + npm run seed:templates
├── 1h: Ver templates no Firebase Console
├── 1h: EXEMPLO_INTEGRACAO.tsx (estudar componentes)
└── 30min: Testar buscar templates no código

Dia 3+: Implementação
└── Seguir CHECKLIST_IMPLEMENTACAO.md fase por fase
```

### Para Tech Leads:

```
Etapa 1: Visão Técnica (2h)
├── 30min: RESUMO_EXECUTIVO.md
├── 45min: GEMEO_DIGITAL_SCHEMA.md
├── 30min: ARQUITETURA_VISUAL.md
└── 15min: src/types/digitalTwin.ts

Etapa 2: Planejamento (1h)
├── 30min: CHECKLIST_IMPLEMENTACAO.md
└── 30min: Estimar recursos e timeline

Etapa 3: Decisão
└── Aprovar ou solicitar ajustes
```

### Para Stakeholders:

```
Leitura Única (30min)
├── 15min: RESUMO_EXECUTIVO.md
├── 10min: README_GEMEO_DIGITAL.md (seção Benefícios)
└── 5min: Dúvidas com Tech Lead
```

---

## 🚀 Início Rápido

Se você tem **5 minutos**, leia:
- **README_GEMEO_DIGITAL.md** (seção "Como Começar")

Se você tem **15 minutos**, leia:
- **GEMEO_DIGITAL_GUIA_RAPIDO.md** (seções 1-3)

Se você tem **30 minutos**, leia:
- **README_GEMEO_DIGITAL.md** (completo)
- Execute: `npm run seed:templates`

Se você tem **1 hora**, leia:
- **GEMEO_DIGITAL_GUIA_RAPIDO.md** (completo)
- **src/types/digitalTwin.ts** (veja exemplos JSON)
- **EXEMPLO_INTEGRACAO.tsx** (componentes principais)

Se você tem **1 dia**, leia:
- **Todos os arquivos** nesta ordem:
  1. README_GEMEO_DIGITAL.md
  2. GEMEO_DIGITAL_GUIA_RAPIDO.md
  3. GEMEO_DIGITAL_SCHEMA.md
  4. src/types/digitalTwin.ts
  5. EXEMPLO_INTEGRACAO.tsx
  6. ARQUITETURA_VISUAL.md
  7. CHECKLIST_IMPLEMENTACAO.md

---

## 📞 Precisa de Ajuda?

**Não encontrou o que procura?**

1. Use o **Ctrl+F** neste arquivo para buscar palavras-chave
2. Consulte a seção **"Busca Rápida"** acima
3. Leia o **README_GEMEO_DIGITAL.md** (seção FAQ)
4. Entre em contato: suporte@gestorvitreo.com

---

## ✅ Checklist Pessoal

Use este checklist para acompanhar sua jornada:

### Leitura:
- [ ] Li o INDICE_ARQUIVOS.md (este arquivo)
- [ ] Li o README_GEMEO_DIGITAL.md
- [ ] Li o arquivo específico do meu papel:
  - [ ] RESUMO_EXECUTIVO.md (stakeholder)
  - [ ] GEMEO_DIGITAL_GUIA_RAPIDO.md (desenvolvedor)
  - [ ] GEMEO_DIGITAL_SCHEMA.md (arquiteto)

### Setup:
- [ ] Instalei dependências (`npm install`)
- [ ] Executei seed (`npm run seed:templates`)
- [ ] Verifiquei templates no Firebase Console

### Implementação:
- [ ] Estudei exemplos em EXEMPLO_INTEGRACAO.tsx
- [ ] Comecei a seguir CHECKLIST_IMPLEMENTACAO.md
- [ ] Implementei pelo menos 1 componente

---

**Última atualização:** 18/01/2026  
**Versão do índice:** 1.0.0  
**Total de arquivos documentados:** 10 arquivos

🎉 **Boa sorte na implementação!**

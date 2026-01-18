# 🏗️ Arquitetura Visual - Sistema de Gêmeo Digital

**Diagrama Completo da Estrutura e Fluxo de Dados**

---

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SISTEMA GÊMEO DIGITAL                              │
│                   Simulador de Engenharia para Vidraçaria                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
         ┌──────────▼──────────┐          ┌──────────▼──────────┐
         │   CAMADA DE DADOS   │          │   CAMADA DE LÓGICA  │
         │    (Firestore)      │          │    (Engine)         │
         └──────────┬──────────┘          └──────────┬──────────┘
                    │                                 │
         ┌──────────▼──────────┐          ┌──────────▼──────────┐
         │  Coleção templates  │          │  engineCalculator   │
         │  Coleção quotes     │          │  Validações         │
         └─────────────────────┘          │  Cálculos           │
                                          └──────────┬──────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │   CAMADA DE UI      │
                                          │    (React)          │
                                          └─────────────────────┘
                                          │  TemplateSelector   │
                                          │  ItemEditor         │
                                          │  ResultadoView      │
                                          └─────────────────────┘
```

---

## 🗄️ Estrutura do Firestore

```
Firestore Database
│
├── 📁 templates/                        ← Templates Master (Configurações Globais)
│   │
│   ├── 📄 [template_id_1]
│   │   ├── name: "Sacada KS"
│   │   ├── category: "Envidraçamento"
│   │   ├── imageUrl: "https://..."
│   │   ├── active: true
│   │   ├── tags: ["sacada", "ks"]
│   │   ├── createdAt: Timestamp
│   │   │
│   │   └── 🎯 engine_config:           ← NOVO CAMPO (Configuração de Engenharia)
│   │       ├── engine_id: "sacada_ks"
│   │       ├── engine_name: "Sacada KS - Sistema de Empilhamento"
│   │       ├── engine_version: "1.0.0"
│   │       │
│   │       ├── 📐 regras_fisicas:
│   │       │   ├── tem_pivo: true
│   │       │   ├── numero_folhas: 6
│   │       │   ├── tipo_movimento: "empilhavel"
│   │       │   ├── folgas:
│   │       │   │   ├── padrao: 15 (mm)
│   │       │   │   ├── lateral: 20 (mm)
│   │       │   │   ├── superior: 15 (mm)
│   │       │   │   ├── inferior: 15 (mm)
│   │       │   │   └── empilhamento: 40 (mm)
│   │       │   ├── espessuras_vidro_permitidas: [6, 8, 10]
│   │       │   ├── espessura_vidro_padrao: 8
│   │       │   ├── dimensoes_minimas: { largura: 1.5, altura: 1.2 }
│   │       │   ├── dimensoes_maximas: { largura: 12.0, altura: 3.0 }
│   │       │   ├── area_maxima_folha: 2.5 (m²)
│   │       │   ├── peso_maximo_folha: 50 (kg)
│   │       │   └── acessorios_obrigatorios: [...]
│   │       │
│   │       ├── 🎨 mapeamento_materiais:
│   │       │   ├── vidro:
│   │       │   │   ├── incolor: { nome: "Incolor", hex: "#E8F4F8", opacity: 0.3 }
│   │       │   │   ├── verde: { nome: "Verde", hex: "#C8E6C9", opacity: 0.4 }
│   │       │   │   └── ...
│   │       │   └── perfil:
│   │       │       ├── branco: { nome: "Branco", hex: "#FFFFFF", acabamento: "fosco" }
│   │       │       └── ...
│   │       │
│   │       └── metadata: { ultima_atualizacao, autor, notas }
│   │
│   ├── 📄 [template_id_2]
│   │   └── ... (Janela 4 Folhas)
│   │
│   └── 📄 [template_id_3]
│       └── ... (Box Frontal)
│
│
├── 📁 quotes/                           ← Orçamentos dos Usuários
│   │
│   └── 📄 [quote_id_1]
│       ├── companyId: "company_123"
│       ├── clientId: "client_456"
│       ├── clientName: "João Silva"
│       ├── subtotal: 5513.00
│       ├── discount: 0
│       ├── total: 5513.00
│       ├── status: "draft"
│       ├── createdAt: Timestamp
│       │
│       └── 📋 items: [                  ← Array de Itens do Orçamento
│           {
│             // --- Campos Básicos ---
│             serviceId: "template_sacada_ks_001",
│             serviceName: "Sacada KS - Envidraçamento 8 Folhas",
│             quantity: 1,
│             unitPrice: 0,
│             total: 5513.00,
│             
│             // --- Configuração de Preço ---
│             pricingMethod: "m2",
│             dimensions: {
│               width: 6.5,
│               height: 2.4,
│               area: 15.6
│             },
│             
│             // --- Seleções Visuais ---
│             glassColor: "incolor",
│             glassThickness: "8mm",
│             profileColor: "branco",
│             templateId: "template_sacada_ks",
│             imageUrl: "https://...",
│             
│             // --- 📸 SNAPSHOT da Configuração ---
│             engine_config_snapshot: {
│               engine_id: "sacada_ks",
│               regras_fisicas: { ... },      ← Cópia do template
│               mapeamento_materiais: { ... }
│             },
│             
│             // --- ⚙️ OVERRIDES Específicos deste Projeto ---
│             engine_overrides: {
│               regras_fisicas: {
│                 folgas: { padrao: 10 },      ← Mudou de 15mm → 10mm
│                 numero_folhas: 8             ← Mudou de 6 → 8 folhas
│               },
│               motivo_override: "Cliente solicitou mais folhas e vedação justa"
│             },
│             
│             // --- 📊 RESULTADO DO CÁLCULO ---
│             resultado_calculo: {
│               status: "calculated",
│               calculado_em: Timestamp,
│               dimensoes_calculadas: {
│                 largura_total: 6.5,
│                 altura_total: 2.4,
│                 area_total: 15.6,
│                 folhas: [
│                   { numero: 1, largura: 0.8125, altura: 2.37, area: 1.926, peso: 36.8 },
│                   { numero: 2, largura: 0.8125, altura: 2.37, area: 1.926, peso: 36.8 },
│                   // ... 8 folhas total
│                 ]
│               },
│               lista_materiais: [
│                 { tipo: "vidro", descricao: "Vidro Temperado Incolor 8mm", 
│                   quantidade: 15.6, unidade: "m2", preco_unitario: 180.00, 
│                   subtotal: 2808.00 },
│                 { tipo: "perfil", descricao: "Perfil Trilho Superior KS", 
│                   quantidade: 6.5, unidade: "m", preco_unitario: 120.00, 
│                   subtotal: 780.00 },
│                 { tipo: "acessorio", descricao: "Roldana", 
│                   quantidade: 32, unidade: "un", preco_unitario: 15.00, 
│                   subtotal: 480.00 },
│                 // ... mais materiais
│               ],
│               validacoes: [
│                 { tipo: "info", mensagem: "Projeto calculado com sucesso" },
│                 { tipo: "aviso", mensagem: "Folga customizada de 10mm" }
│               ]
│             },
│             
│             // --- Flag de Controle ---
│             usar_engenharia: true
│           }
│         ]
│
└── ... (outras coleções: clients, companies, etc)
```

---

## 🔄 Fluxo Completo de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 1: MASTER CONFIGURA TEMPLATE                                         │
└─────────────────────────────────────────────────────────────────────────────┘

    [Admin/Master] 
         │
         │ 1. Acessa painel de templates
         │
         ▼
    ┌─────────────────┐
    │ TemplateManager │
    │  (React)        │
    └────────┬────────┘
             │
             │ 2. Cria/edita template
             │
             ▼
    ┌─────────────────┐
    │   Firestore     │
    │   templates/    │────► engine_config:
    │   [id]          │          ├── regras_fisicas
    └─────────────────┘          └── mapeamento_materiais


┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 2: USUÁRIO SELECIONA TEMPLATE                                        │
└─────────────────────────────────────────────────────────────────────────────┘

    [Usuário]
         │
         │ 1. Cria novo orçamento
         │
         ▼
    ┌──────────────────┐
    │   QuoteNew.tsx   │
    └────────┬─────────┘
             │
             │ 2. Clica "Adicionar Item com Engenharia"
             │
             ▼
    ┌────────────────────────┐
    │ TemplateSelectorModal  │
    │  (Exibe templates)     │
    └───────────┬────────────┘
                │
                │ 3. Busca templates no Firestore
                │
                ▼
    ┌─────────────────────┐
    │  useTemplatesComEng │
    │  (Custom Hook)      │
    └──────────┬──────────┘
               │
               │ 4. Query: templates com engine_config
               │
               ▼
    ┌─────────────────┐
    │   Firestore     │
    │   templates/    │────► Retorna lista
    └─────────────────┘
               │
               │ 5. Usuário seleciona template
               │
               ▼
    ┌──────────────────┐
    │  criarItemDeTemp │
    │  (Function)      │
    └────────┬─────────┘
             │
             │ 6. Cria OrcamentoItem:
             │    ├── engine_config_snapshot ← CÓPIA do template
             │    ├── usar_engenharia: true
             │    └── dimensions: vazio (usuário preencherá)
             │
             ▼
    [Item adicionado ao orçamento]


┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 3: USUÁRIO PREENCHE DADOS DO PROJETO                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    [Usuário]
         │
         │ 1. Visualiza item no ItemEditor
         │
         ▼
    ┌──────────────────┐
    │  ItemEditor.tsx  │
    │  ┌────────────┐  │
    │  │ Largura: _ │  │◄───── Input numérico
    │  │ Altura:  _ │  │◄───── Input numérico
    │  ├────────────┤  │
    │  │ Cor Vidro  │  │◄───── Select (baseado em mapeamento_materiais)
    │  │ Cor Perfil │  │◄───── Select (baseado em mapeamento_materiais)
    │  └────────────┘  │
    └────────┬─────────┘
             │
             │ 2. Validações em tempo real:
             │    ✓ Largura >= dimensoes_minimas.largura?
             │    ✓ Altura <= dimensoes_maximas.altura?
             │    ✗ Exibe erros se fora dos limites
             │
             │ 3. Usuário clica "Calcular Materiais"
             │
             ▼
    [Dispara cálculo de engenharia]


┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 4: ENGINE CALCULA MATERIAIS                                          │
└─────────────────────────────────────────────────────────────────────────────┘

    [handleCalcular(item)]
         │
         │ 1. Chama engine
         │
         ▼
    ┌──────────────────────┐
    │ calcularItem(item)   │
    │  (engineCalculator)  │
    └──────────┬───────────┘
               │
               │ 2. Extrai dados:
               │    config = item.engine_config_snapshot
               │    overrides = item.engine_overrides
               │
               ▼
    ┌──────────────────────┐
    │ Mesclar Config       │
    │  regras = {          │
    │    ...config,        │
    │    ...overrides      │
    │  }                   │
    └──────────┬───────────┘
               │
               │ 3. Validações
               │
               ▼
    ┌──────────────────────┐
    │ validarDimensoes()   │
    │  ✓ Min/Max OK?       │
    │  ✓ Área OK?          │
    │  ✓ Peso OK?          │
    └──────────┬───────────┘
               │
               │ 4. Cálculo de Folhas
               │
               ▼
    ┌──────────────────────┐
    │ calcularDivisaoFolhas│
    │  larguraFolha =      │
    │   largura / N_folhas │
    └──────────┬───────────┘
               │
               │ 5. Aplicar Folgas
               │
               ▼
    ┌──────────────────────┐
    │ aplicarFolgas()      │
    │  larguraVidro =      │
    │   largura - folgas   │
    │  alturaVidro =       │
    │   altura - folgas    │
    └──────────┬───────────┘
               │
               │ 6. Calcular Área
               │
               ▼
    ┌──────────────────────┐
    │ calcularAreaVidro()  │
    │  area =              │
    │   larguraVidro *     │
    │   alturaVidro *      │
    │   numero_folhas      │
    └──────────┬───────────┘
               │
               │ 7. Calcular Materiais
               │
               ▼
    ┌──────────────────────┐
    │ calcularMateriais()  │
    │  ┌─────────────────┐ │
    │  │ VIDRO:          │ │
    │  │ • área m²       │ │
    │  │ • espessura     │ │
    │  │ • peso          │ │
    │  ├─────────────────┤ │
    │  │ PERFIS:         │ │
    │  │ • metros lineares│ │
    │  │ • tipo          │ │
    │  ├─────────────────┤ │
    │  │ ACESSÓRIOS:     │ │
    │  │ • quantidade    │ │
    │  │ • tipo          │ │
    │  └─────────────────┘ │
    └──────────┬───────────┘
               │
               │ 8. Aplicar Preços
               │
               ▼
    ┌──────────────────────┐
    │ calcularCustos()     │
    │  VIDRO: 15.6m² * R$  │
    │         180/m² =     │
    │         R$ 2.808     │
    │  PERFIS: 6.5m * R$   │
    │         120/m =      │
    │         R$ 780       │
    │  ... (soma total)    │
    └──────────┬───────────┘
               │
               │ 9. Montar Resultado
               │
               ▼
    ┌──────────────────────┐
    │ ResultadoCalculo     │
    │  {                   │
    │    status: "calc",   │
    │    dimensoes: {...}, │
    │    materiais: [...], │
    │    validacoes: [...]│
    │  }                   │
    └──────────┬───────────┘
               │
               │ 10. Retornar item atualizado
               │
               ▼
    [item.resultado_calculo = resultado]
    [item.total = sum(materiais)]


┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 5: EXIBIR RESULTADO                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    [Item atualizado]
         │
         │ 1. UI detecta mudança
         │
         ▼
    ┌──────────────────────┐
    │ ResultadoCalculoView │
    │  ┌────────────────┐  │
    │  │ DIMENSÕES      │  │
    │  │ 6.5m × 2.4m    │  │
    │  │ 15.6 m²        │  │
    │  ├────────────────┤  │
    │  │ FOLHAS         │  │
    │  │ • Folha 1:     │  │
    │  │   0.8125 × 2.37│  │
    │  │   ~36.8 kg     │  │
    │  │ • Folha 2...   │  │
    │  ├────────────────┤  │
    │  │ MATERIAIS      │  │
    │  │ ┌────────────┐ │  │
    │  │ │ Vidro      │ │  │
    │  │ │ Perfis     │ │  │
    │  │ │ Acessórios │ │  │
    │  │ └────────────┘ │  │
    │  │ TOTAL: R$5.513 │  │
    │  └────────────────┘  │
    └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 6 (OPCIONAL): USUÁRIO CUSTOMIZA REGRAS                               │
└─────────────────────────────────────────────────────────────────────────────┘

    [Usuário]
         │
         │ 1. Clica "⚙️ Configurações Avançadas"
         │
         ▼
    ┌──────────────────────┐
    │ EngineOverrideModal  │
    │  ┌────────────────┐  │
    │  │ Folga: 15mm →  │  │◄─── Usuário muda para 10mm
    │  │        10mm    │  │
    │  ├────────────────┤  │
    │  │ N° Folhas: 6 → │  │◄─── Usuário muda para 8
    │  │            8   │  │
    │  ├────────────────┤  │
    │  │ Motivo:        │  │◄─── Textarea
    │  │ "Cliente..."   │  │
    │  └────────────────┘  │
    └──────────┬───────────┘
               │
               │ 2. Salva override
               │
               ▼
    [item.engine_overrides = { ... }]
         │
         │ 3. Recalcula com novas regras
         │
         ▼
    [Volta para ETAPA 4]


┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 7: SALVAR ORÇAMENTO                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    [Usuário clica "Salvar Orçamento"]
         │
         │
         ▼
    ┌──────────────────┐
    │  QuoteNew.tsx    │
    │  handleSave()    │
    └────────┬─────────┘
             │
             │ Prepara documento:
             │ {
             │   companyId,
             │   clientId,
             │   items: [
             │     {
             │       serviceName: "Sacada KS...",
             │       engine_config_snapshot: {...},
             │       engine_overrides: {...},
             │       resultado_calculo: {...},
             │       total: 5513.00,
             │       usar_engenharia: true
             │     }
             │   ],
             │   subtotal: 5513.00,
             │   total: 5513.00,
             │   status: "draft"
             │ }
             │
             ▼
    ┌─────────────────┐
    │   Firestore     │
    │   quotes/       │────► Documento salvo
    │   [quote_id]    │
    └─────────────────┘
```

---

## 🔐 Segurança e Permissões

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FIRESTORE RULES                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

// TEMPLATES: Apenas Master pode editar
match /templates/{templateId} {
  allow read: if isAuthenticated();
  allow write: if isMaster();
}

// QUOTES: Empresas acessam apenas seus próprios
match /quotes/{quoteId} {
  allow read: if true;  // Público para cliente ver link
  allow create: if isAuthenticated() && 
                   hasCompanyId() && 
                   request.resource.data.companyId == getUserCompanyId();
  allow update: if isSameCompany(resource.data);
  allow delete: if isSameCompany(resource.data);
}
```

---

## 📦 Componentes React

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HIERARQUIA DE COMPONENTES                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

App
 └── QuoteNew ───────────────────────────┐
      │                                   │
      ├── Button "Adicionar Item"        │
      │    └── onClick → abre modal      │
      │                                   │
      ├── TemplateSelectorModal ─────────┤
      │    ├── useTemplatesComEngenharia │
      │    ├── Grid de Templates         │
      │    └── onSelect(template)        │
      │                                   │
      ├── ItemEditor ────────────────────┤
      │    ├── Input Largura             │
      │    ├── Input Altura              │
      │    ├── Select Cor Vidro          │
      │    ├── Select Cor Perfil         │
      │    ├── Button "Calcular"         │
      │    │    └── onClick → calcularItem()
      │    │                               │
      │    ├── Button "Config Avançadas" │
      │    │    └── abre override modal  │
      │    │                               │
      │    └── ResultadoCalculoView ─────┤
      │         ├── Card Dimensões       │
      │         ├── Card Materiais       │
      │         └── Lista Validações     │
      │                                   │
      └── EngineOverrideModal ───────────┘
           ├── Inputs de Folgas
           ├── Input N° Folhas
           ├── Textarea Motivo
           └── Button "Aplicar"
```

---

## 🧮 Algoritmo de Cálculo Simplificado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PSEUDOCÓDIGO DO CÁLCULO                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

function calcularItem(item: OrcamentoItem): OrcamentoItem {
  
  // 1. PREPARAÇÃO
  config = item.engine_config_snapshot
  overrides = item.engine_overrides
  regras = merge(config.regras_fisicas, overrides.regras_fisicas)
  
  larguraTotal = item.dimensions.width     // Ex: 6.5m
  alturaTotal = item.dimensions.height     // Ex: 2.4m
  
  
  // 2. VALIDAÇÕES
  if (larguraTotal < regras.dimensoes_minimas.largura) {
    return ERRO("Largura muito pequena")
  }
  if (alturaTotal > regras.dimensoes_maximas.altura) {
    return ERRO("Altura muito grande")
  }
  
  
  // 3. DIVISÃO DE FOLHAS
  numeroFolhas = regras.numero_folhas      // Ex: 8
  larguraFolha = larguraTotal / numeroFolhas
                                            // 6.5 / 8 = 0.8125m
  
  
  // 4. APLICAR FOLGAS
  folgaLateral = regras.folgas.lateral / 1000    // 20mm → 0.02m
  folgaSuperior = regras.folgas.superior / 1000  // 15mm → 0.015m
  folgaInferior = regras.folgas.inferior / 1000  // 15mm → 0.015m
  
  larguraVidro = larguraFolha - (folgaLateral * 2)
                                            // 0.8125 - 0.04 = 0.7725m
  
  alturaVidro = alturaTotal - folgaSuperior - folgaInferior
                                            // 2.4 - 0.015 - 0.015 = 2.37m
  
  
  // 5. CALCULAR ÁREA
  areaFolha = larguraVidro * alturaVidro    // 0.7725 * 2.37 = 1.831m²
  areaTotal = areaFolha * numeroFolhas      // 1.831 * 8 = 14.648m²
  
  
  // 6. CALCULAR PESO
  espessura = regras.espessura_vidro_padrao // 8mm
  pesoFolha = areaFolha * espessura * 2.5   // 1.831 * 8 * 2.5 = 36.6kg
  
  
  // 7. LISTAR MATERIAIS
  materiais = []
  
  // VIDRO
  materiais.push({
    tipo: "vidro",
    descricao: "Vidro Temperado " + item.glassColor + " " + espessura + "mm",
    quantidade: areaTotal,
    unidade: "m2",
    preco_unitario: 180.00,
    subtotal: areaTotal * 180.00
  })
  
  // PERFIS (baseado em acessorios_obrigatorios)
  for (acessorio in regras.acessorios_obrigatorios) {
    quantidade = eval(acessorio.quantidade_formula)
                                            // Ex: "largura_total" → 6.5
                                            // Ex: "numero_folhas * 4" → 32
    
    materiais.push({
      tipo: "perfil" ou "acessorio",
      descricao: acessorio.nome,
      quantidade: quantidade,
      unidade: "m" ou "un",
      preco_unitario: acessorio.preco_unitario,
      subtotal: quantidade * acessorio.preco_unitario
    })
  }
  
  
  // 8. CALCULAR TOTAL
  totalGeral = sum(materiais.map(m => m.subtotal))
  
  
  // 9. RETORNAR RESULTADO
  return {
    ...item,
    resultado_calculo: {
      status: "calculated",
      calculado_em: now(),
      dimensoes_calculadas: {
        largura_total: larguraTotal,
        altura_total: alturaTotal,
        area_total: areaTotal,
        folhas: [
          { numero: 1, largura: larguraVidro, altura: alturaVidro, area: areaFolha, peso: pesoFolha },
          { numero: 2, largura: larguraVidro, altura: alturaVidro, area: areaFolha, peso: pesoFolha },
          // ... (numeroFolhas vezes)
        ]
      },
      lista_materiais: materiais,
      validacoes: []
    },
    total: totalGeral
  }
}
```

---

## 📊 Exemplo Completo de Dados

```json
{
  "companyId": "company_123",
  "clientId": "client_456",
  "clientName": "João Silva",
  "items": [
    {
      "serviceName": "Sacada KS - Envidraçamento 8 Folhas",
      "dimensions": { "width": 6.5, "height": 2.4 },
      "glassColor": "incolor",
      "profileColor": "branco",
      
      "engine_config_snapshot": {
        "engine_id": "sacada_ks",
        "regras_fisicas": {
          "numero_folhas": 6,
          "folgas": { "padrao": 15, "lateral": 20 }
        }
      },
      
      "engine_overrides": {
        "regras_fisicas": {
          "numero_folhas": 8,
          "folgas": { "padrao": 10 }
        },
        "motivo_override": "Cliente solicitou mais folhas"
      },
      
      "resultado_calculo": {
        "status": "calculated",
        "dimensoes_calculadas": {
          "largura_total": 6.5,
          "altura_total": 2.4,
          "folhas": [
            { "numero": 1, "largura": 0.7725, "altura": 2.37, "peso": 36.6 },
            // ... 8 folhas
          ]
        },
        "lista_materiais": [
          { "tipo": "vidro", "descricao": "Vidro Temperado 8mm", 
            "quantidade": 14.648, "preco_unitario": 180, "subtotal": 2636.64 },
          { "tipo": "perfil", "descricao": "Perfil Trilho", 
            "quantidade": 6.5, "preco_unitario": 120, "subtotal": 780 },
          { "tipo": "acessorio", "descricao": "Roldana", 
            "quantidade": 32, "preco_unitario": 15, "subtotal": 480 }
        ]
      },
      
      "total": 3896.64,
      "usar_engenharia": true
    }
  ],
  "subtotal": 3896.64,
  "total": 3896.64,
  "status": "draft"
}
```

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Equipe:** Gestor Vitreo

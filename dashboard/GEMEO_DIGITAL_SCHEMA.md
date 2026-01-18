# 📐 Gêmeo Digital - Schema do Banco de Dados

**Sistema de Simulação de Engenharia para Vidraçaria**

Este documento descreve a estrutura de dados completa do sistema de Gêmeo Digital (Digital Twin) para o Gestor Vitreo, que permite calcular automaticamente dimensões, materiais e custos de projetos de vidraçaria com precisão de engenharia.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Estrutura das Coleções](#-estrutura-das-coleções)
3. [Fluxo de Dados](#-fluxo-de-dados)
4. [Tipos TypeScript](#-tipos-typescript)
5. [Exemplos Práticos](#-exemplos-práticos)
6. [Como Implementar](#-como-implementar)
7. [Validações e Regras](#-validações-e-regras)

---

## 🎯 Visão Geral

O sistema de Gêmeo Digital funciona em 3 camadas:

```
┌─────────────────────────────────────────────────────────┐
│                    TEMPLATES (Master)                    │
│  ┌────────────────────────────────────────────────┐     │
│  │ • Sacada KS                                     │     │
│  │ • Janela 4 Folhas                               │     │
│  │ • Porta Pivotante                               │     │
│  │   ├── engine_config (regras de engenharia)     │     │
│  │   ├── regras_fisicas                            │     │
│  │   └── mapeamento_materiais                      │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          ↓
                    [Usuário cria orçamento]
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 ORÇAMENTO (Quote)                        │
│  ┌────────────────────────────────────────────────┐     │
│  │ Item 1: Sacada KS                               │     │
│  │   ├── engine_config_snapshot (cópia do master) │     │
│  │   ├── engine_overrides (customizações)         │     │
│  │   └── dimensions (largura: 6.5m, altura: 2.4m) │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          ↓
                   [Engine calcula]
                          ↓
┌─────────────────────────────────────────────────────────┐
│              RESULTADO DO CÁLCULO                        │
│  ┌────────────────────────────────────────────────┐     │
│  │ • 8 folhas de 0.8125m x 2.37m                  │     │
│  │ • 15.6m² de vidro temperado 8mm                 │     │
│  │ • 6.5m de perfil trilho                         │     │
│  │ • 32 roldanas, 8 fechos, 1 pivô                │     │
│  │ • Custo total: R$ 5.513,00                      │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura das Coleções

### Coleção: `templates`

**Propósito:** Armazena os templates master de projetos com suas configurações de engenharia.

**Campos Principais:**

```typescript
{
  id: string;                    // ID do Firestore
  name: string;                  // "Sacada KS"
  category: string;              // "Envidraçamento"
  imageUrl: string;              // URL da imagem ilustrativa
  engine_config: {               // ⭐ NOVO CAMPO
    engine_id: EngineId;         // 'sacada_ks'
    engine_name: string;         // Nome descritivo
    engine_version: string;      // '1.0.0'
    regras_fisicas: {...};       // Regras de cálculo
    mapeamento_materiais: {...}; // Cores e texturas
  };
  createdAt: Timestamp;
  active: boolean;
  tags: string[];
}
```

**Acesso:**
- ✅ Leitura: Todos os usuários autenticados
- 🔒 Escrita: Apenas Master (via painel administrativo)

---

### Coleção: `quotes` (Orçamentos)

**Propósito:** Armazena os orçamentos criados pelos usuários.

**Campo modificado:** Array `items[]`

```typescript
{
  // ... campos existentes (clientId, total, status, etc)
  
  items: [
    {
      // --- Campos Existentes (mantidos) ---
      serviceId: string;
      serviceName: string;
      quantity: number;
      unitPrice: number;
      total: number;
      dimensions: { width, height, area };
      glassColor: string;
      profileColor: string;
      
      // --- NOVOS CAMPOS ---
      
      // 1. Snapshot da configuração do template
      engine_config_snapshot?: EngineConfig;
      
      // 2. Customizações específicas deste orçamento
      engine_overrides?: {
        regras_fisicas?: Partial<RegrasFisicas>;
        mapeamento_materiais?: Partial<MapeamentoMateriais>;
        motivo_override?: string;
      };
      
      // 3. Resultado do cálculo
      resultado_calculo?: {
        status: 'pending' | 'calculated' | 'error';
        dimensoes_calculadas: {...};
        lista_materiais: [...];
        validacoes: [...];
      };
      
      // 4. Flag de controle
      usar_engenharia?: boolean; // true = usar engine
    }
  ]
}
```

---

## 🔄 Fluxo de Dados

### 1️⃣ Criação do Template (Master)

```javascript
// Master cria template no painel administrativo
await addDoc(collection(db, 'templates'), {
  name: 'Sacada KS',
  category: 'Envidraçamento',
  imageUrl: 'https://...',
  engine_config: {
    engine_id: 'sacada_ks',
    regras_fisicas: {
      folgas: { padrao: 15, lateral: 20 },
      espessuras_vidro_permitidas: [6, 8, 10],
      dimensoes_minimas: { largura: 1.5, altura: 1.2 },
      // ... outras regras
    },
    mapeamento_materiais: {
      vidro: {
        'incolor': { nome: 'Incolor', hex: '#E8F4F8', opacity: 0.3 }
      }
    }
  }
});
```

### 2️⃣ Usuário Cria Orçamento

```javascript
// 1. Usuário seleciona template na biblioteca
const template = await getDoc(doc(db, 'templates', templateId));

// 2. Cria item do orçamento com snapshot
const item: OrcamentoItem = {
  serviceName: template.name,
  templateId: template.id,
  
  // Snapshot: copia integral da configuração
  engine_config_snapshot: template.engine_config,
  
  // Dados do projeto específico
  dimensions: {
    width: 6.5,  // Cliente informou
    height: 2.4, // Cliente informou
  },
  
  glassColor: 'incolor',
  profileColor: 'branco',
  
  usar_engenharia: true, // Ativa o cálculo
};

// 3. Salva no orçamento
await addDoc(collection(db, 'quotes'), {
  clientId: 'client_123',
  items: [item],
  // ... outros campos
});
```

### 3️⃣ Engine Calcula (Backend/Frontend)

```javascript
// Função que processa o cálculo
async function calcularEngenharia(item: OrcamentoItem) {
  const config = item.engine_config_snapshot;
  const overrides = item.engine_overrides;
  
  // Mescla configuração base com overrides
  const regras = {
    ...config.regras_fisicas,
    ...overrides?.regras_fisicas,
  };
  
  // Calcula número de folhas
  const largura = item.dimensions.width;
  const altura = item.dimensions.height;
  const larguraFolha = largura / regras.numero_folhas;
  
  // Aplica folgas
  const larguraVidro = larguraFolha - (regras.folgas.lateral / 1000);
  const alturaVidro = altura - (regras.folgas.superior / 1000) - (regras.folgas.inferior / 1000);
  
  // Calcula materiais
  const areaVidro = larguraVidro * alturaVidro * regras.numero_folhas;
  const metrosPerfil = largura * 2; // Superior + inferior
  
  // Monta resultado
  const resultado: ResultadoCalculo = {
    status: 'calculated',
    dimensoes_calculadas: {
      largura_total: largura,
      altura_total: altura,
      area_total: areaVidro,
      folhas: [
        // Array com cada folha calculada
      ],
    },
    lista_materiais: [
      {
        tipo: 'vidro',
        descricao: 'Vidro Temperado 8mm',
        quantidade: areaVidro,
        unidade: 'm2',
        preco_unitario: 180.00,
        subtotal: areaVidro * 180.00,
      },
      // ... outros materiais
    ],
    validacoes: [
      // Avisos e erros
    ],
  };
  
  // Atualiza o item no orçamento
  item.resultado_calculo = resultado;
  item.total = resultado.lista_materiais.reduce((sum, m) => sum + m.subtotal, 0);
  
  return item;
}
```

### 4️⃣ Override de Regras (Customização)

```javascript
// Usuário quer mudar a folga padrão de 15mm para 10mm
const itemComOverride = {
  ...item,
  engine_overrides: {
    regras_fisicas: {
      folgas: {
        padrao: 10,     // Mudou
        lateral: 15,    // Manteve
        superior: 10,   // Mudou
        inferior: 10,   // Mudou
      },
    },
    motivo_override: 'Cliente solicitou vedação mais justa',
  },
};

// Recalcula com as novas regras
const itemRecalculado = await calcularEngenharia(itemComOverride);
```

---

## 📘 Tipos TypeScript

**Arquivo:** `src/types/digitalTwin.ts`

Todos os tipos estão definidos em TypeScript com documentação completa:

- ✅ `EngineId` - IDs dos motores disponíveis
- ✅ `RegrasFisicas` - Regras de cálculo (folgas, dimensões, etc)
- ✅ `MapeamentoMateriais` - Cores e texturas para visualização
- ✅ `EngineConfig` - Configuração completa do motor
- ✅ `Template` - Template master com engine_config
- ✅ `OrcamentoItem` - Item do orçamento com snapshot e overrides
- ✅ `ResultadoCalculo` - Resultado do cálculo de engenharia
- ✅ `Orcamento` - Orçamento completo

**Importação:**

```typescript
import {
  Template,
  OrcamentoItem,
  EngineConfig,
  RegrasFisicas,
  ResultadoCalculo,
} from './types/digitalTwin';
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Sacada KS Padrão

```typescript
import { EXEMPLO_SACADA_KS } from './types/digitalTwin';

// Template já configurado com:
// - 6 folhas padrão
// - Folga de 15mm
// - Vidro temperado 6/8/10mm
// - Dimensões: 1.5m-12m largura, 1.2m-3m altura
// - Acessórios: pivô, trilhos, roldanas, fechos
```

**JSON do Template:**

```json
{
  "name": "Sacada KS - Envidraçamento",
  "category": "Envidraçamento",
  "engine_config": {
    "engine_id": "sacada_ks",
    "engine_version": "1.0.0",
    "regras_fisicas": {
      "tem_pivo": true,
      "numero_folhas": 6,
      "tipo_movimento": "empilhavel",
      "folgas": {
        "padrao": 15,
        "lateral": 20,
        "superior": 15,
        "inferior": 15,
        "empilhamento": 40
      },
      "espessuras_vidro_permitidas": [6, 8, 10],
      "espessura_vidro_padrao": 8,
      "dimensoes_minimas": {
        "largura": 1.5,
        "altura": 1.2
      },
      "dimensoes_maximas": {
        "largura": 12.0,
        "altura": 3.0
      }
    },
    "mapeamento_materiais": {
      "vidro": {
        "incolor": { "nome": "Incolor", "hex": "#E8F4F8", "opacity": 0.3 },
        "verde": { "nome": "Verde", "hex": "#C8E6C9", "opacity": 0.4 }
      },
      "perfil": {
        "branco": { "nome": "Branco", "hex": "#FFFFFF", "acabamento": "fosco" },
        "preto": { "nome": "Preto", "hex": "#212121", "acabamento": "anodizado" }
      }
    }
  }
}
```

### Exemplo 2: Janela 4 Folhas

```typescript
import { EXEMPLO_JANELA_4_FOLHAS } from './types/digitalTwin';

// Template com:
// - 4 folhas fixas (folhas 1 e 4 fixas, 2 e 3 móveis)
// - Folga de 12mm
// - Vidro temperado/laminado 4/6/8mm
// - Sistema de correr tradicional
```

### Exemplo 3: Item de Orçamento com Cálculo

```typescript
import { EXEMPLO_ITEM_ORCAMENTO_SACADA } from './types/digitalTwin';

// Item já calculado mostrando:
// - 8 folhas de 0.8125m x 2.37m cada
// - 15.6m² de vidro total
// - Lista completa de materiais
// - Custos calculados
// - Validações e avisos
```

---

## 🛠️ Como Implementar

### Passo 1: Popular Templates Iniciais

Execute o script de inicialização para criar os templates:

```bash
cd dashboard
npm run seed:templates
```

Ou manualmente pelo Firestore Console:
1. Acesse Firebase Console → Firestore
2. Crie documentos na coleção `templates`
3. Use os JSONs dos exemplos acima

### Passo 2: Atualizar Interface de Criação de Orçamento

```typescript
// src/pages/QuoteNew.tsx

import { doc, getDoc } from 'firebase/firestore';
import { OrcamentoItem, Template } from '../types/digitalTwin';

async function handleTemplateSelect(templateId: string) {
  // 1. Busca template
  const templateDoc = await getDoc(doc(db, 'templates', templateId));
  const template = templateDoc.data() as Template;
  
  // 2. Cria item com snapshot
  const novoItem: OrcamentoItem = {
    serviceId: template.id,
    serviceName: template.name,
    quantity: 1,
    unitPrice: 0,
    total: 0,
    
    templateId: template.id,
    imageUrl: template.imageUrl,
    
    // Snapshot da configuração
    engine_config_snapshot: template.engine_config,
    
    // Inicia vazio, será preenchido pelo usuário
    dimensions: {
      width: 0,
      height: 0,
    },
    
    usar_engenharia: true,
  };
  
  // 3. Adiciona ao array de itens
  setItems([...items, novoItem]);
}
```

### Passo 3: Implementar Engine de Cálculo

```typescript
// src/services/engineCalculator.ts

import { OrcamentoItem, ResultadoCalculo } from '../types/digitalTwin';

export async function calcularItem(item: OrcamentoItem): Promise<OrcamentoItem> {
  if (!item.usar_engenharia || !item.engine_config_snapshot) {
    return item; // Pula cálculo
  }
  
  const config = item.engine_config_snapshot;
  const overrides = item.engine_overrides || {};
  
  // Mescla regras base com overrides
  const regras = {
    ...config.regras_fisicas,
    ...overrides.regras_fisicas,
  };
  
  try {
    // Validações
    const validacoes = validarDimensoes(item.dimensions, regras);
    if (validacoes.some(v => v.tipo === 'erro')) {
      return {
        ...item,
        resultado_calculo: {
          status: 'error',
          validacoes,
        },
      };
    }
    
    // Cálculos
    const resultado = calcularMateriais(item, regras);
    
    return {
      ...item,
      resultado_calculo: resultado,
      total: resultado.lista_materiais.reduce((sum, m) => sum + m.subtotal, 0),
    };
  } catch (error) {
    console.error('Erro no cálculo:', error);
    return {
      ...item,
      resultado_calculo: {
        status: 'error',
        validacoes: [{
          tipo: 'erro',
          mensagem: error.message,
        }],
      },
    };
  }
}
```

### Passo 4: UI de Override (Customização)

```typescript
// Componente para editar overrides
function EngineOverrideModal({ item, onChange }) {
  const [folgas, setFolgas] = useState(
    item.engine_overrides?.regras_fisicas?.folgas || 
    item.engine_config_snapshot?.regras_fisicas?.folgas
  );
  
  return (
    <div>
      <h3>Customizar Regras de Engenharia</h3>
      
      <Input
        label="Folga Padrão (mm)"
        type="number"
        value={folgas.padrao}
        onChange={(e) => setFolgas({ ...folgas, padrao: +e.target.value })}
      />
      
      <Input
        label="Folga Lateral (mm)"
        type="number"
        value={folgas.lateral}
        onChange={(e) => setFolgas({ ...folgas, lateral: +e.target.value })}
      />
      
      <Button onClick={() => {
        onChange({
          ...item,
          engine_overrides: {
            regras_fisicas: { folgas },
            motivo_override: 'Ajuste manual do usuário',
          },
        });
      }}>
        Aplicar Customização
      </Button>
    </div>
  );
}
```

---

## ✅ Validações e Regras

### Validações Automáticas

A engine deve validar:

1. **Dimensões Mínimas/Máximas**
   ```typescript
   if (largura < regras.dimensoes_minimas.largura) {
     return erro('Largura mínima: ' + regras.dimensoes_minimas.largura + 'm');
   }
   ```

2. **Área Máxima por Folha**
   ```typescript
   const areaFolha = larguraFolha * altura;
   if (areaFolha > regras.area_maxima_folha) {
     return aviso('Folha muito grande. Considere adicionar mais folhas.');
   }
   ```

3. **Espessura de Vidro**
   ```typescript
   if (!regras.espessuras_vidro_permitidas.includes(espessura)) {
     return erro('Espessura não permitida para este sistema');
   }
   ```

4. **Cálculo de Peso**
   ```typescript
   // Vidro temperado: ~2.5 kg/m² por mm de espessura
   const peso = areaFolha * espessura * 2.5;
   if (peso > regras.peso_maximo_folha) {
     return erro('Folha muito pesada. Reduza dimensões ou espessura.');
   }
   ```

### Firestore Rules

Adicione regras de segurança:

```javascript
// firestore.rules

// Templates: apenas Master pode editar
match /templates/{templateId} {
  allow read: if isAuthenticated();
  allow write: if isMaster();
}

// Orçamentos: empresas veem apenas os seus
match /quotes/{quoteId} {
  allow read, write: if isSameCompany(resource.data);
}
```

---

## 🎨 Próximos Passos

1. ✅ **Definir Schema** (Este documento)
2. ⏳ **Implementar Engine de Cálculo** (Backend/Frontend)
3. ⏳ **UI de Seleção de Templates** (Modal com biblioteca visual)
4. ⏳ **UI de Override** (Customização de regras)
5. ⏳ **Renderização 3D** (Canvas para visualizar projeto)
6. ⏳ **Relatório de Materiais** (PDF detalhado)

---

## 📞 Suporte

Dúvidas sobre a estrutura? Entre em contato:
- 📧 Email: suporte@gestorvitreo.com
- 📖 Documentação: [docs.gestorvitreo.com](https://docs.gestorvitreo.com)

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Autor:** Equipe Gestor Vitreo

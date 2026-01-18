# ✅ Entrega Fase 2 - Materiais e Motores de Renderização

**Status:** COMPLETO ✅  
**Data de Entrega:** 18 de Janeiro de 2026  
**Equipe:** Desenvolvimento Gestor Vitreo

---

## 📦 O Que Foi Criado

Esta fase adiciona **2 sistemas essenciais** ao Gêmeo Digital:
1. **Sistema de Cores Realistas** (Materiais)
2. **Arquitetura de Motores de Renderização** (Engines)

---

## 🎨 PARTE 1: Sistema de Cores Realistas

### Arquivo Criado: `src/constants/materiais.js`

**Tamanho:** 16.8 KB  
**Linhas:** ~540 linhas

### 📦 Conteúdo:

#### **16 Tipos de Vidro** (com rgba + transparência + blur)

##### Transparentes (2):
- ✅ **Incolor** - Azulado claro (rgba 230,245,250 @ 15%)
- ✅ **Extra Clear** - Super transparente

##### Coloridos (6):
- ✅ **Fumê** - Cinza escuro translúcido
- ✅ **Fumê Extra** - Quase preto quando empilha
- ✅ **Verde** - Tom esverdeado clássico
- ✅ **Bronze** - Marrom translúcido
- ✅ **Bronze Refletivo** - Com película
- ✅ **Azul** - Azul translúcido

##### Jateados/Foscos (3) - **COM BLUR**:
- ✅ **Jateado Incolor** - `blur(8px)`
- ✅ **Jateado Branco** - `blur(10px)`
- ✅ **Acidato** - `blur(12px)`

##### Especiais (2):
- ✅ **Preto** - Opaco com reflexo
- ✅ **Espelhado** - Efeito espelho

#### **15 Tipos de Alumínio** (com gradientes lineares)

##### Naturais (3):
- ✅ **Natural Fosco** - Gradiente de cinzas claros
- ✅ **Natural Brilhante** - Alto brilho
- ✅ **Anodizado Natural** - Cinza médio

##### Pretos (3):
- ✅ **Preto Fosco** - Cinza chumbo até quase preto
- ✅ **Preto Brilhante** - Alto brilho
- ✅ **Preto Anodizado** - Cinza chumbo anodizado

##### Brancos (2):
- ✅ **Branco Fosco** - Branco com leve cinza nas bordas
- ✅ **Branco Brilhante** - Branco puro com alto brilho

##### Metálicos (4):
- ✅ **Bronze** - Marrom metálico
- ✅ **Champagne** - Bege dourado
- ✅ **Dourado** - Dourado metálico
- ✅ **Prata Metálico** - Prata com reflexos
- ✅ **Cobre** - Tom de cobre

##### Cinzas (1):
- ✅ **Grafite** - Cinza escuro metálico

### 🛠️ Funcionalidades:

```javascript
// Buscar cor por ID
const corVidro = getCorVidro('fume');
const corAluminio = getCorAluminio('bronze');

// Buscar por categoria
const vidrosTransparentes = getVidrosPorCategoria('transparente');
const aluminiosMetalicos = getAluminiosPorCategoria('metalico');

// Todas as cores
const todasCoresVidro = getTodasCoresVidro();
const todasCoresAluminio = getTodasCoresAluminio();
```

### 📊 Categorias para Menus:

```javascript
CATEGORIAS_VIDRO = [
  { id: 'transparente', nome: 'Transparentes', icon: '💎' },
  { id: 'colorido', nome: 'Coloridos', icon: '🎨' },
  { id: 'jateado', nome: 'Jateados/Foscos', icon: '❄️' },
  { id: 'refletivo', nome: 'Refletivos', icon: '✨' },
  { id: 'especial', nome: 'Especiais', icon: '⭐' },
];

CATEGORIAS_ALUMINIO = [
  { id: 'natural', nome: 'Naturais', icon: '⚪' },
  { id: 'preto', nome: 'Pretos', icon: '⚫' },
  { id: 'branco', nome: 'Brancos', icon: '🤍' },
  { id: 'metalico', nome: 'Metálicos', icon: '🥇' },
  { id: 'cinza', nome: 'Cinzas', icon: '🩶' },
];
```

### 💡 Como Usar:

```jsx
import { CORES_VIDRO, CORES_ALUMINIO } from './constants/materiais';

// Renderizar vidro
const cor = CORES_VIDRO['fume'];
<div style={{
  background: cor.reflexo || cor.cor,
  border: `2px solid ${cor.borda}`,
  backdropFilter: cor.blur,  // Para jateados!
  opacity: cor.opacity,
}}>
  Vidro Fumê
</div>

// Renderizar perfil
const cor = CORES_ALUMINIO['preto_anodizado'];
<div style={{
  background: cor.gradiente,  // Gradiente linear!
  boxShadow: `0 2px 4px ${cor.sombra}`,
}}>
  Perfil Preto Anodizado
</div>
```

---

## ⚙️ PARTE 2: Arquitetura de Motores de Renderização

### Arquivos Criados:

#### 1. `src/engines/types.ts`
**Tamanho:** 25.4 KB  
**Linhas:** ~700 linhas

**Conteúdo:**
- ✅ Interface `EngineProps` (props do componente)
- ✅ Interface `EngineRules` (regras do BD)
- ✅ Interface `EngineOutput` (resultado)
- ✅ Interface `EngineState` (estado interno)
- ✅ Interface `EngineComponent` (contrato)
- ✅ Types auxiliares (EngineId, RenderStatus, TipoMovimento, etc)
- ✅ Constantes (DENSIDADE_VIDRO, CONVERSOES, ENGINE_DEFAULTS)
- ✅ Documentação completa de cada variável física

#### 2. `src/engines/EXEMPLO_USO_TIPOS.tsx`
**Tamanho:** 18.7 KB  
**Linhas:** ~600 linhas

**Conteúdo:**
- ✅ Exemplos de props (mínimas e completas)
- ✅ Exemplos de rules (Sacada KS, Janela 4 Folhas)
- ✅ Função de validação completa
- ✅ Função de cálculo de folhas
- ✅ Componente React completo (`EngineRenderer`)
- ✅ Helpers de cálculo (peso, conversões, formatação)

#### 3. `src/engines/README_ENGINES.md`
**Tamanho:** 12.8 KB  
**Tempo de leitura:** 15 min

**Conteúdo:**
- ✅ Visão geral do sistema
- ✅ Estrutura de arquivos
- ✅ Como funciona (4 etapas)
- ✅ Documentação de tipos
- ✅ Como criar um novo motor
- ✅ Exemplos de uso
- ✅ Integração com Gêmeo Digital
- ✅ Fluxo completo visualizado

---

## 📊 Arquitetura do Sistema de Motores

### Fluxo de Dados:

```
┌──────────────────────────────────────────────────────┐
│  USUÁRIO PREENCHE FORMULÁRIO                         │
│  - Largura: 6.5m                                     │
│  - Altura: 2.4m                                      │
│  - Cor vidro: Incolor                                │
│  - Cor perfil: Branco Fosco                          │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│  MOTOR RECEBE EngineProps + EngineRules              │
│                                                      │
│  props = {                                           │
│    largura: 6.5,                                     │
│    altura: 2.4,                                      │
│    cor_vidro_id: 'incolor',                          │
│    cor_perfil_id: 'branco_fosco',                    │
│  }                                                   │
│                                                      │
│  rules = {                                           │
│    folga_padrao: 15,  // mm                          │
│    folga_lateral: 20, // mm                          │
│    largura_minima_folha: 0.5,  // m                  │
│    largura_maxima_folha: 1.0,  // m                  │
│  }                                                   │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│  MOTOR VALIDA                                        │
│  - Largura >= largura_minima? ✓                      │
│  - Altura <= altura_maxima? ✓                        │
│  - Espessura de vidro permitida? ✓                   │
│  - Cores existem? ✓                                  │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│  MOTOR CALCULA FOLHAS                                │
│  1. Largura disponível = 6.5 - (0.02 * 2) = 6.46m   │
│  2. Altura disponível = 2.4 - 0.015 - 0.015 = 2.37m │
│  3. Largura por folha = 6.46 / 8 = 0.8075m          │
│  4. Área por folha = 0.8075 * 2.37 = 1.914m²        │
│  5. Peso por folha = 1.914 * 8 * 2.5 = 38.3kg       │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│  MOTOR RENDERIZA NO CANVAS                           │
│  1. Busca cores: CORES_VIDRO['incolor']             │
│  2. Busca perfis: CORES_ALUMINIO['branco_fosco']    │
│  3. Desenha 8 folhas com as cores                    │
│  4. Aplica reflexos e gradientes                     │
│  5. Adiciona cotas (se solicitado)                   │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│  MOTOR RETORNA EngineOutput                          │
│  {                                                   │
│    status: 'success',                                │
│    folhas: [                                         │
│      { numero: 1, largura: 0.8075, altura: 2.37 },  │
│      { numero: 2, ... },                             │
│      ... 8 folhas                                    │
│    ],                                                │
│    area_total_vidro: 15.3,                           │
│    peso_total_estimado: 306.4,                       │
│    validacoes: [],                                   │
│    projeto_valido: true,                             │
│    imagem_data_url: 'data:image/png;base64,...'     │
│  }                                                   │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Interfaces Principais

### 1. EngineProps (Entrada)

```typescript
interface EngineProps {
  // Dimensões físicas (metros)
  largura: number;
  altura: number;
  profundidade?: number;
  
  // Configuração de folhas
  quantidade_folhas: number;
  espessura_vidro: number;  // mm
  
  // Materiais (IDs do materiais.js)
  cor_vidro_id: string;
  cor_perfil_id: string;
  
  // Visual (opcional)
  vista?: 'frontal' | 'lateral' | '3d';
  exibir_cotas?: boolean;
  zoom?: number;
  
  // Callbacks
  onRenderComplete?: (output: EngineOutput) => void;
  onError?: (error: EngineError) => void;
}
```

### 2. EngineRules (Regras do BD)

```typescript
interface EngineRules {
  // Geometria
  tipo_movimento: 'correr' | 'abrir' | 'empilhavel' | 'fixo';
  tem_pivo: boolean;
  
  // Folgas (mm)
  folga_padrao: number;
  folga_lateral: number;
  folga_superior: number;
  folga_inferior: number;
  fator_empilhamento?: number;  // metros
  
  // Limites de folha
  largura_minima_folha: number;  // metros
  largura_maxima_folha: number;  // metros
  area_maxima_folha: number;     // m²
  peso_maximo_folha: number;     // kg
  
  // Espessuras
  espessuras_vidro_permitidas: number[];
  espessura_vidro_padrao: number;
  
  // Cálculo
  calcular_folhas_automatico: boolean;
  exigir_numero_folhas_par?: boolean;
}
```

### 3. EngineOutput (Saída)

```typescript
interface EngineOutput {
  status: 'success' | 'error' | 'rendering';
  
  // Dimensões calculadas
  largura_efetiva: number;
  altura_efetiva: number;
  area_total_vidro: number;
  peso_total_estimado: number;
  
  // Folhas
  quantidade_folhas: number;
  folhas: FolhaCalculada[];
  
  // Validações
  validacoes: EngineValidacao[];
  projeto_valido: boolean;
  
  // Imagem
  imagem_data_url?: string;  // PNG base64
  svg_string?: string;        // SVG
  
  // Metadados
  engine_id: EngineId;
  props_originais: EngineProps;
  regras_aplicadas: EngineRules;
}
```

---

## 💡 Variáveis Físicas Documentadas

### Folgas (em milímetros):

```typescript
folga_padrao: 15        // Espaço entre vidro e perfil (1.5cm)
folga_lateral: 20       // Espaço nas laterais (2cm cada lado)
folga_superior: 15      // Espaço no topo (1.5cm)
folga_inferior: 15      // Espaço na base (1.5cm)
```

### Empilhamento (em metros):

```typescript
fator_empilhamento: 0.04  // Cada folha ocupa 4cm no eixo Z
                          // quando aberta
                          // Ex: 8 folhas = 8 * 0.04 = 0.32m (32cm)
```

### Sobreposição (em metros):

```typescript
sobreposicao_folhas: 0.05 // Quanto as folhas se sobrepõem
                          // em janelas de correr (5cm)
```

### Limites:

```typescript
largura_minima_folha: 0.5 // Folha não pode ter menos de 50cm
largura_maxima_folha: 1.0 // Folha não pode ter mais de 1m
area_maxima_folha: 2.5    // Folha não pode ter mais de 2.5m²
peso_maximo_folha: 50     // Folha não pode pesar mais de 50kg
```

---

## 🔗 Integração Entre os Sistemas

### materiais.js ↔ types.ts

```typescript
// 1. Usuário seleciona cor
const cor_vidro_id = 'fume';
const cor_perfil_id = 'preto_anodizado';

// 2. Props do motor
const props: EngineProps = {
  cor_vidro_id: cor_vidro_id,      // ← ID do materiais.js
  cor_perfil_id: cor_perfil_id,    // ← ID do materiais.js
  // ...
};

// 3. Motor busca as cores
import { getCorVidro, getCorAluminio } from '../constants/materiais';

const corVidro = getCorVidro(props.cor_vidro_id);
const corPerfil = getCorAluminio(props.cor_perfil_id);

// 4. Motor usa as cores para renderizar
ctx.fillStyle = corVidro.reflexo || corVidro.cor;
ctx.strokeStyle = corPerfil.gradiente;
```

### Gêmeo Digital ↔ Motores

```typescript
// 1. Template do BD (já criado na Fase 1)
const template: Template = {
  engine_config: {
    regras_fisicas: { ... },
    mapeamento_materiais: {
      vidro: {
        'incolor': { ... },  // ← IDs do materiais.js
        'fume': { ... },
      },
      perfil: {
        'branco_fosco': { ... },  // ← IDs do materiais.js
      }
    }
  }
};

// 2. Converter para EngineRules
const rules: EngineRules = {
  tipo_movimento: template.engine_config.regras_fisicas.tipo_movimento,
  folga_padrao: template.engine_config.regras_fisicas.folgas.padrao,
  // ...
};

// 3. Renderizar
<EngineRenderer props={props} rules={rules} />
```

---

## 📈 Benefícios da Arquitetura

### 1. **Separação de Responsabilidades**
- **materiais.js** - Define as cores (visual)
- **types.ts** - Define os contratos (lógica)
- **engines/** - Implementa os motores (renderização)

### 2. **Reutilização**
- Cores definidas uma vez, usadas em todos os motores
- Tipos compartilhados por todos os componentes
- Regras do BD alimentam todos os motores

### 3. **Manutenibilidade**
- Adicionar nova cor: apenas `materiais.js`
- Adicionar novo motor: implementa `EngineComponent`
- Mudar regras: apenas no BD (engine_config)

### 4. **Escalabilidade**
- Fácil adicionar novos motores (Sacada, Janela, Box, etc)
- Fácil adicionar novas cores
- Fácil adicionar novas validações

---

## 📊 Estatísticas da Entrega

| Métrica | Valor |
|---------|-------|
| **Arquivos Criados** | 4 arquivos |
| **Linhas de Código** | ~1.900 linhas |
| **Tipos de Vidro** | 16 tipos |
| **Tipos de Alumínio** | 15 tipos |
| **Interfaces TypeScript** | 10+ interfaces |
| **Documentação** | 1 README completo |
| **Exemplos de Código** | 1 arquivo completo |
| **Tamanho Total** | ~73 KB |

---

## 🎯 Próximos Passos

### Fase 3: Implementar Motores Específicos

1. ⏳ **SacadaKSEngine.tsx**
   - Renderização de 6-12 folhas empilháveis
   - Pivô central
   - Sistema KS completo

2. ⏳ **Janela4FolhasEngine.tsx**
   - 4 folhas (2 fixas, 2 móveis)
   - Sistema de correr
   - Sobreposição de folhas

3. ⏳ **BoxFrontalEngine.tsx**
   - 2 folhas (1 fixa, 1 móvel)
   - Sistema de box
   - Vedação específica

4. ⏳ **GuardaCorpoTorreEngine.tsx**
   - Vidro fixo
   - Torres de inox
   - Grampos de fixação

### Fase 4: Integração Visual

5. ⏳ **Componente de Preview**
   - Exibir imagem renderizada
   - Zoom e pan
   - Exibir dimensões

6. ⏳ **Seletor de Cores**
   - UI para escolher vidro
   - UI para escolher perfil
   - Preview em tempo real

7. ⏳ **Validação Visual**
   - Destacar erros no desenho
   - Mostrar avisos
   - Sugerir correções

---

## ✅ Checklist de Aceitação

### Sistema de Cores:
- [x] 16 tipos de vidro criados
- [x] 15 tipos de alumínio criados
- [x] Todas as cores têm rgba/gradiente
- [x] Vidros jateados têm blur
- [x] Helpers de busca implementados
- [x] Categorias definidas

### Sistema de Motores:
- [x] Interface `EngineProps` definida
- [x] Interface `EngineRules` definida
- [x] Interface `EngineOutput` definida
- [x] Todas as variáveis físicas documentadas
- [x] Constantes (DENSIDADE, CONVERSOES) criadas
- [x] Exemplos completos criados
- [x] README documentado

### Integração:
- [x] materiais.js ↔ types.ts conectados
- [x] Gêmeo Digital ↔ Motores mapeado
- [x] Fluxo de dados documentado

---

## 🎉 Conclusão

A **Fase 2** foi concluída com sucesso!

**Entregue:**
- ✅ Sistema completo de cores realistas
- ✅ Arquitetura sólida de motores
- ✅ Documentação detalhada
- ✅ Exemplos práticos

**Próximo Marco:**
- 🎯 Fase 3: Implementar motores específicos

**Recomendação:**
- ✅ **Aprovar e seguir para Fase 3**

---

**Preparado por:** Equipe de Desenvolvimento  
**Data de Entrega:** 18 de Janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ COMPLETO

---

🎉 **Sistema de Materiais e Motores - Pronto para Implementação!**

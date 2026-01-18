# 🎨 Sistema de Motores de Renderização

**Arquitetura Universal para Desenho de Esquadrias**

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Estrutura de Arquivos](#-estrutura-de-arquivos)
3. [Como Funciona](#-como-funciona)
4. [Tipos e Interfaces](#-tipos-e-interfaces)
5. [Como Criar um Novo Motor](#-como-criar-um-novo-motor)
6. [Exemplos de Uso](#-exemplos-de-uso)
7. [Integração com Gêmeo Digital](#-integração-com-gêmeo-digital)

---

## 🎯 Visão Geral

O sistema de motores de renderização é responsável por **desenhar visualmente** os projetos de vidraçaria calculados pelo sistema de Gêmeo Digital.

### Principais Características:

- ✅ **Arquitetura Universal** - Todos os motores seguem o mesmo contrato
- ✅ **Cores Realistas** - Integrado com `materiais.js`
- ✅ **Cálculos Físicos** - Aplica folgas, limites e validações
- ✅ **Múltiplas Vistas** - Frontal, lateral, superior, 3D
- ✅ **Exportação** - PNG (data URL) e SVG

### Fluxo Básico:

```
Props (usuário) + Rules (BD)
         ↓
    [Validação]
         ↓
  [Cálculo de Folhas]
         ↓
   [Renderização]
         ↓
      Output
```

---

## 📂 Estrutura de Arquivos

```
src/engines/
│
├── types.ts                    ← Tipos e interfaces (PRINCIPAL)
│   ├── EngineProps             // Props do componente
│   ├── EngineRules             // Regras do banco de dados
│   ├── EngineOutput            // Resultado da renderização
│   ├── EngineState             // Estado interno
│   └── Helpers e Constantes
│
├── EXEMPLO_USO_TIPOS.tsx       ← Exemplos práticos
│   ├── Exemplos de props
│   ├── Exemplos de rules
│   ├── Componente React completo
│   └── Helpers de cálculo
│
├── README_ENGINES.md           ← Este arquivo
│
└── [Futuros motores]
    ├── SacadaKSEngine.tsx
    ├── Janela4FolhasEngine.tsx
    ├── BoxFrontalEngine.tsx
    └── ...
```

---

## 🔧 Como Funciona

### 1. Props do Componente (EngineProps)

Props que o **usuário** fornece ou que vêm do **formulário**:

```typescript
const props: EngineProps = {
  largura: 6.5,              // Metros
  altura: 2.4,               // Metros
  quantidade_folhas: 8,      // Número de folhas
  espessura_vidro: 8,        // Milímetros
  cor_vidro_id: 'incolor',   // ID do materiais.js
  cor_perfil_id: 'branco_fosco', // ID do materiais.js
};
```

### 2. Regras do Motor (EngineRules)

Regras que vêm do **banco de dados** (engine_config):

```typescript
const rules: EngineRules = {
  tipo_movimento: 'empilhavel',
  tem_pivo: true,
  
  // Folgas (em mm)
  folga_padrao: 15,
  folga_lateral: 20,
  folga_superior: 15,
  folga_inferior: 15,
  fator_empilhamento: 0.04,  // 4cm por folha
  
  // Limites
  largura_minima_folha: 0.5, // 50cm
  largura_maxima_folha: 1.0, // 1m
  area_maxima_folha: 2.5,    // 2.5m²
  peso_maximo_folha: 50,     // 50kg
  
  // Cálculo automático
  calcular_folhas_automatico: true,
  exigir_numero_folhas_par: true,
};
```

### 3. Processamento

```typescript
// 1. Validar entradas
const validacoes = validar(props, rules);

// 2. Calcular folhas
const folhas = calcularFolhas(props, rules);

// 3. Renderizar no canvas
renderizarCanvas(canvas, folhas, props, rules);

// 4. Gerar output
const output: EngineOutput = {
  status: 'success',
  folhas: folhas,
  area_total_vidro: 15.6,
  peso_total_estimado: 294.3,
  validacoes: validacoes,
  imagem_data_url: canvas.toDataURL(),
  // ...
};
```

### 4. Resultado (EngineOutput)

```typescript
{
  status: 'success',
  largura_efetiva: 6.5,
  altura_efetiva: 2.4,
  area_total_vidro: 15.6,
  peso_total_estimado: 294.3,
  quantidade_folhas: 8,
  folhas: [
    { numero: 1, largura: 0.8125, altura: 2.37, area: 1.926, peso: 36.8 },
    { numero: 2, largura: 0.8125, altura: 2.37, area: 1.926, peso: 36.8 },
    // ... 8 folhas
  ],
  validacoes: [
    { tipo: 'info', mensagem: 'Projeto válido' }
  ],
  projeto_valido: true,
  imagem_data_url: 'data:image/png;base64,...',
}
```

---

## 📘 Tipos e Interfaces

### EngineProps

Propriedades que o motor recebe:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `largura` | number | Largura total (metros) |
| `altura` | number | Altura total (metros) |
| `quantidade_folhas` | number | Número de folhas |
| `espessura_vidro` | number | Espessura do vidro (mm) |
| `cor_vidro_id` | string | ID da cor (materiais.js) |
| `cor_perfil_id` | string | ID da cor (materiais.js) |
| `vista` | VistaRenderizacao | Opcional: frontal, lateral, 3d |
| `exibir_cotas` | boolean | Opcional: exibir dimensões |

### EngineRules

Regras de engenharia do BD:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tipo_movimento` | TipoMovimento | correr, abrir, empilhavel, etc |
| `tem_pivo` | boolean | Se tem pivô central |
| `folga_padrao` | number | Folga padrão (mm) |
| `folga_lateral` | number | Folga lateral (mm) |
| `fator_empilhamento` | number | Espaço quando empilha (m) |
| `largura_minima_folha` | number | Largura mínima (m) |
| `area_maxima_folha` | number | Área máxima (m²) |
| `peso_maximo_folha` | number | Peso máximo (kg) |

### EngineOutput

Resultado da renderização:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | RenderStatus | success, error, rendering |
| `folhas` | FolhaCalculada[] | Array de folhas |
| `area_total_vidro` | number | Área total (m²) |
| `peso_total_estimado` | number | Peso total (kg) |
| `validacoes` | EngineValidacao[] | Erros/avisos |
| `projeto_valido` | boolean | Se passou nas validações |
| `imagem_data_url` | string | PNG em base64 |

### Variáveis Físicas Explicadas

```typescript
// FOLGAS (em milímetros)
folga_padrao: 15        // Espaço entre vidro e perfil
folga_lateral: 20       // Espaço nas laterais (parede/marco)
folga_superior: 15      // Espaço no topo
folga_inferior: 15      // Espaço na base

// EMPILHAMENTO (em metros)
fator_empilhamento: 0.04  // Quanto cada folha ocupa no eixo Z
                          // quando aberta (4cm por folha)
                          // Ex: 8 folhas = 8 * 0.04 = 0.32m (32cm)

// SOBREPOSIÇÃO (em metros)
sobreposicao_folhas: 0.05 // Quanto as folhas se sobrepõem
                          // em janelas de correr (5cm)

// LIMITES DE FOLHA
largura_minima_folha: 0.5 // Folha não pode ter menos de 50cm
largura_maxima_folha: 1.0 // Folha não pode ter mais de 1m
area_maxima_folha: 2.5    // Folha não pode ter mais de 2.5m²
peso_maximo_folha: 50     // Folha não pode pesar mais de 50kg
```

---

## 🆕 Como Criar um Novo Motor

### Passo 1: Criar o Componente

```typescript
// src/engines/MeuMotorEngine.tsx

import React, { useRef, useEffect } from 'react';
import { EngineProps, EngineRules, EngineOutput } from './types';
import { getCorVidro, getCorAluminio } from '../constants/materiais';

interface MeuMotorEngineProps {
  props: EngineProps;
  rules: EngineRules;
  onComplete?: (output: EngineOutput) => void;
}

export const MeuMotorEngine: React.FC<MeuMotorEngineProps> = ({
  props,
  rules,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    renderizar();
  }, [props, rules]);
  
  const renderizar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 1. Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Buscar cores
    const corVidro = getCorVidro(props.cor_vidro_id);
    const corPerfil = getCorAluminio(props.cor_perfil_id);
    
    // 3. Calcular dimensões
    const larguraDisponivel = props.largura - (rules.folga_lateral * 2 / 1000);
    const alturaDisponivel = props.altura - 
      (rules.folga_superior / 1000) - 
      (rules.folga_inferior / 1000);
    
    // 4. Desenhar
    if (corVidro && corPerfil) {
      // Desenhar vidro
      ctx.fillStyle = corVidro.cor;
      ctx.fillRect(100, 100, larguraDisponivel * 100, alturaDisponivel * 100);
      
      // Desenhar perfil
      ctx.strokeStyle = corPerfil.cor_base;
      ctx.lineWidth = rules.espessura_linha_perfil || 2;
      ctx.strokeRect(100, 100, larguraDisponivel * 100, alturaDisponivel * 100);
    }
    
    // 5. Gerar output
    const output: EngineOutput = {
      status: 'success',
      timestamp: new Date(),
      largura_efetiva: larguraDisponivel,
      altura_efetiva: alturaDisponivel,
      area_total_vidro: larguraDisponivel * alturaDisponivel,
      peso_total_estimado: 0, // Calcular
      quantidade_folhas: props.quantidade_folhas,
      folhas: [],
      validacoes: [],
      projeto_valido: true,
      imagem_data_url: canvas.toDataURL(),
      engine_id: 'meu_motor',
      engine_version: '1.0.0',
      props_originais: props,
      regras_aplicadas: rules,
    };
    
    onComplete?.(output);
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={props.canvas_largura || 800}
      height={props.canvas_altura || 600}
    />
  );
};
```

### Passo 2: Usar o Motor

```typescript
import { MeuMotorEngine } from './engines/MeuMotorEngine';

function MeuComponente() {
  const [output, setOutput] = useState<EngineOutput | null>(null);
  
  return (
    <div>
      <MeuMotorEngine
        props={{
          largura: 6.5,
          altura: 2.4,
          quantidade_folhas: 8,
          espessura_vidro: 8,
          cor_vidro_id: 'incolor',
          cor_perfil_id: 'branco_fosco',
        }}
        rules={minhasRegras}
        onComplete={(output) => {
          setOutput(output);
          console.log('Renderizado!', output);
        }}
      />
      
      {output && (
        <div>
          <p>Área: {output.area_total_vidro.toFixed(2)} m²</p>
          <img src={output.imagem_data_url} alt="Projeto" />
        </div>
      )}
    </div>
  );
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Renderizar com Props Mínimas

```typescript
<EngineRenderer
  props={{
    largura: 6.5,
    altura: 2.4,
    quantidade_folhas: 8,
    espessura_vidro: 8,
    cor_vidro_id: 'incolor',
    cor_perfil_id: 'branco_fosco',
  }}
  rules={regrasSacadaKS}
/>
```

### Exemplo 2: Com Callbacks

```typescript
<EngineRenderer
  props={minhasProps}
  rules={minhasRegras}
  onRenderComplete={(output) => {
    console.log('Concluído!', output);
    salvarImagem(output.imagem_data_url);
  }}
  onError={(error) => {
    console.error('Erro:', error);
    alert(error.mensagem);
  }}
  onRenderProgress={(progress) => {
    console.log(`${progress}%`);
  }}
/>
```

### Exemplo 3: Validação Manual

```typescript
import { validarEntradas } from './engines/EXEMPLO_USO_TIPOS';

const validacoes = validarEntradas(props, rules);
const temErros = validacoes.some(v => v.tipo === 'erro');

if (temErros) {
  console.error('Erros encontrados:', validacoes);
  validacoes.forEach(v => {
    if (v.tipo === 'erro') {
      alert(v.mensagem);
    }
  });
} else {
  // Pode renderizar
  <EngineRenderer props={props} rules={rules} />
}
```

### Exemplo 4: Cálculo de Peso

```typescript
import { calcularPesoVidro } from './engines/EXEMPLO_USO_TIPOS';

const peso = calcularPesoVidro({
  area: 1.926,         // m²
  espessura: 8,        // mm
  tipo: 'temperado',
});

console.log(`Peso: ${peso.toFixed(2)} kg`); // 38.52 kg
```

---

## 🔗 Integração com Gêmeo Digital

O sistema de motores se integra perfeitamente com o Gêmeo Digital:

### 1. Buscar Template do BD

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Template } from '../types/digitalTwin';

const templateDoc = await getDoc(doc(db, 'templates', templateId));
const template = templateDoc.data() as Template;

const engineConfig = template.engine_config;
```

### 2. Converter para Props e Rules

```typescript
const props: EngineProps = {
  largura: userInput.largura,
  altura: userInput.altura,
  quantidade_folhas: engineConfig.regras_fisicas.numero_folhas,
  espessura_vidro: engineConfig.regras_fisicas.espessura_vidro_padrao,
  cor_vidro_id: userInput.cor_vidro,
  cor_perfil_id: userInput.cor_perfil,
};

const rules: EngineRules = {
  tipo_movimento: engineConfig.regras_fisicas.tipo_movimento,
  tem_pivo: engineConfig.regras_fisicas.tem_pivo,
  folga_padrao: engineConfig.regras_fisicas.folgas.padrao,
  folga_lateral: engineConfig.regras_fisicas.folgas.lateral,
  // ... etc
};
```

### 3. Renderizar

```typescript
<EngineRenderer props={props} rules={rules} />
```

### 4. Salvar Output no Orçamento

```typescript
const output = await renderizar(props, rules);

const orcamentoItem = {
  serviceName: template.name,
  engine_config_snapshot: template.engine_config,
  resultado_calculo: {
    dimensoes_calculadas: {
      folhas: output.folhas,
      area_total: output.area_total_vidro,
    },
    lista_materiais: [...],
    validacoes: output.validacoes,
  },
  total: calcularTotal(output),
  imagem_preview: output.imagem_data_url,
};
```

---

## 🧮 Helpers de Cálculo

### Conversões

```typescript
import { CONVERSOES } from './engines/types';

// Milímetros para metros
const metros = 150 * CONVERSOES.MM_PARA_M; // 0.15m

// Metros para milímetros
const mm = 1.5 * CONVERSOES.M_PARA_MM; // 1500mm
```

### Densidades de Vidro

```typescript
import { DENSIDADE_VIDRO } from './engines/types';

// Peso de 1m² de vidro 8mm temperado
const peso = 1 * 8 * DENSIDADE_VIDRO.temperado; // 20kg
```

### Defaults

```typescript
import { ENGINE_DEFAULTS } from './engines/types';

const canvasLargura = ENGINE_DEFAULTS.canvas_largura; // 800
const zoom = ENGINE_DEFAULTS.zoom; // 1
```

---

## 📊 Fluxo Completo de Integração

```
┌─────────────────────────────────────────────────────────┐
│  1. USUÁRIO SELECIONA TEMPLATE                          │
│  "Sacada KS"                                            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  2. BUSCA engine_config DO FIRESTORE                    │
│  template.engine_config.regras_fisicas                  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  3. USUÁRIO PREENCHE FORMULÁRIO                         │
│  Largura: 6.5m, Altura: 2.4m, Cor: Incolor             │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  4. MONTA EngineProps + EngineRules                     │
│  props = { largura: 6.5, ... }                          │
│  rules = { folga_padrao: 15, ... }                      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  5. CHAMA MOTOR DE RENDERIZAÇÃO                         │
│  <EngineRenderer props={props} rules={rules} />         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  6. MOTOR PROCESSA                                      │
│  - Valida                                               │
│  - Calcula folhas                                       │
│  - Renderiza no canvas                                  │
│  - Gera output                                          │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  7. EXIBE RESULTADO                                     │
│  - Imagem do projeto                                    │
│  - Dimensões calculadas                                 │
│  - Lista de materiais                                   │
│  - Total: R$ 5.513,00                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 Conclusão

O sistema de motores de renderização fornece uma **arquitetura sólida e padronizada** para desenhar qualquer tipo de esquadria.

### Próximos Passos:

1. ✅ Tipos definidos (`types.ts`)
2. ✅ Exemplos criados (`EXEMPLO_USO_TIPOS.tsx`)
3. ⏳ Implementar motores específicos:
   - `SacadaKSEngine.tsx`
   - `Janela4FolhasEngine.tsx`
   - `BoxFrontalEngine.tsx`
4. ⏳ Integrar com Gêmeo Digital
5. ⏳ Adicionar testes

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Mantido por:** Equipe Gestor Vitreo

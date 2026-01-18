# 📸 Studio Mode - Gerador de Thumbnails

**Ferramenta Interna de Geração de Imagens**  
**Rota:** `/admin/studio`  
**Acesso:** Apenas Admin Master

---

## 🎯 O Que É?

O **Studio Mode** é uma ferramenta interna que gera automaticamente thumbnails (miniaturas) dos templates de vidraçaria **sem precisar de designer ou Canva**.

### Como Funciona:

```
1. Renderiza os motores de engenharia em modo "static"
2. Remove controles e interações
3. Ajusta zoom para 400x300px
4. Fundo branco puro
5. Você clica com botão direito → "Salvar imagem"
6. Usa como thumbnail no Template Manager
```

**Resultado:** Catálogo completo de imagens profissionais em segundos!

---

## 📁 Arquivos Criados

### 1. **`src/components/RenderizadorUniversal.tsx`**
**Linhas:** ~400 linhas  
**Descrição:** Componente universal que renderiza qualquer tipo de projeto

#### Funcionalidades:
- ✅ Renderiza Sacada KS (folhas empilháveis com pivô)
- ✅ Renderiza Janela de Correr (folhas alternadas)
- ✅ Renderiza Box Frontal (1 fixa + 1 móvel)
- ✅ Renderiza Guarda-Corpo (vidro fixo com torres)
- ✅ Renderização genérica (fallback)
- ✅ Suporta 2 modos: `interactive` e `static`

#### Props:
```typescript
interface RenderizadorUniversalProps {
  config: {
    engine_id: string;
    regras_fisicas: any;
    mapeamento_materiais?: any;
  };
  props: EngineProps;
  mode?: 'interactive' | 'static';  // ← MODO
  width?: number;                    // ← Largura canvas
  height?: number;                   // ← Altura canvas
  onRenderComplete?: (output) => void;
}
```

#### Modo Static vs Interactive:

| Característica | Interactive | Static |
|----------------|-------------|--------|
| **Fundo** | Cinza claro (#F8F9FA) | Branco puro (#FFFFFF) |
| **Controles** | Exibidos | Escondidos |
| **Cotas** | Exibidas (se solicitado) | Escondidas |
| **Loading** | Exibido | Escondido |
| **Margem** | 40px | 20px |
| **Zoom** | Ajustável | Fixo (cabe perfeitamente) |

---

### 2. **`src/pages/admin/StudioPage.tsx`**
**Linhas:** ~400 linhas  
**Descrição:** Página do Studio Mode com catálogo de 13 configurações

#### Catálogo Hardcoded:

**3 Sacadas KS:**
- 8 folhas (6.5m x 2.4m) - Incolor + Branco Fosco
- 10 folhas (8.0m x 2.6m) - Fumê + Preto Anodizado
- 6 folhas (5.0m x 2.2m) - Verde + Bronze

**3 Janelas de Correr:**
- 4 folhas (2.0m x 1.5m) - Incolor + Branco Fosco
- 2 folhas (1.2m x 1.2m) - Fumê + Preto Fosco
- 6 folhas (3.6m x 1.8m) - Verde + Natural Fosco

**2 Boxes:**
- Box Frontal (1.2m x 1.9m) - Incolor + Natural Brilhante
- Box Frontal (1.4m x 2.0m) - Fumê + Preto Brilhante

**2 Guarda-Corpos:**
- Torre Inox (3.0m x 1.1m) - Incolor 10mm
- Torre Inox (4.0m x 1.15m) - Fumê 10mm

**2 Vidros Fixos:**
- Extra Clear (2.5m x 2.8m) - 10mm
- Bronze (3.0m x 2.5m) - 8mm

**Total:** 13 configurações pré-definidas

---

## 🎨 Interface do Studio Mode

### Layout da Página:

```
┌─────────────────────────────────────────────────────┐
│  🎨 Studio Mode                        13           │
│  Gerador de Thumbnails Automático    Configurações │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ℹ️ Como Usar:                                      │
│  1. Visualize todas as configurações...            │
│  2. Clique em "Baixar PNG"...                      │
│  3. Use como thumbnail...                          │
└─────────────────────────────────────────────────────┘

┌───────────────┬───────────────┬───────────────┐
│ [Card 1]      │ [Card 2]      │ [Card 3]      │
│ Sacada KS     │ Sacada KS     │ Sacada KS     │
│ 8 Folhas      │ 10 Folhas     │ 6 Folhas      │
│               │               │               │
│ [Canvas]      │ [Canvas]      │ [Canvas]      │
│ 400x300px     │ 400x300px     │ 400x300px     │
│               │               │               │
│ 6.5m x 2.4m   │ 8.0m x 2.6m   │ 5.0m x 2.2m   │
│ Folhas: 8     │ Folhas: 10    │ Folhas: 6     │
│               │               │               │
│ [Baixar PNG]  │ [Baixar PNG]  │ [Baixar PNG]  │
│ [Copiar ID]   │ [Copiar ID]   │ [Copiar ID]   │
└───────────────┴───────────────┴───────────────┘

... mais 10 cards
```

### Card Individual:

```
┌─────────────────────────────────────────┐
│  Sacada KS 8 Folhas - Incolor          │
│  6.5m x 2.4m, vidro incolor, branco    │
│                                         │
│  ┌───────────────────────────────┐     │
│  │                               │     │
│  │     [Renderização Canvas]     │     │
│  │         400 x 300             │     │
│  │                               │     │
│  └───────────────────────────────┘     │
│                                         │
│  Dimensões:        6.5m x 2.4m         │
│  Folhas:           8                   │
│  Vidro:            incolor             │
│  Perfil:           branco_fosco        │
│                                         │
│  [📥 Baixar PNG]  [📋 ID]              │
│                                         │
│  sacada_ks_8_folhas_incolor            │
└─────────────────────────────────────────┘
```

---

## 🔧 Como Usar

### Passo 1: Acessar Studio Mode

```
1. Faça login como Admin Master
2. Navegue para: http://localhost:5173/admin/studio
3. Aguarde renderização automática (alguns segundos)
```

### Passo 2: Visualizar Thumbnails

```
✅ Todas as 13 configurações renderizadas automaticamente
✅ Cada uma em seu próprio card
✅ Canvas 400x300px, fundo branco
✅ Sem controles, sem ruído visual
```

### Passo 3: Baixar Imagens

**Opção A: Botão "Baixar PNG"**
```
1. Clique no botão "Baixar PNG"
2. Imagem baixada como "sacada_ks_8_folhas_incolor.png"
3. Pronto para usar!
```

**Opção B: Clique Direito**
```
1. Clique com botão direito no canvas
2. "Salvar imagem como..."
3. Escolha nome e local
4. Salvar
```

### Passo 4: Usar no Template Manager

```
1. Acesse Template Manager (/master/templates)
2. Crie novo template
3. Faça upload da imagem baixada do Studio
4. Configure engine_config
5. Salvar
```

---

## 💡 Exemplos de Configuração

### Sacada KS 8 Folhas:

```typescript
{
  id: 'sacada_ks_8_folhas_incolor',
  nome: 'Sacada KS 8 Folhas - Incolor',
  descricao: '6.5m x 2.4m, vidro incolor, perfil branco fosco',
  engine_config: {
    engine_id: 'sacada_ks',
    regras_fisicas: {
      tipo_movimento: 'empilhavel',
      tem_pivo: true,
      folgas: { padrao: 15, lateral: 20, superior: 15, inferior: 15 },
    },
  },
  props: {
    largura: 6.5,
    altura: 2.4,
    quantidade_folhas: 8,
    espessura_vidro: 8,
    cor_vidro_id: 'incolor',
    cor_perfil_id: 'branco_fosco',
  },
}
```

### Janela 4 Folhas:

```typescript
{
  id: 'janela_4_folhas_incolor',
  nome: 'Janela 4 Folhas - Incolor',
  descricao: '2.0m x 1.5m, vidro incolor, perfil branco fosco',
  engine_config: {
    engine_id: 'janela_correr',
    regras_fisicas: {
      tipo_movimento: 'correr',
      tem_pivo: false,
      folgas: { padrao: 12, lateral: 15, superior: 12, inferior: 12 },
    },
  },
  props: {
    largura: 2.0,
    altura: 1.5,
    quantidade_folhas: 4,
    espessura_vidro: 6,
    cor_vidro_id: 'incolor',
    cor_perfil_id: 'branco_fosco',
  },
}
```

---

## 🎨 Como Adicionar Novas Configurações

### Editar `CATALOG` em `StudioPage.tsx`:

```typescript
const CATALOG: CatalogItem[] = [
  // ... configurações existentes
  
  // NOVA CONFIGURAÇÃO
  {
    id: 'minha_nova_config',              // ID único
    nome: 'Meu Novo Projeto',             // Nome exibido
    descricao: 'Descrição curta',         // Descrição
    engine_config: {
      engine_id: 'sacada_ks',             // Tipo de motor
      regras_fisicas: {
        tipo_movimento: 'empilhavel',
        tem_pivo: true,
        folgas: { ... },
      },
    },
    props: {
      largura: 5.0,                       // Largura em metros
      altura: 2.0,                        // Altura em metros
      quantidade_folhas: 6,               // Número de folhas
      espessura_vidro: 8,                 // Espessura em mm
      cor_vidro_id: 'verde',              // ID do materiais.js
      cor_perfil_id: 'bronze',            // ID do materiais.js
    },
  },
];
```

**Salve o arquivo → Recarregue a página → Nova configuração aparece!**

---

## 🔍 Detalhes Técnicos

### Renderização Sacada KS:

```javascript
// 1. Calcula largura de cada folha
const larguraFolha = larguraTotal / numFolhas;

// 2. Para cada folha:
for (let i = 0; i < numFolhas; i++) {
  // Vidro com gradiente (translúcido)
  const gradVidro = ctx.createLinearGradient(...);
  ctx.fillRect(x, y, larguraFolha, altura);
  
  // Perfil (borda)
  ctx.strokeRect(x, y, larguraFolha, altura);
  
  // Linha de divisão
  ctx.moveTo(x + larguraFolha, y);
  ctx.lineTo(x + larguraFolha, y + altura);
}

// 3. Pivô central (se tem_pivo = true)
if (rules.tem_pivo) {
  const pivoX = x + larguraTotal / 2;
  ctx.fillRect(pivoX - 3, y, 6, altura);
}
```

### Renderização Janela de Correr:

```javascript
// Folhas alternadas (trilho)
for (let i = 0; i < numFolhas; i++) {
  const offset = i % 2 === 0 ? 0 : 5;  // Folhas pares e ímpares
  
  // Vidro
  ctx.fillRect(x + offset, y + offset, largura, altura);
  
  // Perfil
  ctx.strokeRect(x + offset, y + offset, largura, altura);
}

// Marco externo
ctx.strokeRect(x - 3, y - 3, larguraTotal + 6, alturaTotal + 6);
```

### Renderização Box Frontal:

```javascript
// Folha 1 (fixa)
ctx.fillRect(x, y, larguraFolha, altura);
ctx.strokeRect(x, y, larguraFolha, altura);

// Folha 2 (móvel, com offset)
ctx.fillRect(x + larguraFolha + 4, y, larguraFolha - 4, altura);
ctx.strokeRect(x + larguraFolha + 4, y, larguraFolha - 4, altura);

// Trilhos (superior e inferior)
ctx.moveTo(x, y - 5);
ctx.lineTo(x + larguraTotal, y - 5);
ctx.moveTo(x, y + altura + 5);
ctx.lineTo(x + larguraTotal, y + altura + 5);
```

---

## 📊 Integração com Template Manager

### Fluxo Completo:

```
1. STUDIO MODE
   ↓
   Gera thumbnail PNG (400x300)
   ↓
2. TEMPLATE MANAGER
   ↓
   Admin faz upload da imagem
   ↓
   Admin configura engine_config (JSON)
   ↓
   Salva template no Firestore
   ↓
3. QUOTE NEW (Futuro)
   ↓
   Usuário seleciona template
   ↓
   Sistema detecta engine_config
   ↓
   Renderiza preview interativo
   ↓
   Calcula dimensões/materiais
   ↓
   Salva no orçamento
```

---

## 🎯 Casos de Uso

### Caso 1: Catálogo Inicial
```
Problema: Preciso de 50 imagens de templates para o catálogo
Solução: 
1. Adicione 50 configurações no CATALOG
2. Acesse Studio Mode
3. Baixe todas as 50 imagens em minutos
4. Use no Template Manager
```

### Caso 2: Teste de Cores
```
Problema: Quero ver como fica sacada com vidro verde + perfil bronze
Solução:
1. Adicione configuração no CATALOG
2. Renderização instantânea
3. Se gostar, baixe e use no template
```

### Caso 3: Variações de Produto
```
Problema: Preciso de sacada KS em 3 tamanhos diferentes
Solução:
1. Crie 3 configs: 6 folhas, 8 folhas, 10 folhas
2. Todas renderizadas simultaneamente
3. Baixe as 3 imagens
4. Crie 3 templates no manager
```

---

## ✅ Checklist de Uso

### Primeira Vez:
- [ ] Acessar `/admin/studio`
- [ ] Verificar se todas as 13 configs renderizaram
- [ ] Testar botão "Baixar PNG"
- [ ] Testar botão "Copiar ID"
- [ ] Verificar qualidade das imagens (400x300)

### Adicionar Nova Config:
- [ ] Abrir `StudioPage.tsx`
- [ ] Adicionar objeto ao array `CATALOG`
- [ ] Definir `id`, `nome`, `descricao`
- [ ] Configurar `engine_config` e `props`
- [ ] Salvar arquivo
- [ ] Recarregar página
- [ ] Verificar renderização
- [ ] Baixar imagem
- [ ] Usar no Template Manager

### Manutenção:
- [ ] Remover configs não utilizadas
- [ ] Atualizar cores se mudarem no materiais.js
- [ ] Ajustar dimensões se necessário
- [ ] Testar em diferentes navegadores

---

## 🚀 Próximas Melhorias

### Fase 5: Funcionalidades Avançadas

1. ⏳ **Botão "Baixar Todas"**
   - Baixa todas as 13 imagens de uma vez
   - Compactadas em um ZIP
   - Nomes automáticos

2. ⏳ **Editor de Configuração**
   - UI para editar configs sem código
   - Formulário com largura, altura, cores
   - Preview em tempo real

3. ⏳ **Importar/Exportar Catálogo**
   - Exportar CATALOG como JSON
   - Importar configs de outros projetos
   - Compartilhar entre equipes

4. ⏳ **Presets de Cores**
   - Gerar automaticamente 5 variações de cor
   - Ex: Sacada KS → Incolor, Fumê, Verde, Bronze, Azul
   - Multiplicar catálogo rapidamente

5. ⏳ **Upload Direto para Template**
   - Botão "Criar Template com Esta Config"
   - Abre Template Manager com dados preenchidos
   - Apenas confirmar e salvar

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── RenderizadorUniversal.tsx  ← Componente de renderização
│
├── pages/
│   └── admin/
│       └── StudioPage.tsx         ← Página Studio Mode
│
├── engines/
│   └── types.ts                   ← Tipos (já existe)
│
├── constants/
│   └── materiais.js               ← Cores (já existe)
│
└── ...

dashboard/
└── GUIA_STUDIO_MODE.md            ← Este arquivo
```

---

## 🎉 Conclusão

O **Studio Mode** é uma ferramenta poderosa que economiza horas de trabalho de design!

### Benefícios:

✅ **Gera thumbnails automaticamente** (sem Canva, sem designer)  
✅ **13 configurações pré-definidas** (sacadas, janelas, boxes, guarda-corpos)  
✅ **Fácil adicionar novas configs** (editar array CATALOG)  
✅ **Fundo branco limpo** (modo static)  
✅ **Tamanho padrão 400x300px** (perfeito para thumbnails)  
✅ **Download instantâneo** (PNG de alta qualidade)  
✅ **Integração com Template Manager** (upload direto)  

### Próximos Passos:

1. ✅ Acessar `/admin/studio`
2. ✅ Baixar todas as imagens
3. ✅ Usar no Template Manager
4. ⏳ Adicionar mais configurações conforme necessário

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Mantido por:** Equipe Gestor Vitreo

---

📸 **Studio Mode - Catálogo Completo em Minutos!**

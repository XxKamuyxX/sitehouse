# 🔷 Sistema de Gêmeo Digital - Gestor Vitreo

**Simulador de Engenharia para Cálculo Automático de Projetos de Vidraçaria**

---

## 📖 Sobre o Sistema

O **Gêmeo Digital** é um sistema inteligente que permite calcular automaticamente as dimensões, materiais e custos de projetos de vidraçaria com precisão de engenharia.

### ✨ Principais Funcionalidades

- 🎯 **Cálculo Automático de Materiais**
  - Vidros (área, peso, espessura)
  - Perfis de alumínio (metros lineares)
  - Acessórios (roldanas, fechos, puxadores)

- 📐 **Divisão Inteligente de Folhas**
  - Calcula número ideal de folhas baseado em dimensões
  - Aplica folgas técnicas automaticamente
  - Valida limites de peso e área

- 🎨 **Mapeamento Visual**
  - Cores de vidro (incolor, verde, fumê, bronze)
  - Acabamentos de perfil (branco, preto, natural, bronze)
  - Renderização 3D (futuro)

- ⚙️ **Customização por Projeto**
  - Override de regras de engenharia
  - Ajuste de folgas específicas
  - Número de folhas personalizável

---

## 📂 Arquivos Criados

### 1. **Tipos TypeScript** (`src/types/digitalTwin.ts`)
**Descrição:** Definições completas de tipos e interfaces do sistema.

**Conteúdo:**
- ✅ Interface `Template` - Template master com engine_config
- ✅ Interface `EngineConfig` - Configuração do motor de engenharia
- ✅ Interface `RegrasFisicas` - Regras de cálculo (folgas, dimensões, etc)
- ✅ Interface `MapeamentoMateriais` - Cores e texturas para visualização
- ✅ Interface `OrcamentoItem` - Item do orçamento com snapshot e overrides
- ✅ Interface `ResultadoCalculo` - Resultado do cálculo de engenharia
- ✅ Interface `Orcamento` - Orçamento completo
- ✅ Exemplos JSON: `EXEMPLO_SACADA_KS`, `EXEMPLO_JANELA_4_FOLHAS`

**Uso:**
```typescript
import { Template, OrcamentoItem, EngineConfig } from './types/digitalTwin';
```

---

### 2. **Documentação Completa** (`GEMEO_DIGITAL_SCHEMA.md`)
**Descrição:** Documentação técnica detalhada do sistema.

**Conteúdo:**
- 📋 Visão geral e arquitetura
- 🗄️ Estrutura das coleções Firestore
- 🔄 Fluxo de dados (Template → Orçamento → Cálculo)
- 💡 Exemplos práticos de uso
- 🛠️ Guia de implementação
- ✅ Validações e regras de negócio

**Quando usar:** Para entender como o sistema funciona internamente.

---

### 3. **Guia Rápido** (`GEMEO_DIGITAL_GUIA_RAPIDO.md`)
**Descrição:** Guia prático e objetivo para começar a usar.

**Conteúdo:**
- 📦 O que foi criado
- 🎯 Como usar (passo a passo)
- 🛠️ Próximas etapas de implementação
- 📚 Referências de tipos e funções
- 🧪 Testes manuais
- ❓ Perguntas frequentes
- 🐛 Troubleshooting

**Quando usar:** Para implementar rapidamente ou resolver problemas.

---

### 4. **Script de Seed** (`scripts/seedTemplates.ts`)
**Descrição:** Script para popular o Firestore com templates iniciais.

**Conteúdo:**
- ✅ 5 templates pré-configurados:
  1. Sacada KS (6 folhas, sistema empilhável)
  2. Janela 4 Folhas de Correr
  3. Janela 2 Folhas de Correr
  4. Box de Banheiro Frontal
  5. Guarda-Corpo Sistema Torre

**Como executar:**
```bash
npm run seed:templates
```

**Resultado:** Templates criados no Firestore com `engine_config` completo.

---

### 5. **Exemplos de Integração** (`EXEMPLO_INTEGRACAO.tsx`)
**Descrição:** Componentes React de exemplo prontos para copiar.

**Conteúdo:**
- 🔧 Hook `useTemplatesComEngenharia()` - Busca templates
- 🎨 `TemplateSelectorModal` - Modal de seleção
- 📝 `ItemEditor` - Editor de dimensões e cores
- ⚙️ `EngineOverrideModal` - Modal de customização
- 📊 `ResultadoCalculoView` - Exibição de resultados
- 🧮 Função `calcularEngenharia()` - Exemplo de cálculo
- 🔗 `QuoteItemComEngenharia` - Integração completa

**Como usar:** Copie os componentes para o projeto real e adapte conforme necessário.

---

### 6. **Checklist de Implementação** (`CHECKLIST_IMPLEMENTACAO.md`)
**Descrição:** Checklist detalhado de todas as tarefas de implementação.

**Conteúdo:**
- ✅ Fase 0: Preparação (CONCLUÍDA)
- 📦 Fase 1: Setup Inicial
- 🔧 Fase 2: Engine de Cálculo
- 🎨 Fase 3: UI de Seleção
- ⚙️ Fase 4: UI de Override
- 📊 Fase 5: Exibição de Resultados
- 🎨 Fase 6: Visualização 3D (Opcional)
- 📄 Fase 7: Integração com PDF
- 🧪 Fase 8: Testes
- 📱 Fase 9: Responsividade e UX
- 🚀 Fase 10: Deploy e Monitoramento

**Quando usar:** Para acompanhar o progresso da implementação.

---

### 7. **README Gêmeo Digital** (`README_GEMEO_DIGITAL.md`) - Este arquivo
**Descrição:** Índice executivo de toda a documentação.

---

## 🚀 Como Começar

### Passo 1: Instalar Dependências

```bash
cd dashboard
npm install
```

Isso instalará:
- `tsx` - Executar TypeScript
- `@types/node` - Tipos do Node.js
- `dotenv` - Variáveis de ambiente

### Passo 2: Popular Templates

```bash
npm run seed:templates
```

**Saída esperada:**
```
🌱 Iniciando seed de templates com configuração de engenharia...

✅ Criado: "Sacada KS - Envidraçamento" (ID: abc123)
✅ Criado: "Janela 4 Folhas de Correr" (ID: def456)
...

📊 Resumo:
   ✅ Templates criados: 5
   ⏭️  Templates pulados: 0

✨ Seed concluído!
```

### Passo 3: Verificar no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Navegue até **Firestore Database**
3. Abra a coleção `templates`
4. Verifique que os documentos têm o campo `engine_config`

### Passo 4: Começar a Implementação

Siga o **Checklist de Implementação** (`CHECKLIST_IMPLEMENTACAO.md`) começando pela Fase 2.

---

## 📚 Guia de Leitura Recomendado

Para melhor aproveitamento, recomendamos ler os arquivos nesta ordem:

1. **README_GEMEO_DIGITAL.md** (este arquivo) - Visão geral
2. **GEMEO_DIGITAL_GUIA_RAPIDO.md** - Como usar rapidamente
3. **src/types/digitalTwin.ts** - Ver os tipos e exemplos JSON
4. **GEMEO_DIGITAL_SCHEMA.md** - Entender a estrutura profundamente
5. **EXEMPLO_INTEGRACAO.tsx** - Ver código React real
6. **CHECKLIST_IMPLEMENTACAO.md** - Implementar seguindo as fases

---

## 🎯 Fluxo de Dados Resumido

```
┌─────────────────────────────────────────────────┐
│          1. MASTER CRIA TEMPLATE                │
│  ┌──────────────────────────────────────────┐   │
│  │ • Nome: "Sacada KS"                      │   │
│  │ • engine_config:                         │   │
│  │   - regras_fisicas (folgas, dimensões)   │   │
│  │   - mapeamento_materiais (cores)         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      2. USUÁRIO SELECIONA TEMPLATE              │
│  ┌──────────────────────────────────────────┐   │
│  │ • Busca templates com engine_config      │   │
│  │ • Seleciona "Sacada KS"                  │   │
│  │ • Cria OrcamentoItem com snapshot        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│    3. USUÁRIO PREENCHE DADOS DO PROJETO         │
│  ┌──────────────────────────────────────────┐   │
│  │ • Largura: 6.5m                          │   │
│  │ • Altura: 2.4m                           │   │
│  │ • Cor vidro: Incolor                     │   │
│  │ • Cor perfil: Branco                     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         4. SISTEMA CALCULA (ENGINE)             │
│  ┌──────────────────────────────────────────┐   │
│  │ • Valida dimensões (min/max)             │   │
│  │ • Calcula 8 folhas de 0.8125m cada       │   │
│  │ • Aplica folgas (15mm)                   │   │
│  │ • Calcula 15.6m² de vidro                │   │
│  │ • Lista materiais (vidro, perfis, etc)   │   │
│  │ • Calcula custos                         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         5. EXIBE RESULTADO                      │
│  ┌──────────────────────────────────────────┐   │
│  │ Dimensões Calculadas:                    │   │
│  │ • 8 folhas de 0.8125m × 2.37m            │   │
│  │                                          │   │
│  │ Lista de Materiais:                      │   │
│  │ • 15.6m² vidro temperado 8mm → R$ 2.808  │   │
│  │ • 6.5m perfil trilho superior → R$ 780   │   │
│  │ • 32 roldanas → R$ 480                   │   │
│  │ • ...                                    │   │
│  │                                          │   │
│  │ TOTAL: R$ 5.513,00                       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Exemplos de Templates Disponíveis

### 1. Sacada KS - Envidraçamento
- **Folhas:** 6 (padrão, pode ajustar)
- **Tipo:** Sistema empilhável com pivô central
- **Vidro:** Temperado 6/8/10mm
- **Dimensões:** 1.5m a 12m (largura), 1.2m a 3m (altura)
- **Folgas:** 15mm padrão, 20mm lateral

### 2. Janela 4 Folhas de Correr
- **Folhas:** 4 (2 fixas, 2 móveis)
- **Tipo:** Sistema de correr tradicional
- **Vidro:** Temperado/Laminado/Comum 4/6/8mm
- **Dimensões:** 1.2m a 3m (largura), 1m a 2.2m (altura)
- **Folgas:** 12mm padrão, 15mm lateral

### 3. Janela 2 Folhas de Correr
- **Folhas:** 2 (1 fixa, 1 móvel)
- **Tipo:** Sistema de correr compacto
- **Vidro:** Temperado/Laminado/Comum 4/6/8mm
- **Dimensões:** 0.8m a 2m (largura), 0.8m a 2m (altura)

### 4. Box de Banheiro Frontal
- **Folhas:** 2 (1 fixa, 1 móvel)
- **Tipo:** Sistema de correr para banheiro
- **Vidro:** Temperado 8/10mm
- **Dimensões:** 0.7m a 1.8m (largura), 1.8m a 2.2m (altura)
- **Folgas:** 10mm padrão, vedação especial

### 5. Guarda-Corpo Sistema Torre
- **Folhas:** 1 (vidro fixo)
- **Tipo:** Sistema torre com fixação por grampos
- **Vidro:** Temperado/Laminado 10/12mm
- **Dimensões:** 0.5m a 3m (largura), altura fixa 1.05m (norma ABNT)
- **Acessórios:** Torres inox, grampos, corrimão

---

## 🔧 Estrutura de Arquivos no Projeto

```
dashboard/
├── src/
│   ├── types/
│   │   └── digitalTwin.ts          ← Tipos TypeScript
│   ├── services/
│   │   └── engineCalculator.ts     ← Engine de cálculo (a criar)
│   ├── hooks/
│   │   └── useTemplatesComEngenharia.ts  ← Hook (a criar)
│   └── components/
│       ├── TemplateSelectorEngenharia.tsx  ← Modal (a criar)
│       ├── ItemEditorEngenharia.tsx        ← Editor (a criar)
│       ├── EngineOverrideModal.tsx         ← Override (a criar)
│       └── ResultadoCalculoView.tsx        ← Resultado (a criar)
│
├── scripts/
│   └── seedTemplates.ts            ← Script de seed
│
├── GEMEO_DIGITAL_SCHEMA.md         ← Documentação técnica
├── GEMEO_DIGITAL_GUIA_RAPIDO.md    ← Guia prático
├── EXEMPLO_INTEGRACAO.tsx          ← Exemplos de código
├── CHECKLIST_IMPLEMENTACAO.md      ← Checklist de tarefas
└── README_GEMEO_DIGITAL.md         ← Este arquivo
```

---

## 💡 Principais Conceitos

### 1. **Template Master**
Template global que define as regras de engenharia. Editável apenas por Master.

**Exemplo:**
```typescript
{
  name: "Sacada KS",
  engine_config: {
    regras_fisicas: {
      folgas: { padrao: 15 },
      numero_folhas: 6,
      // ...
    }
  }
}
```

### 2. **Snapshot**
Cópia da configuração do template no momento da criação do orçamento.
Garante que mudanças futuras no template não afetem orçamentos antigos.

**Campo:** `engine_config_snapshot`

### 3. **Override**
Customização específica de um orçamento, sobrescrevendo valores do snapshot.

**Exemplo:**
```typescript
{
  engine_overrides: {
    regras_fisicas: {
      folgas: { padrao: 10 }  // Mudou de 15mm para 10mm
    },
    motivo_override: "Cliente solicitou vedação mais justa"
  }
}
```

### 4. **Resultado do Cálculo**
Saída da engine contendo dimensões calculadas, lista de materiais e validações.

**Campo:** `resultado_calculo`

---

## ❓ Perguntas Frequentes

### 1. Posso ter orçamentos com e sem engenharia?
**Sim!** Defina `usar_engenharia: false` no item para usar modo manual tradicional.

### 2. O que acontece se eu mudar o template depois?
**Nada!** Orçamentos usam o `snapshot`, então ficam inalterados.

### 3. Preciso calcular sempre na criação do orçamento?
**Não!** Pode deixar vazio e calcular depois (ao clicar em "Calcular" ou ao gerar PDF).

### 4. Como desabilitar o sistema?
Não crie itens com `usar_engenharia: true`. O sistema é opt-in.

### 5. Posso adicionar novos templates?
**Sim!** Basta criar um novo documento em `templates` com `engine_config`. Use os exemplos existentes como base.

---

## 🐛 Solução de Problemas

### Erro: "Cannot find module './types/digitalTwin'"
**Solução:** Certifique-se de que o arquivo `src/types/digitalTwin.ts` existe.

### Seed não funciona
**Solução:** 
1. Verifique variáveis de ambiente (`.env`)
2. Confirme que Firebase está configurado
3. Verifique permissões do Firestore

### Templates não aparecem na UI
**Solução:**
1. Confirme que `active: true`
2. Verifique query no frontend
3. Verifique permissões de leitura

---

## 📊 Progresso Atual

```
✅ Fase 0: Preparação (100%)
   ✅ Tipos TypeScript
   ✅ Documentação completa
   ✅ Script de seed
   ✅ Exemplos de código
   ✅ Checklist de implementação

⏳ Próximas Fases:
   📦 Fase 1: Setup Inicial
   🔧 Fase 2: Engine de Cálculo
   🎨 Fase 3-5: UI Components
   📄 Fase 7: Integração PDF
   🧪 Fase 8-10: Testes e Deploy
```

---

## 🚀 Próximos Passos

1. **Agora:** Execute `npm install` e `npm run seed:templates`
2. **Hoje:** Comece a Fase 2 (Engine de Cálculo)
3. **Esta semana:** Implemente UI básica (Fases 3-5)
4. **Próxima semana:** Testes e refinamentos
5. **Deploy:** Quando tudo estiver testado

---

## 📞 Suporte

Para dúvidas técnicas, consulte:
- 📘 `GEMEO_DIGITAL_SCHEMA.md` - Documentação completa
- 🚀 `GEMEO_DIGITAL_GUIA_RAPIDO.md` - Guia rápido
- 💻 `EXEMPLO_INTEGRACAO.tsx` - Exemplos de código

Para problemas, verifique:
- 🐛 Seção "Troubleshooting" no guia rápido
- ✅ Checklist para ver se alguma etapa foi pulada

---

**🎉 Sistema pronto para implementação!**

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Equipe:** Gestor Vitreo

---

## 📄 Licença

Este sistema é parte do SaaS Gestor Vitreo.  
Todos os direitos reservados © 2026.

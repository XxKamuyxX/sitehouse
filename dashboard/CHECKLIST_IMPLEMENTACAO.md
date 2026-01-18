# ✅ Checklist de Implementação - Gêmeo Digital

**Sistema de Simulação de Engenharia para Vidraçaria**

Use este checklist para acompanhar o progresso da implementação.

---

## 📋 Fase 0: Preparação (CONCLUÍDA ✅)

- [x] **Definir estrutura de dados (Schema)**
  - Arquivo: `src/types/digitalTwin.ts`
  - Interfaces: Template, EngineConfig, OrcamentoItem, ResultadoCalculo
  
- [x] **Criar documentação completa**
  - Arquivo: `GEMEO_DIGITAL_SCHEMA.md`
  - Fluxo de dados, exemplos, referências
  
- [x] **Criar script de seed**
  - Arquivo: `scripts/seedTemplates.ts`
  - 5 templates iniciais com engine_config
  
- [x] **Criar guia de implementação**
  - Arquivo: `GEMEO_DIGITAL_GUIA_RAPIDO.md`
  - Instruções passo a passo
  
- [x] **Criar exemplos de código**
  - Arquivo: `EXEMPLO_INTEGRACAO.tsx`
  - Componentes React prontos para copiar

---

## 📦 Fase 1: Setup Inicial

### 1.1 Instalar Dependências

```bash
cd dashboard
npm install
```

- [ ] Verificar que `tsx`, `@types/node`, `dotenv` foram instalados
- [ ] Testar comando: `npm run seed:templates --help`

### 1.2 Popular Templates no Firestore

```bash
npm run seed:templates
```

- [ ] Script executado com sucesso
- [ ] 5 templates criados no Firestore
- [ ] Verificar no Firebase Console que `engine_config` existe

### 1.3 Verificar Firestore Rules

- [ ] Abrir `FIREBASE_RULES.txt`
- [ ] Confirmar que regra para `templates` existe:
  ```javascript
  match /templates/{templateId} {
    allow read: if isAuthenticated();
    allow write: if isMaster();
  }
  ```
- [ ] Atualizar rules no Firebase Console se necessário

---

## 🔧 Fase 2: Backend - Engine de Cálculo

### 2.1 Criar Serviço de Cálculo

**Arquivo:** `src/services/engineCalculator.ts`

- [ ] Criar arquivo
- [ ] Importar tipos: `OrcamentoItem`, `ResultadoCalculo`, `RegrasFisicas`
- [ ] Implementar função `calcularItem(item: OrcamentoItem): Promise<OrcamentoItem>`

**Subfunções necessárias:**

- [ ] `validarDimensoes()` - Valida min/max, área, peso
- [ ] `calcularDivisaoFolhas()` - Divide largura em N folhas
- [ ] `aplicarFolgas()` - Subtrai folgas das dimensões brutas
- [ ] `calcularAreaVidro()` - Calcula área total de vidro
- [ ] `calcularPeso()` - Calcula peso baseado em área e espessura
- [ ] `calcularMateriais()` - Gera lista de materiais
- [ ] `calcularCustos()` - Aplica preços unitários

### 2.2 Implementar Validações

- [ ] Validar `dimensoes_minimas` e `dimensoes_maximas`
- [ ] Validar `area_maxima_folha`
- [ ] Validar `peso_maximo_folha`
- [ ] Validar `espessuras_vidro_permitidas`
- [ ] Retornar array `validacoes` com erros/avisos/infos

### 2.3 Implementar Cálculo de Materiais

**Vidro:**
- [ ] Calcular área total (com folgas aplicadas)
- [ ] Aplicar espessura selecionada
- [ ] Usar cor do `glassColor`
- [ ] Calcular peso: `area * espessura * 2.5 kg/m²/mm`

**Perfis:**
- [ ] Iterar sobre `acessorios_obrigatorios`
- [ ] Interpretar `quantidade_formula`:
  - `'largura_total'` → metros lineares
  - `'numero_folhas * 4'` → quantidade numérica
  - `'Math.ceil(largura_total / 1.2)'` → eval seguro ou parser
- [ ] Aplicar `preco_unitario`

**Acessórios:**
- [ ] Mesma lógica dos perfis
- [ ] Incluir acessórios opcionais se selecionados

### 2.4 Implementar Merge de Overrides

- [ ] Função para mesclar `engine_config_snapshot` com `engine_overrides`
- [ ] Usar spread operator para regras base
- [ ] Sobrescrever com valores de `engine_overrides.regras_fisicas`
- [ ] Preservar valores não sobrescritos

### 2.5 Testes da Engine

- [ ] Testar com Sacada KS (6.5m × 2.4m)
- [ ] Testar com Janela 4 Folhas (2.5m × 1.5m)
- [ ] Testar validações de dimensões mínimas
- [ ] Testar validações de dimensões máximas
- [ ] Testar com override de folgas
- [ ] Verificar que lista de materiais está completa

---

## 🎨 Fase 3: Frontend - UI de Seleção

### 3.1 Criar Hook de Templates

**Arquivo:** `src/hooks/useTemplatesComEngenharia.ts`

- [ ] Criar arquivo
- [ ] Implementar hook que busca templates com `engine_config`
- [ ] Filtrar apenas templates `active: true`
- [ ] Retornar `{ templates, loading, error }`

### 3.2 Criar Modal de Seleção de Template

**Arquivo:** `src/components/TemplateSelectorEngenharia.tsx`

- [ ] Criar componente modal
- [ ] Grid de cards com templates
- [ ] Exibir imagem, nome, categoria
- [ ] Badge "🤖 Cálculo Automático"
- [ ] Mostrar info da engine (folhas, espessura)
- [ ] Evento `onSelect(template)`

### 3.3 Atualizar QuoteNew.tsx

**Arquivo:** `src/pages/QuoteNew.tsx`

- [ ] Importar tipos `OrcamentoItem` de `digitalTwin.ts`
- [ ] Adicionar botão "Adicionar Item com Engenharia"
- [ ] Abrir modal de seleção ao clicar
- [ ] Ao selecionar template:
  - [ ] Criar `OrcamentoItem` com `engine_config_snapshot`
  - [ ] Definir `usar_engenharia: true`
  - [ ] Adicionar ao array `items`

### 3.4 Criar Editor de Item com Dimensões

**Arquivo:** `src/components/ItemEditorEngenharia.tsx`

- [ ] Inputs para largura e altura
- [ ] Display de área calculada
- [ ] Seletores de cor (vidro e perfil) baseados em `mapeamento_materiais`
- [ ] Selector de espessura baseado em `espessuras_vidro_permitidas`
- [ ] Validações em tempo real (mostrar erros antes de calcular)
- [ ] Botão "Calcular Materiais"

### 3.5 Integrar Cálculo no Frontend

**No QuoteNew.tsx:**

- [ ] Importar `calcularItem` de `engineCalculator`
- [ ] Função `handleCalcular(item)`:
  - [ ] Chamar `calcularItem(item)`
  - [ ] Atualizar item no array com `resultado_calculo`
  - [ ] Atualizar `total` do item
  - [ ] Mostrar notificação de sucesso/erro

---

## ⚙️ Fase 4: UI de Override (Customização)

### 4.1 Criar Modal de Override

**Arquivo:** `src/components/EngineOverrideModal.tsx`

- [ ] Modal com inputs para editar regras
- [ ] Seção "Folgas" (padrao, lateral, superior, inferior)
- [ ] Input "Número de Folhas"
- [ ] Textarea "Motivo do Override"
- [ ] Comparação: Valores Originais vs Novos Valores
- [ ] Botão "Aplicar Customização"

### 4.2 Integrar Override no ItemEditor

- [ ] Botão "⚙️ Configurações Avançadas"
- [ ] Abrir modal de override ao clicar
- [ ] Ao salvar override:
  - [ ] Atualizar `engine_overrides` do item
  - [ ] Badge visual indicando "Customizado"
  - [ ] Opção para "Recalcular" com novas regras

### 4.3 Exibir Indicador de Override

- [ ] Badge "Customizado" no card do item
- [ ] Tooltip mostrando quais regras foram alteradas
- [ ] Botão "Reverter para Padrão" (limpa overrides)

---

## 📊 Fase 5: Exibição de Resultados

### 5.1 Criar Componente de Resultado

**Arquivo:** `src/components/ResultadoCalculoView.tsx`

- [ ] Card "Dimensões Calculadas"
  - [ ] Largura total, altura total, área total
  - [ ] Grid com cada folha (largura × altura, peso)
  
- [ ] Card "Lista de Materiais"
  - [ ] Tabela com: Material, Quantidade, Unidade, Preço Unit., Subtotal
  - [ ] Badges coloridos por tipo (vidro, perfil, acessório)
  - [ ] Total geral em destaque
  
- [ ] Seção "Validações/Avisos"
  - [ ] Erros em vermelho
  - [ ] Avisos em amarelo
  - [ ] Infos em azul

### 5.2 Integrar no ItemEditor

- [ ] Mostrar `ResultadoCalculoView` após cálculo bem-sucedido
- [ ] Exibir loading state enquanto calcula
- [ ] Mostrar erros de cálculo de forma clara

---

## 🎨 Fase 6: Visualização 3D (Opcional)

### 6.1 Escolher Biblioteca

- [ ] Opção 1: Canvas HTML5 (mais simples, 2D)
- [ ] Opção 2: Three.js (mais complexo, 3D real)
- [ ] Opção 3: React Three Fiber (Three.js para React)

### 6.2 Implementar Canvas Básico

- [ ] Desenhar retângulo representando vista frontal
- [ ] Dividir em folhas verticais
- [ ] Aplicar cores do `mapeamento_materiais.vidro`
- [ ] Desenhar perfis com `mapeamento_materiais.perfil`
- [ ] Adicionar dimensões (largura, altura) com texto

### 6.3 Adicionar Interatividade

- [ ] Zoom in/out
- [ ] Pan (arrastar)
- [ ] Hover sobre folhas mostra dimensões
- [ ] Botão "Exportar como Imagem"

---

## 📄 Fase 7: Integração com PDF

### 7.1 Atualizar QuotePDF.tsx

**Arquivo:** `src/components/QuotePDF.tsx`

- [ ] Importar tipos `OrcamentoItem`, `ResultadoCalculo`
- [ ] Verificar se item tem `usar_engenharia: true`
- [ ] Se sim, usar dados de `resultado_calculo.lista_materiais`
- [ ] Se não, usar lógica antiga

### 7.2 Adicionar Seção de Materiais no PDF

- [ ] Tabela detalhada de materiais
- [ ] Separar por categoria (Vidro / Perfis / Acessórios)
- [ ] Incluir especificações técnicas:
  - [ ] Espessura de vidro
  - [ ] Dimensões das folhas
  - [ ] Número de folhas
  
### 7.3 Adicionar Desenho Técnico no PDF

- [ ] Capturar canvas como imagem (se Fase 6 implementada)
- [ ] Incluir no PDF usando `<Image src={canvasDataUrl} />`
- [ ] Legenda com dimensões principais

---

## 🧪 Fase 8: Testes

### 8.1 Testes Unitários da Engine

- [ ] Testar `calcularItem()` com dados válidos
- [ ] Testar validações de dimensões
- [ ] Testar cálculo de folhas
- [ ] Testar aplicação de folgas
- [ ] Testar cálculo de materiais
- [ ] Testar merge de overrides

### 8.2 Testes de Integração

- [ ] Fluxo completo: Selecionar template → Preencher dimensões → Calcular
- [ ] Fluxo com override: Customizar → Recalcular
- [ ] Fluxo de erro: Dimensões inválidas → Mostrar erro
- [ ] Salvar orçamento → Reabrir → Verificar dados preservados

### 8.3 Testes de UI

- [ ] Modal de seleção abre e fecha corretamente
- [ ] Inputs de dimensões aceitam valores decimais
- [ ] Seletores de cor carregam opções do template
- [ ] Validações aparecem em tempo real
- [ ] Resultado exibe corretamente
- [ ] Override modal salva corretamente

### 8.4 Testes de Performance

- [ ] Cálculo termina em < 1 segundo
- [ ] Templates carregam rapidamente
- [ ] Orçamento com 10 itens não trava
- [ ] PDF gera em tempo razoável

---

## 📱 Fase 9: Responsividade e UX

### 9.1 Mobile

- [ ] Modal de seleção responsivo (grid → coluna única)
- [ ] Inputs de dimensões touch-friendly
- [ ] Tabela de materiais responsiva (scroll horizontal)
- [ ] Canvas de visualização adapta ao mobile

### 9.2 Melhorias de UX

- [ ] Loading states em todos os pontos assíncronos
- [ ] Feedback visual após cálculo (animação de sucesso)
- [ ] Tooltips explicativos em campos técnicos
- [ ] Atalhos de teclado (Enter para calcular)
- [ ] Confirmação antes de limpar overrides

### 9.3 Acessibilidade

- [ ] Botões com labels descritivos
- [ ] Inputs com labels associados
- [ ] Foco visível em elementos interativos
- [ ] Cores com contraste adequado
- [ ] Mensagens de erro acessíveis

---

## 🚀 Fase 10: Deploy e Monitoramento

### 10.1 Preparar para Produção

- [ ] Remover console.logs de debug
- [ ] Adicionar error boundaries
- [ ] Configurar Sentry ou similar para tracking de erros
- [ ] Otimizar imports (lazy loading de componentes pesados)

### 10.2 Migração de Dados

Se houver templates existentes sem `engine_config`:
- [ ] Script de migração para adicionar `engine_config` vazio
- [ ] Documentar templates que precisam de configuração manual
- [ ] Plano de rollback caso algo dê errado

### 10.3 Documentação Final

- [ ] Atualizar README do projeto
- [ ] Documentar novos endpoints/funções
- [ ] Criar guia de uso para usuários finais
- [ ] Vídeo tutorial (opcional)

### 10.4 Monitoramento

- [ ] Dashboard para acompanhar uso da feature
- [ ] Métricas: Quantos orçamentos usam engine? Taxa de sucesso?
- [ ] Feedback dos usuários
- [ ] Erros mais comuns

---

## 📊 Resumo do Progresso

```
Fase 0: Preparação         ████████████████████ 100% ✅
Fase 1: Setup Inicial      ░░░░░░░░░░░░░░░░░░░░   0%
Fase 2: Engine de Cálculo  ░░░░░░░░░░░░░░░░░░░░   0%
Fase 3: UI de Seleção      ░░░░░░░░░░░░░░░░░░░░   0%
Fase 4: UI de Override     ░░░░░░░░░░░░░░░░░░░░   0%
Fase 5: Exibição           ░░░░░░░░░░░░░░░░░░░░   0%
Fase 6: Visualização 3D    ░░░░░░░░░░░░░░░░░░░░   0% (Opcional)
Fase 7: Integração PDF     ░░░░░░░░░░░░░░░░░░░░   0%
Fase 8: Testes             ░░░░░░░░░░░░░░░░░░░░   0%
Fase 9: Responsividade     ░░░░░░░░░░░░░░░░░░░░   0%
Fase 10: Deploy            ░░░░░░░░░░░░░░░░░░░░   0%

PROGRESSO TOTAL: ██░░░░░░░░░░░░░░░░░░ 10%
```

---

## 🎯 Próximos Passos Imediatos

1. **Instalar dependências:** `npm install`
2. **Popular templates:** `npm run seed:templates`
3. **Verificar no Firebase:** Conferir que templates têm `engine_config`
4. **Começar Fase 2:** Implementar `engineCalculator.ts`

---

## 📞 Precisa de Ajuda?

Consulte os arquivos de referência:

- 📘 **Schema completo:** `GEMEO_DIGITAL_SCHEMA.md`
- 🚀 **Guia rápido:** `GEMEO_DIGITAL_GUIA_RAPIDO.md`
- 💻 **Exemplos de código:** `EXEMPLO_INTEGRACAO.tsx`
- 🗂️ **Tipos TypeScript:** `src/types/digitalTwin.ts`

---

**Última atualização:** 18/01/2026  
**Versão do checklist:** 1.0.0

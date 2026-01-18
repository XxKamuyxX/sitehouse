# 🚀 Guia Rápido - Gêmeo Digital

**Sistema de Simulação de Engenharia para Vidraçaria**

---

## 📦 O que foi criado?

✅ **Tipos TypeScript completos** (`src/types/digitalTwin.ts`)
- Interfaces para Templates, Orçamentos, Engine Config
- Exemplos prontos: Sacada KS, Janela 4 Folhas

✅ **Documentação detalhada** (`GEMEO_DIGITAL_SCHEMA.md`)
- Explicação completa da estrutura
- Fluxo de dados
- Exemplos práticos

✅ **Script de Seed** (`scripts/seedTemplates.ts`)
- Popula 5 templates iniciais
- Sacada KS, Janelas 2/4 folhas, Box, Guarda-Corpo

---

## 🎯 Como usar?

### 1️⃣ Instalar Dependências

```bash
cd dashboard
npm install
```

Isso instalará:
- `tsx` - Para executar TypeScript
- `@types/node` - Tipos do Node.js
- `dotenv` - Para variáveis de ambiente

### 2️⃣ Popular Templates Iniciais

```bash
npm run seed:templates
```

Este comando irá:
1. Conectar no Firestore
2. Criar 5 templates com configuração de engenharia
3. Verificar duplicados (não cria se já existe)

**Saída esperada:**
```
🌱 Iniciando seed de templates com configuração de engenharia...

✅ Criado: "Sacada KS - Envidraçamento" (ID: abc123)
✅ Criado: "Janela 4 Folhas de Correr" (ID: def456)
✅ Criado: "Janela 2 Folhas de Correr" (ID: ghi789)
✅ Criado: "Box de Banheiro Frontal" (ID: jkl012)
✅ Criado: "Guarda-Corpo Sistema Torre" (ID: mno345)

📊 Resumo:
   ✅ Templates criados: 5
   ⏭️  Templates pulados: 0
   📝 Total no seed: 5

✨ Seed concluído!
```

### 3️⃣ Verificar no Firestore

Acesse: [Firebase Console](https://console.firebase.google.com/)

1. Navegue até **Firestore Database**
2. Abra a coleção `templates`
3. Verifique que os templates têm o campo `engine_config`

**Estrutura esperada:**
```
templates/
  └─ [ID_DO_TEMPLATE]/
      ├─ name: "Sacada KS - Envidraçamento"
      ├─ category: "Envidraçamento"
      ├─ imageUrl: "https://..."
      ├─ active: true
      ├─ tags: ["sacada", "envidraçamento"]
      ├─ createdAt: Timestamp
      └─ engine_config:              ← NOVO!
          ├─ engine_id: "sacada_ks"
          ├─ engine_name: "Sacada KS..."
          ├─ engine_version: "1.0.0"
          ├─ regras_fisicas:
          │   ├─ folgas: {...}
          │   ├─ dimensoes_minimas: {...}
          │   └─ ...
          └─ mapeamento_materiais:
              ├─ vidro: {...}
              └─ perfil: {...}
```

---

## 🔧 Próximas Etapas de Implementação

### Fase 1: Backend/Engine (⏱️ Estimativa: 2-3 dias)

Criar o calculador de engenharia:

```typescript
// src/services/engineCalculator.ts

import { OrcamentoItem, ResultadoCalculo } from '../types/digitalTwin';

export async function calcularItem(
  item: OrcamentoItem
): Promise<OrcamentoItem> {
  // 1. Validar dados de entrada
  // 2. Aplicar regras físicas
  // 3. Calcular dimensões das folhas
  // 4. Calcular lista de materiais
  // 5. Calcular custos
  // 6. Retornar resultado
}
```

**Tarefas:**
- [ ] Implementar função `calcularItem()`
- [ ] Adicionar validações (dimensões, pesos)
- [ ] Calcular divisão de folhas
- [ ] Calcular materiais (vidro, perfis, acessórios)
- [ ] Aplicar preços unitários
- [ ] Testes unitários

### Fase 2: UI de Seleção (⏱️ Estimativa: 1-2 dias)

Atualizar `QuoteNew.tsx` para usar templates com engine:

**Tarefas:**
- [ ] Modal de seleção de templates
- [ ] Exibir templates com badge "🤖 Cálculo Automático"
- [ ] Ao selecionar, criar item com `engine_config_snapshot`
- [ ] Form para dimensões (largura/altura)
- [ ] Seletores de cor (vidro/perfil)
- [ ] Botão "Calcular" que chama `calcularItem()`

### Fase 3: UI de Override (⏱️ Estimativa: 1 dia)

Permitir customização de regras:

**Tarefas:**
- [ ] Modal/Drawer "Configurações Avançadas"
- [ ] Inputs para editar folgas
- [ ] Input para número de folhas
- [ ] Campo de justificativa do override
- [ ] Botão "Recalcular com novas regras"

### Fase 4: Visualização 3D (⏱️ Estimativa: 3-4 dias)

Canvas com preview do projeto:

**Tarefas:**
- [ ] Canvas HTML5 ou Three.js
- [ ] Renderizar vista frontal do projeto
- [ ] Aplicar cores do mapeamento de materiais
- [ ] Destacar dimensões e folhas
- [ ] Zoom e pan
- [ ] Exportar como imagem

### Fase 5: Relatório de Materiais (⏱️ Estimativa: 1 dia)

PDF detalhado com lista de materiais:

**Tarefas:**
- [ ] Tabela de materiais calculados
- [ ] Quantidades, unidades e preços
- [ ] Total por categoria (vidro, perfis, acessórios)
- [ ] Incluir no PDF do orçamento

---

## 📚 Documentação de Referência

### Arquivos Criados

1. **`src/types/digitalTwin.ts`**
   - Todos os tipos TypeScript
   - Exemplos JSON completos
   - Importar: `import { Template, OrcamentoItem } from './types/digitalTwin'`

2. **`GEMEO_DIGITAL_SCHEMA.md`**
   - Documentação completa
   - Fluxo de dados
   - Exemplos de código

3. **`scripts/seedTemplates.ts`**
   - Script de seed
   - 5 templates prontos
   - Executar: `npm run seed:templates`

4. **`GEMEO_DIGITAL_GUIA_RAPIDO.md`** (este arquivo)
   - Guia rápido de uso
   - Checklist de implementação

### Tipos Principais

```typescript
// Template master (coleção templates)
interface Template {
  name: string;
  category: string;
  imageUrl: string;
  engine_config?: EngineConfig;  // ← PRINCIPAL
  // ...
}

// Configuração de engenharia
interface EngineConfig {
  engine_id: EngineId;
  regras_fisicas: RegrasFisicas;
  mapeamento_materiais: MapeamentoMateriais;
}

// Item do orçamento (array items[] em quotes)
interface OrcamentoItem {
  serviceName: string;
  dimensions: { width, height };
  glassColor: string;
  
  // Snapshot do template
  engine_config_snapshot?: EngineConfig;
  
  // Customizações
  engine_overrides?: { ... };
  
  // Resultado do cálculo
  resultado_calculo?: ResultadoCalculo;
}

// Resultado do cálculo
interface ResultadoCalculo {
  status: 'pending' | 'calculated' | 'error';
  dimensoes_calculadas: { ... };
  lista_materiais: [ ... ];
  validacoes: [ ... ];
}
```

---

## 🧪 Testes Manuais

### Teste 1: Verificar Templates

```bash
# 1. Rode o seed
npm run seed:templates

# 2. No Firebase Console, verifique:
# - Coleção templates existe
# - 5 documentos criados
# - Campo engine_config presente
```

### Teste 2: Importar Tipos

```typescript
// Em qualquer arquivo .ts/.tsx
import { 
  Template, 
  OrcamentoItem, 
  EXEMPLO_SACADA_KS 
} from './types/digitalTwin';

console.log(EXEMPLO_SACADA_KS.engine_config);
// Deve imprimir a configuração completa
```

### Teste 3: Buscar Template no Código

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Template } from './types/digitalTwin';

async function testarTemplate() {
  const templateDoc = await getDoc(doc(db, 'templates', '[ID]'));
  const template = templateDoc.data() as Template;
  
  console.log('Nome:', template.name);
  console.log('Engine ID:', template.engine_config?.engine_id);
  console.log('Folgas:', template.engine_config?.regras_fisicas.folgas);
}
```

---

## ❓ Perguntas Frequentes

### 1. O que é `engine_config_snapshot`?

É uma **cópia** da configuração do template no momento da criação do orçamento. Isso garante que mudanças futuras no template não afetem orçamentos já criados.

### 2. Para que serve `engine_overrides`?

Permite **customizar** as regras para um orçamento específico, sem alterar o template. Exemplo: mudar folga de 15mm para 10mm só neste projeto.

### 3. Preciso calcular na criação do orçamento?

**Não necessariamente.** Pode deixar `resultado_calculo` vazio e calcular depois (quando o usuário clicar em "Calcular" ou na hora de gerar o PDF).

### 4. Como desabilitar o cálculo automático para um item?

Defina `usar_engenharia: false` no item. Assim, ele funciona como orçamento manual tradicional.

### 5. Posso ter itens com e sem engenharia no mesmo orçamento?

**Sim!** Um orçamento pode ter:
- Item 1: Sacada KS com `usar_engenharia: true` (calculado automaticamente)
- Item 2: Serviço de manutenção com `usar_engenharia: false` (preço manual)

---

## 🐛 Troubleshooting

### Erro: "Cannot find module './types/digitalTwin'"

**Solução:** Certifique-se de que o arquivo `src/types/digitalTwin.ts` foi criado.

### Erro no seed: "Firebase config não encontrado"

**Solução:** O script usa variáveis de ambiente. Certifique-se de que seu `.env` tem:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# etc
```

### Erro: "Permission denied" no Firestore

**Solução:** Atualize as regras do Firestore para permitir escrita em `templates`:

```javascript
// firestore.rules
match /templates/{templateId} {
  allow read: if isAuthenticated();
  allow write: if isMaster();
}
```

### Templates criados mas não aparecem na UI

**Solução:** Verifique:
1. Campo `active: true` está definido
2. Query no frontend filtra por `active == true`
3. Usuário tem permissão de leitura

---

## 🎉 Conclusão

Você agora tem:

✅ Estrutura de dados completa e documentada
✅ Tipos TypeScript prontos para usar
✅ 5 templates de exemplo no Firestore
✅ Base para implementar o calculador de engenharia

**Próximo passo recomendado:** Implementar a Fase 1 (Engine de Cálculo)

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Autor:** Equipe Gestor Vitreo

Para dúvidas, consulte `GEMEO_DIGITAL_SCHEMA.md` ou entre em contato com o suporte.

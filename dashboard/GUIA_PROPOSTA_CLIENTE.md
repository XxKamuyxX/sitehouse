# 📱 Proposta Cliente - Página Pública Interativa

**Rota:** `/proposta/:orcamentoId`  
**Acesso:** Público (sem login)  
**Design:** Mobile-First

---

## 🎯 O Que É?

A **Proposta Cliente** é uma página pública onde o cliente final visualiza o orçamento enviado pela vidraçaria de forma moderna, interativa e mobile-friendly.

### Principais Características:

- ✅ **Mobile-First** - Otimizada para celular
- ✅ **Accordion Animado** - Itens expandem suavemente
- ✅ **Renderização Interativa** - Se item tiver `engine_config`, mostra visualização 3D
- ✅ **Botão WhatsApp Flutuante** - Conversão direta
- ✅ **Loading Elegante** - Estado de carregamento profissional
- ✅ **Design Moderno** - Gradientes, shadows, animações

---

## 📁 Arquivo Criado

### `src/pages/PropostaCliente.tsx`
**Linhas:** ~450 linhas  
**Descrição:** Componente completo de visualização da proposta

**Dependências:**
- `react-router-dom` - Para pegar ID da URL
- `firebase/firestore` - Para buscar dados do orçamento
- `framer-motion` - Para animações suaves
- `lucide-react` - Para ícones modernos
- `RenderizadorUniversal` - Para renderização interativa (se item tiver motor)

---

## 🎨 Interface da Página

### 1. **Header Sticky (Topo Fixo)**

```
┌─────────────────────────────────────────┐
│ [Logo] Vidraçaria              [✓ Ativa]│
│        Proposta Comercial               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Cliente: João Silva                 │ │
│ │ Valor Total: R$ 5.355,00            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Elementos:**
- Logo da empresa (se disponível)
- Badge de status (Ativa/Expirada)
- Card com gradiente azul
- Nome do cliente
- Valor total em destaque

---

### 2. **Lista de Itens (Accordion)**

#### Estado Fechado:
```
┌─────────────────────────────────────────┐
│ [📦]  Sacada KS 8 Folhas        R$ 5.355│
│       📦 8x  📏 6.5m x 2.4m           ▼ │
└─────────────────────────────────────────┘
```

#### Estado Aberto:
```
┌─────────────────────────────────────────┐
│ [📦]  Sacada KS 8 Folhas        R$ 5.355│
│       📦 8x  📏 6.5m x 2.4m           ▲ │
├─────────────────────────────────────────┤
│ Descrição do produto...                │
│                                         │
│ ┌──────────┬──────────┐                │
│ │Qtd: 8x   │Unit: R$  │                │
│ │          │ 669,38   │                │
│ ├──────────┼──────────┤                │
│ │Largura:  │Altura:   │                │
│ │ 6.5m     │ 2.4m     │                │
│ └──────────┴──────────┘                │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ ✓ Visualização Interativa        │  │
│ │ [Canvas com Renderização]        │  │
│ │ 400x300px                        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Materiais Inclusos:                    │
│ • Vidro Incolor 8mm ... R$ 2.295,00   │
│ • Perfil Branco ... R$ 801,00          │
│ • Pivô Central ... R$ 450,00           │
└─────────────────────────────────────────┘
```

---

### 3. **Botão WhatsApp Flutuante**

```
┌─────────────────────────────────────────┐
│ [Gradiente verde para branco]          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💬 Aprovar pelo WhatsApp            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Posição:** Fixed bottom (sempre visível)  
**Ação:** Abre WhatsApp com mensagem pré-formatada

---

## 🔧 Como Funciona

### Passo 1: Acesso à Rota
```
URL: https://meusite.com/proposta/abc123xyz
     ↓
useParams() extrai "abc123xyz"
     ↓
Busca no Firestore: quotes/abc123xyz
```

### Passo 2: Data Fetching
```javascript
const loadQuote = async () => {
  // 1. Buscar orçamento
  const quoteDoc = await getDoc(doc(db, 'quotes', orcamentoId));
  
  // 2. Buscar dados da empresa
  if (quoteData.companyId) {
    const companyDoc = await getDoc(doc(db, 'companies', companyData.companyId));
    quoteData.companyName = companyData.name;
    quoteData.companyLogo = companyData.logoUrl;
  }
  
  // 3. Atualizar estado
  setQuote(quoteData);
};
```

### Passo 3: Renderização Condicional
```javascript
// Para cada item do orçamento:
{quote.items.map((item, index) => (
  <div>
    {/* Card sempre visível */}
    <button onClick={() => toggleItem(index)}>
      {/* Miniatura, nome, preço, ícone */}
    </button>
    
    {/* Detalhes (accordion) */}
    {expandedItem === index && (
      <motion.div animate={{ height: 'auto' }}>
        {/* Se item tem engine_config, renderizar */}
        {item.engine_config_snapshot ? (
          <RenderizadorUniversal
            config={item.engine_config_snapshot}
            props={{
              largura: item.dimensions.width,
              altura: item.dimensions.height,
              cor_vidro_id: item.glassColor,
              cor_perfil_id: item.profileColor,
            }}
            mode="interactive"
          />
        ) : (
          <img src={item.imageUrl} />
        )}
      </motion.div>
    )}
  </div>
))}
```

### Passo 4: Aprovação WhatsApp
```javascript
const handleWhatsAppApproval = () => {
  const message = `Olá! Aprovei o orçamento #${quote.id.substring(0, 8)} no valor de R$ ${quote.total.toLocaleString('pt-BR')}. Gostaria de prosseguir com o pedido.`;
  
  const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
  
  window.open(whatsappUrl, '_blank');
};
```

---

## 🎬 Animações (Framer Motion)

### Loading State:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
>
  <Loader2 className="animate-spin" />
  Carregando proposta...
</motion.div>
```

### Header:
```tsx
<motion.header
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
>
  {/* Conteúdo */}
</motion.header>
```

### Cada Item (Stagger):
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 * index }}
>
  {/* Card do item */}
</motion.div>
```

### Accordion (Expand/Collapse):
```tsx
<AnimatePresence>
  {expandedItem === index && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Detalhes */}
    </motion.div>
  )}
</AnimatePresence>
```

### Botão WhatsApp:
```tsx
<motion.div
  initial={{ y: 100 }}
  animate={{ y: 0 }}
  transition={{ delay: 0.5 }}
  className="fixed bottom-0"
>
  <button>Aprovar pelo WhatsApp</button>
</motion.div>
```

---

## 💡 Casos de Uso

### Caso 1: Item COM Motor de Engenharia
```
Item: Sacada KS 8 Folhas
engine_config_snapshot: { engine_id: 'sacada_ks', ... }
dimensions: { width: 6.5, height: 2.4 }

Resultado:
✅ Cliente vê renderização interativa
✅ Pode girar, zoom (se implementado)
✅ Vê detalhes técnicos calculados
```

### Caso 2: Item SEM Motor (Template Estático)
```
Item: Espelho Bisotado
engine_config_snapshot: undefined
imageUrl: "https://storage.../espelho.png"

Resultado:
✅ Cliente vê apenas a imagem estática
✅ Detalhes textuais (dimensões, cores)
```

### Caso 3: Orçamento Expirado
```
quote.expiresAt: 2026-01-10 (passado)

Resultado:
✅ Badge muda para "Expirada" (vermelho)
✅ Banner de alerta: "Esta proposta expirou"
✅ Botão WhatsApp continua funcionando (cliente pode negociar)
```

---

## 🎨 Design System

### Cores:

```css
Primary (Blue): #2563EB (blue-600)
Success (Green): #10B981 (green-500)
Warning (Yellow): #F59E0B (yellow-500)
Error (Red): #EF4444 (red-500)
Background: gradient from-blue-50 to-slate-100
```

### Espaçamentos:

```css
Container: max-w-4xl mx-auto
Padding: px-4 py-6
Gap entre itens: space-y-4
Border radius: rounded-2xl (16px)
```

### Tipografia:

```css
H1 (Empresa): text-lg font-bold
H2 (Seções): text-lg font-bold
H3 (Item): font-bold text-slate-800
Corpo: text-sm text-slate-600
Preço: text-2xl font-bold
```

---

## 🔗 Integração com Outras Fases

```
FASE 1 (BD)
   ↓
Define engine_config_snapshot no item
   ↓
FASE 2 (Cores)
   ↓
Cores do materiais.js usadas
   ↓
FASE 4 (Studio/Renderizador)
   ↓
RenderizadorUniversal renderiza item
   ↓
FASE 6 (Proposta Cliente)  ← ESTAMOS AQUI
   ↓
Cliente vê proposta interativa
   ↓
Clica "Aprovar pelo WhatsApp"
   ↓
Conversão!
```

---

## 📊 Estados da Página

### 1. Loading:
```
[Spinner animado]
Carregando proposta...
Aguarde um momento
```

### 2. Erro (Não encontrado):
```
[Ícone de alerta]
Oops!
Orçamento não encontrado
[Botão: Voltar ao Início]
```

### 3. Success (Dados carregados):
```
[Header + Lista + Botão WhatsApp]
```

---

## 🚀 Como Usar

### Criar Link para Cliente:

```javascript
// No sistema admin (ao criar orçamento)
const quoteId = 'abc123xyz';
const linkCliente = `https://meusite.com/proposta/${quoteId}`;

// Enviar por email, SMS ou WhatsApp
await enviarEmail(cliente.email, linkCliente);
```

### Testar Localmente:

```bash
# 1. Criar um orçamento no sistema
# 2. Copiar o ID do orçamento
# 3. Acessar:
http://localhost:5173/proposta/SEU_ID_AQUI
```

---

## ✅ Checklist de Validação

### Funcionalidades:
- [x] Busca orçamento no Firestore por ID
- [x] Exibe loading enquanto carrega
- [x] Trata erro (orçamento não encontrado)
- [x] Mostra header com logo e dados
- [x] Lista itens em accordion
- [x] Renderiza items com motor usando RenderizadorUniversal
- [x] Renderiza items sem motor com imagem
- [x] Botão WhatsApp flutuante
- [x] Mensagem pré-formatada
- [x] Animações suaves (framer-motion)

### Design:
- [x] Mobile-First (responsivo)
- [x] Gradientes modernos
- [x] Shadows consistentes
- [x] Ícones lucide-react
- [x] Cores do design system
- [x] Tipografia adequada
- [x] Espaçamentos corretos

### Integração:
- [x] Rota pública `/proposta/:orcamentoId`
- [x] Sem necessidade de login
- [x] Busca dados da empresa
- [x] Usa RenderizadorUniversal (Fase 4)
- [x] Usa engine_config_snapshot (Fase 1)
- [x] Usa cores do materiais.js (Fase 2)

---

## 🎯 Próximas Melhorias

### Fase 7: Funcionalidades Avançadas

1. ⏳ **Assinatura Digital**
   - Cliente assina com dedo no celular
   - Salva assinatura no Firestore
   - Marca orçamento como "Aprovado"

2. ⏳ **Pagamento Online**
   - Integração com Stripe/Mercado Pago
   - Cliente paga entrada diretamente
   - Webhook atualiza status

3. ⏳ **Comentários**
   - Cliente pode fazer perguntas
   - Notificação para admin
   - Chat em tempo real

4. ⏳ **Compartilhamento**
   - Botão "Compartilhar"
   - Gera link curto
   - Compartilha em redes sociais

5. ⏳ **Analytics**
   - Rastrear visualizações
   - Tempo na página
   - Taxa de conversão

---

## 📱 Screenshots (Conceitual)

### Mobile (375px):

```
┌───────────────┐
│[Logo] Vitraça-│
│       ria     │
│┌─────────────┐│
││Cliente      ││
││Valor Total  ││
│└─────────────┘│
│               │
│┌─────────────┐│
││[📦] Item 1  ││
││R$ 5.355  ▼ ││
│└─────────────┘│
│┌─────────────┐│
││[📦] Item 2  ││
││R$ 1.200  ▼ ││
│└─────────────┘│
│               │
│┌─────────────┐│
││💬 Aprovar   ││
││   WhatsApp  ││
│└─────────────┘│
└───────────────┘
```

### Tablet (768px):

```
┌─────────────────────────┐
│[Logo] Vidraçaria   [Ativa]│
│┌───────────────────────┐│
││Cliente | Valor Total  ││
│└───────────────────────┘│
│                          │
│┌────────┐┌────────┐    │
││Item 1  ││Item 2  │    │
││R$ 5.355││R$ 1.200│    │
│└────────┘└────────┘    │
│                          │
│┌───────────────────────┐│
││💬 Aprovar WhatsApp    ││
│└───────────────────────┘│
└─────────────────────────┘
```

---

## 🏆 Conclusão

A **Proposta Cliente** é uma página moderna e interativa que:

✅ **Aumenta conversão** - Botão WhatsApp direto  
✅ **Profissionaliza** - Design moderno e animações  
✅ **Diferencia** - Renderização interativa única  
✅ **Mobile-First** - Maioria dos clientes acessa por celular  
✅ **Fácil de usar** - Accordion intuitivo  

---

**Versão:** 1.0.0  
**Data:** 18/01/2026  
**Mantido por:** Equipe Gestor Vitreo

---

📱 **Proposta Cliente - Conversão Profissional no Celular!**

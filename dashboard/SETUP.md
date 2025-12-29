# Setup do Dashboard - House Manutenção

## ✅ Estrutura Criada

O dashboard foi criado como uma aplicação **independente** na pasta `dashboard/`, totalmente separada do site Astro existente.

## 📦 Tecnologias Implementadas

- ✅ **React 18** + **TypeScript** + **Vite**
- ✅ **Firebase** (Authentication + Firestore)
- ✅ **Tailwind CSS** (com paleta Navy/Gold)
- ✅ **React Router DOM** (roteamento)
- ✅ **@react-pdf/renderer** (geração de PDFs)
- ✅ **Lucide React** (ícones)

## 🎨 Design System

- **Cores:**
  - Navy: `#0F172A` (principal)
  - Gold: `#C5A059` (destaque)
  - Background: `#F9FAFB`

- **Tipografia:**
  - Sans: Inter
  - Serif: Playfair Display (para logos)

## 📁 Estrutura de Arquivos

```
dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes base (Button, Input, Card, Select)
│   │   ├── Layout.tsx       # Layout principal com navegação
│   │   ├── ClientForm.tsx   # Formulário de cliente
│   │   └── QuotePDF.tsx     # Componente PDF para orçamentos
│   ├── contexts/
│   │   └── AuthContext.tsx  # Contexto de autenticação
│   ├── lib/
│   │   ├── firebase.ts      # Configuração Firebase
│   │   └── utils.ts         # Utilitários (cn helper)
│   ├── pages/
│   │   ├── Login.tsx        # Tela de login
│   │   ├── Dashboard.tsx     # Dashboard principal
│   │   ├── Clients.tsx      # CRUD de clientes
│   │   ├── Quotes.tsx       # Lista de orçamentos
│   │   ├── QuoteNew.tsx     # Criar/editar orçamento
│   │   └── WorkOrders.tsx   # Lista de ordens de serviço
│   ├── App.tsx              # Componente principal com rotas
│   └── main.tsx             # Entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── vercel.json              # Config para deploy Vercel
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd dashboard
npm install
```

### 2. Configurar Firebase

1. Crie um arquivo `.env` na pasta `dashboard/`:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
```

2. No Firebase Console:
   - Habilite **Authentication** (Email/Password)
   - Crie um banco **Firestore**
   - Configure as regras de segurança (veja abaixo)

### 3. Regras do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem acessar
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

### 5. Build para Produção

```bash
npm run build
```

A pasta `dist/` será criada com os arquivos estáticos.

## 📋 Funcionalidades Implementadas

### ✅ Autenticação
- Login com Email/Password (Firebase Auth)
- Proteção de rotas privadas
- Context API para gerenciamento de estado

### ✅ Dashboard
- Estatísticas rápidas (Orçamentos Abertos, Faturamento, OS em Andamento)
- Botão de ação rápida "Novo Orçamento"
- Cards de ações rápidas

### ✅ CRM (Clientes)
- Listar clientes
- Criar novo cliente
- Editar cliente
- Excluir cliente
- Busca por nome/condomínio
- Dropdown de condomínios VIP (com suporte a digitação livre)

### ✅ Orçamentos
- Criar novo orçamento
- Editar orçamento existente
- Selecionar cliente
- Adicionar serviços do catálogo:
  - Troca de Roldanas (por unidade)
  - Vedação Completa (por metro)
  - Higienização e Blindagem (preço fixo)
  - Colagem de Vidro (por unidade)
  - Visita Técnica/Diagnóstico (preço fixo)
- Calcular subtotal, desconto e total
- Status: Rascunho, Enviado, Aprovado, Cancelado
- **Gerar PDF profissional** com:
  - Header com logo e dados da empresa
  - Informações do cliente
  - Tabela de serviços
  - Resumo financeiro
  - Condições de pagamento
  - Validade (10 dias)
  - Texto legal e garantia
  - Campo para assinatura

### ✅ Ordens de Serviço
- Listar ordens de serviço
- Visualizar detalhes (estrutura preparada)

## 🚧 Funcionalidades Pendentes

### Ordem de Serviço (OS)
- [ ] Criar OS automaticamente quando orçamento é aprovado
- [ ] Página de detalhes da OS
- [ ] Checklist interativo
- [ ] Campo de observações técnicas
- [ ] Atribuir técnico
- [ ] Agendar data

### Melhorias Futuras
- [ ] Relatórios e gráficos no Dashboard
- [ ] Filtros avançados em listagens
- [ ] Exportação de dados
- [ ] Notificações
- [ ] Histórico de alterações

## 📄 Estrutura de Dados (Firestore)

### Collection: `clients`
```typescript
{
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
}
```

### Collection: `quotes`
```typescript
{
  clientId: string;
  clientName: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `workOrders`
```typescript
{
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  technician: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  checklist: { task: string; completed: boolean }[];
  notes: string;
}
```

## 🚀 Deploy na Vercel

1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

2. Na pasta `dashboard/`, execute:
```bash
vercel
```

3. Siga as instruções e configure as variáveis de ambiente no painel da Vercel.

**OU** conecte o repositório GitHub diretamente na Vercel e configure:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## 📝 Notas Importantes

1. **Independência:** O dashboard é completamente independente do site Astro. Pode ser deployado separadamente.

2. **Firebase:** Você precisará fornecer as credenciais do Firebase para que o sistema funcione.

3. **PDF:** O componente PDF usa `@react-pdf/renderer` e gera PDFs profissionais no lado do cliente.

4. **Mobile:** O layout é responsivo e funciona bem em dispositivos móveis (importante para técnicos em campo).

5. **Segurança:** Certifique-se de configurar as regras do Firestore adequadamente para proteger os dados.

## 🎯 Próximos Passos

1. Configure o Firebase e adicione as credenciais no `.env`
2. Crie o primeiro usuário no Firebase Authentication
3. Teste o fluxo completo: Cliente → Orçamento → PDF
4. Implemente a conversão de Orçamento Aprovado em OS
5. Adicione a página de detalhes da OS com checklist




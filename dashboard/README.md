# House Manutenção - Dashboard

Sistema de gestão para House Manutenção - CRM, Orçamentos e Ordens de Serviço.

## 🚀 Tecnologias

- **React** + **TypeScript** + **Vite**
- **Firebase** (Authentication + Firestore)
- **Tailwind CSS** + **ShadcnUI** (UI Components)
- **React Router DOM** (Routing)
- **@react-pdf/renderer** (PDF Generation)
- **Lucide React** (Icons)

## 📦 Instalação

```bash
cd dashboard
npm install
```

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure suas credenciais do Firebase no arquivo `.env`

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
dashboard/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ui/          # Componentes de UI base
│   │   ├── Layout.tsx   # Layout principal
│   │   └── ClientForm.tsx
│   ├── contexts/        # Contextos React
│   │   └── AuthContext.tsx
│   ├── lib/            # Utilitários e configurações
│   │   ├── firebase.ts
│   │   └── utils.ts
│   ├── pages/          # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx
│   │   ├── Quotes.tsx
│   │   ├── QuoteNew.tsx
│   │   └── WorkOrders.tsx
│   ├── App.tsx         # Componente principal
│   └── main.tsx        # Entry point
```

## 🔐 Autenticação

O sistema utiliza Firebase Authentication. Você precisará configurar:

1. Criar um projeto no Firebase Console
2. Habilitar Authentication (Email/Password)
3. Criar um banco de dados Firestore
4. Configurar as regras de segurança

## 📄 Funcionalidades

### ✅ Implementado
- Sistema de autenticação
- Dashboard com estatísticas
- CRUD de Clientes
- Criação e edição de Orçamentos
- Listagem de Ordens de Serviço

### 🚧 Pendente
- Geração de PDF (Componente QuotePDF)
- Conversão de Orçamento Aprovado em OS
- Visualização detalhada de OS
- Edição de OS com checklist

## 🎨 Design System

- **Cores Principais:**
  - Navy: `#0F172A`
  - Gold: `#C5A059`
  - Background: `#F9FAFB`

- **Tipografia:**
  - Sans: Inter
  - Serif: Playfair Display (para logos)

## 📝 Próximos Passos

1. Implementar componente `QuotePDF` com @react-pdf/renderer
2. Adicionar lógica para converter Orçamento Aprovado em OS
3. Implementar página de detalhes da OS com checklist interativo
4. Adicionar relatórios e gráficos no Dashboard





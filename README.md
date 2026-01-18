# House Manutenção - Engenharia de Precisão em Cortinas de Vidro

Site de alta conversão para manutenção de cortinas de vidro em Belo Horizonte, Nova Lima e região.

## 🚀 Tecnologias

- **Astro** - Framework estático para performance máxima
- **React** - Interatividade (Modais, Carrosséis, Animações)
- **Tailwind CSS** - Sistema de design utilitário
- **Framer Motion** - Animações fluidas e complexas
- **Lenis** - Smooth scroll premium
- **TypeScript** - Type safety

## 📦 Instalação

```bash
npm install
```

## 🛠️ Desenvolvimento

```bash
npm run dev
```

O site estará disponível em `http://localhost:4321`

## 🏗️ Build

```bash
npm run build
```

## 📝 Características

### Design System
- **Paleta de Cores:** Void Black, Deep Navy, Paper White, Liquid Gold
- **Tipografia:** Playfair Display (Serif) + Manrope (Sans)
- **Efeitos:** Glassmorphism, Gradientes dourados, Animações suaves

### Funcionalidades
- ✅ Captura automática de GCLID e UTM parameters
- ✅ Smooth scroll com Lenis
- ✅ Animações com Framer Motion
- ✅ Modal de conversão integrado com WhatsApp
- ✅ Header sticky com glassmorphism
- ✅ Contadores animados
- ✅ Carrossel de depoimentos
- ✅ Marquee infinito de condomínios
- ✅ Cards 3D interativos

### Performance
- ⚡ 100/100 PageSpeed (otimizado)
- 🎯 SEO otimizado
- 📱 Totalmente responsivo
- 🎨 Animações performáticas

## 📁 Estrutura

```
src/
├── components/
│   ├── ui/           # Componentes reutilizáveis
│   ├── Header.astro  # Header sticky
│   ├── Hero.tsx      # Seção hero
│   ├── Marquee.astro # Marquee infinito
│   ├── StatsCounter.tsx # Contadores animados
│   ├── PainPoints.astro # Pontos de dor
│   ├── Solution.astro   # Solução
│   ├── Testimonials.tsx  # Depoimentos
│   ├── WhatsAppModal.tsx # Modal de conversão
│   └── Footer.astro      # Footer
├── layouts/
│   └── Layout.astro     # Layout principal
├── pages/
│   └── index.astro      # Página principal
├── scripts/
│   └── lenis.ts         # Configuração Lenis
└── styles/
    └── global.css        # Estilos globais
```

## 🔧 Configuração

### WhatsApp Number
Edite `src/components/WhatsAppModal.tsx` e altere a variável `whatsappNumber` com seu número.

### Tracking
O sistema captura automaticamente:
- `gclid` (Google Click ID)
- `utm_source`
- `utm_medium`
- `utm_campaign`

Os parâmetros são armazenados em `sessionStorage` e enviados junto com o formulário.

## 🎨 Customização

### Cores
Edite `tailwind.config.mjs` para personalizar a paleta de cores.

### Fontes
As fontes são carregadas via `@fontsource`. Para alterar, edite `src/layouts/Layout.astro`.

## 📄 Licença

Proprietário - House Manutenção





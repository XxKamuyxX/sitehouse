# Guia de Deploy - House Manutenção

## 🚀 Deploy Rápido

### Vercel (Recomendado)

1. **Conecte seu repositório:**
   ```bash
   # Instale a CLI da Vercel
   npm i -g vercel
   
   # Faça login
   vercel login
   
   # Deploy
   vercel
   ```

2. **Ou via Dashboard:**
   - Acesse [vercel.com](https://vercel.com)
   - Importe seu repositório
   - Configure:
     - Framework Preset: **Astro**
     - Build Command: `npm run build`
     - Output Directory: `dist`

### Netlify

1. **Via CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

2. **Via Dashboard:**
   - Conecte o repositório
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

### Configurações Importantes

#### Variáveis de Ambiente (se necessário)
- `WHATSAPP_NUMBER`: Número do WhatsApp (formato: 5531999999999)

#### Antes do Deploy

1. **Atualize o número do WhatsApp:**
   - Edite `src/components/WhatsAppModal.tsx`
   - Altere a variável `whatsappNumber` na linha ~95

2. **Otimize imagens:**
   - As imagens estão usando Unsplash
   - Para produção, substitua por imagens otimizadas locais
   - Use `@astrojs/image` ou similar

3. **Teste o tracking:**
   - Acesse: `https://seusite.com/?gclid=test123&utm_source=google`
   - Verifique no console se os parâmetros foram capturados

## 📊 Performance

### Checklist de Otimização

- ✅ Astro Static Site Generation
- ✅ Lazy loading de componentes React
- ✅ Fontes otimizadas via @fontsource
- ✅ CSS crítico inline
- ✅ Imagens com loading="lazy"

### PageSpeed Score

Após o deploy, teste em:
- [PageSpeed Insights](https://pagespeed.web.dev/)
- Meta: **100/100** em Performance

## 🔍 SEO

### Meta Tags
Já configuradas no `Layout.astro`. Adicione:
- Open Graph tags (se necessário)
- Twitter Cards (se necessário)

### Sitemap
Astro gera automaticamente. Acesse: `https://seusite.com/sitemap.xml`

## 📱 Testes

Antes de ir ao ar:
- [ ] Teste em mobile (Chrome DevTools)
- [ ] Teste formulário de contato
- [ ] Verifique tracking (GCLID/UTM)
- [ ] Teste smooth scroll
- [ ] Verifique animações
- [ ] Teste em diferentes navegadores

## 🎯 Analytics

### Google Analytics (Opcional)

1. Adicione o script no `Layout.astro`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

2. Configure eventos de conversão para o formulário

## 🔧 Troubleshooting

### Smooth Scroll não funciona
- Verifique se `LenisInit` está sendo carregado
- Confirme que `@studio-freight/lenis` está instalado

### Modal não abre
- Verifique se `WhatsAppModal` tem `client:load`
- Confirme que o evento customizado está sendo disparado

### Animações travando
- Verifique se `framer-motion` está instalado
- Confirme que componentes React têm `client:load`





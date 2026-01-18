# 🚀 Início Rápido - Sistema de Gêmeo Digital

**Comece a usar em 15 minutos!**  
**Data:** 18 de Janeiro de 2026

---

## ✅ O Que Você Tem Agora

Após as 5 fases de desenvolvimento, você possui:

- ✅ **Studio Mode** - Gerar thumbnails automaticamente
- ✅ **Template Manager** - Criar templates com motor de engenharia
- ✅ **Proposta Cliente** - Página pública interativa
- ✅ **31 Materiais** - Cores realistas de vidro e alumínio
- ✅ **8 Motores** - Configurados e prontos para uso
- ✅ **13 Thumbnails** - Pré-renderizados

---

## 🎯 Passo a Passo: Primeiros 15 Minutos

### 1️⃣ Instalar Dependências (se ainda não instalou)

```bash
cd dashboard
npm install framer-motion
```

**Tempo:** 1 minuto

---

### 2️⃣ Atualizar Número do WhatsApp

```bash
# Abrir arquivo
src/pages/PropostaCliente.tsx
```

**Procurar linha ~90:**
```typescript
const whatsappUrl = `https://wa.me/5511999999999?text=...`;
                              ↑
                    TROCAR PELO SEU NÚMERO
```

**Exemplo:**
```typescript
// Número: (11) 98765-4321
const whatsappUrl = `https://wa.me/5511987654321?text=...`;
```

**Tempo:** 1 minuto

---

### 3️⃣ Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Tempo:** 30 segundos

---

### 4️⃣ Acessar Studio Mode

```
http://localhost:5173/admin/studio
```

**O que fazer:**
- ✅ Verificar se 13 thumbnails renderizaram
- ✅ Clicar em "Baixar PNG" em alguns
- ✅ Salvar em uma pasta (ex: `thumbnails/`)

**Tempo:** 3 minutos

---

### 5️⃣ Criar Seu Primeiro Template

```
http://localhost:5173/master/templates
```

**Passo a passo:**
1. Nome: "Sacada KS 8 Folhas"
2. Categoria: "Cobertura"
3. Tipo de Motor: "Sacada KS (Empilhável)"
4. JSON é preenchido automaticamente
5. Clique em "Testar" para visualizar
6. Upload da imagem do Studio
7. Clique em "Salvar Projeto"

**Tempo:** 3 minutos

---

### 6️⃣ Popular Templates Iniciais (Script Seed)

```bash
npm run seed:templates
```

**O que faz:**
- Popula 5 templates básicos no Firestore
- Sacada KS, Janela 4 Folhas, Janela 2 Folhas, Box, Guarda-Corpo
- Cada um com engine_config completo

**Tempo:** 1 minuto

---

### 7️⃣ Criar Orçamento de Teste

**Manualmente no Firestore Console:**

```javascript
// Collection: quotes
// Document: test123
{
  clientName: "João Silva",
  companyId: "SEU_COMPANY_ID",
  items: [
    {
      serviceName: "Sacada KS 8 Folhas",
      quantity: 1,
      unitPrice: 5355,
      total: 5355,
      dimensions: { width: 6.5, height: 2.4 },
      glassColor: "incolor",
      profileColor: "branco_fosco",
      imageUrl: "URL_DA_IMAGEM_DO_STUDIO",
      engine_config_snapshot: {
        engine_id: "sacada_ks",
        regras_fisicas: {
          tipo_movimento: "empilhavel",
          tem_pivo: true,
          folgas: { padrao: 15, lateral: 20, superior: 15, inferior: 15 },
        },
      },
    },
  ],
  total: 5355,
  status: "pending",
  createdAt: new Date(),
}
```

**Tempo:** 5 minutos

---

### 8️⃣ Testar Proposta Cliente

```
http://localhost:5173/proposta/test123
```

**O que verificar:**
- ✅ Header exibe logo e nome
- ✅ Cliente "João Silva" aparece
- ✅ Valor total R$ 5.355,00
- ✅ Item "Sacada KS" está listado
- ✅ Clicar no item → expande
- ✅ Renderização interativa aparece
- ✅ Botão WhatsApp está visível
- ✅ Clicar no botão → abre WhatsApp

**Tempo:** 2 minutos

---

## 🎉 Parabéns! Sistema Funcionando!

**Tempo total:** 15 minutos

---

## 📋 Checklist Pós-Instalação

### Configurações Obrigatórias:
- [ ] Número do WhatsApp atualizado em `PropostaCliente.tsx`
- [ ] Logo da empresa no Firestore (`companies` collection)
- [ ] Nome da empresa no Firestore
- [ ] Firebase configurado (já deve estar)
- [ ] Storage configurado (já deve estar)

### Testes Essenciais:
- [ ] Studio Mode renderiza thumbnails
- [ ] Template Manager salva templates
- [ ] Script seed popula templates
- [ ] Proposta Cliente carrega orçamento
- [ ] Accordion expande/fecha
- [ ] Renderização interativa funciona
- [ ] Botão WhatsApp abre corretamente

### Customizações Recomendadas:
- [ ] Adicionar mais configs ao Studio (opcional)
- [ ] Personalizar cores (opcional)
- [ ] Ajustar mensagem WhatsApp (opcional)
- [ ] Adicionar logo da empresa (recomendado)

---

## 🎯 Próximos Passos Recomendados

### Curto Prazo (Esta Semana):

1. **Gerar Catálogo Completo**
   ```
   - Acessar Studio Mode
   - Baixar todas as 13 imagens
   - Adicionar mais configs (variações)
   - Baixar mais imagens
   ```

2. **Criar Templates no Manager**
   ```
   - Usar imagens do Studio
   - Configurar motores
   - Testar renderização
   - Salvar no sistema
   ```

3. **Criar Orçamentos de Teste**
   ```
   - Manualmente no Firestore (por enquanto)
   - Testar proposta cliente
   - Compartilhar link com equipe
   - Validar experiência
   ```

---

### Médio Prazo (Próximas 2 Semanas):

4. **Implementar Quote New Completo** (Fase 6)
   ```
   - Seletor de templates
   - Formulário de dimensões
   - Cálculo automático
   - Geração de link /proposta
   ```

5. **Treinar Equipe**
   ```
   - Como usar Studio Mode
   - Como criar templates
   - Como criar orçamentos
   - Como enviar propostas
   ```

6. **Testar com Clientes Reais**
   ```
   - Enviar 10 propostas teste
   - Coletar feedback
   - Ajustar conforme necessário
   ```

---

### Longo Prazo (Próximo Mês):

7. **Assinatura Digital** (Fase 7)
8. **Pagamento Online** (Fase 8)
9. **Analytics e Relatórios** (Fase 9)
10. **Deploy em Produção**

---

## 🔧 Solução de Problemas

### Problema 1: Thumbnails não renderizam no Studio

**Causa:** Falta dependência ou erro no canvas

**Solução:**
```bash
# Verificar console do navegador (F12)
# Se erro de import, instalar dependências:
npm install
```

---

### Problema 2: Proposta Cliente não carrega

**Causa:** ID inválido ou orçamento não existe

**Solução:**
```
1. Verificar se ID está correto
2. Verificar no Firestore se documento existe
3. Verificar permissões (security rules)
```

---

### Problema 3: WhatsApp não abre

**Causa:** Número inválido ou formato errado

**Solução:**
```typescript
// Formato correto:
https://wa.me/5511987654321
            ↑  ↑
            │  └─ Número com DDD (sem espaços, sem hífen)
            └─ Código do país (55 para Brasil)
```

---

### Problema 4: Renderização interativa não aparece

**Causa:** Item não tem `engine_config_snapshot`

**Solução:**
```
1. Verificar se template tem engine_config
2. Verificar se item foi salvo com snapshot
3. Ver console para erros
```

---

## 📞 Suporte

### Documentação:
- **RESUMO_COMPLETO_TODAS_AS_FASES.md** - Visão geral
- **GUIA_STUDIO_MODE.md** - Como usar Studio
- **GUIA_TEMPLATE_MANAGER_ATUALIZADO.md** - Como criar templates
- **GUIA_PROPOSTA_CLIENTE.md** - Como funciona a proposta

### Arquivos de Referência:
- **src/engines/types.ts** - Tipos TypeScript
- **src/constants/materiais.js** - Cores disponíveis
- **EXEMPLO_INTEGRACAO.tsx** - Exemplos de código

---

## 🎉 Você Está Pronto!

Agora você tem um **sistema completo de Gêmeo Digital** funcionando!

### O Que Fazer Agora:

1. ✅ Gerar thumbnails no Studio
2. ✅ Criar templates no Manager
3. ✅ Criar orçamento de teste
4. ✅ Testar proposta cliente
5. ✅ Compartilhar com equipe
6. ✅ Validar com cliente real
7. ✅ Expandir catálogo

---

**Preparado por:** Equipe de Desenvolvimento  
**Data:** 18 de Janeiro de 2026  
**Versão:** 1.0.0

---

🚀 **Comece Agora! Sistema Pronto para Uso!**

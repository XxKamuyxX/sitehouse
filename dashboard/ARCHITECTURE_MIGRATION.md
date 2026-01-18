# 🏗️ Arquitetura: React Router → Next.js App Router

## ⚠️ Situação Atual

O projeto atual usa:
- **React Router v6** (`react-router-dom`)
- **Vite** como build tool
- **SPA (Single Page Application)** com client-side routing

## 🎯 Objetivo

O usuário deseja usar **Next.js Route Groups** para separar:
- **Marketing Site** (`(marketing)`) - Landing Page pública
- **Dashboard App** (`(dashboard)`) - Aplicação SaaS com Sidebar

## 🔄 Opções de Migração

### Opção 1: Migração Completa para Next.js (Recomendada)

**Vantagens:**
- ✅ Route Groups nativos
- ✅ Server-Side Rendering (SSR)
- ✅ Static Site Generation (SSG)
- ✅ API Routes integradas (já temos `/api` routes que podem ser migradas)
- ✅ Melhor SEO para marketing pages
- ✅ Otimizações automáticas de performance

**Desvantagens:**
- ⚠️ Refatoração significativa
- ⚠️ Mudança na estrutura de arquivos
- ⚠️ Adaptação de componentes
- ⚠️ Mudança no sistema de build

**Tempo Estimado:** 2-3 dias

### Opção 2: Simular Route Groups com React Router

**Vantagens:**
- ✅ Mudança mínima no código existente
- ✅ Mantém Vite e estrutura atual
- ✅ Implementação rápida

**Desvantagens:**
- ⚠️ Não é Route Groups "real"
- ⚠️ Menos otimizações automáticas
- ⚠️ Precisa manter dois layouts manualmente

**Tempo Estimado:** 2-3 horas

## 📋 Recomendação

**Para produção e escalabilidade, recomendo a Opção 1 (Next.js)**, pois:
1. As API routes (`/api/stripe/*`, `/api/webhooks/*`) já estão estruturadas como Next.js API routes
2. Route Groups permitem melhor organização
3. Melhor SEO para landing pages
4. Performance otimizada out-of-the-box

## ❓ Decisão Necessária

**O que você prefere?**
1. **Migração completa para Next.js** (mais trabalho, melhor resultado)
2. **Estrutura similar com React Router** (menos trabalho, funcionalidade similar)

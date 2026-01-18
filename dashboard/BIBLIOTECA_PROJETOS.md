# 📚 Biblioteca de Projetos - Guia Completo

## 🎯 Visão Geral

O sistema de Biblioteca de Projetos permite que o **Master** gerencie templates personalizados de instalação e manutenção que serão exibidos para todos os usuários do sistema.

---

## 🔑 Acesso Master

1. Faça login com uma conta **master**
2. Acesse o menu lateral
3. Clique em **"📚 Biblioteca de Projetos"**

---

## ➕ Como Adicionar um Novo Template

### **Passo 1: Clique em "Novo Template"**

### **Passo 2: Preencha os Campos**

#### **Campos Obrigatórios:**
- **Título** - Nome do serviço
  - Exemplo: `Janela 4 Folhas`
  
- **Profissão** - Área de atuação
  - Opções: Vidraçaria, Elétrica, Hidráulica, Pintura, Marcenaria, Alvenaria, Outros
  
- **Tipo** - Tipo de serviço
  - **Instalação** - Para novos projetos
  - **Manutenção** - Para reparos e manutenções
  
- **Categoria** - Categoria específica
  - Para Vidraçaria: Box, Janela, Porta, Sacada, Espelho, Guarda-Corpo, Divisório, Vidro Fixo, Outros

#### **Campos Opcionais:**
- **Descrição** - Detalhes do serviço
  - Exemplo: `Janela 4 folhas - 2 fixas e 2 móveis`
  
- **Imagem** - Foto do projeto
  - Formatos: PNG, JPG
  - Tamanho máximo: 5MB
  - Recomendado: 800x600px ou superior

### **Passo 3: Clique em "Criar Template"**

---

## 📝 Exemplo Prático

### **Template de Janela 4 Folhas:**

```
Título: Janela 4 Folhas
Descrição: Janela de correr com 4 folhas - 2 fixas e 2 móveis em vidro temperado 8mm
Profissão: Vidraçaria
Tipo: Instalação
Categoria: Janela
Imagem: [Upload da foto da janela]
```

### **Resultado:**
- ✅ Template aparece na seleção de serviços de **Instalação > Janela**
- ✅ Imagem é exibida ao lado do nome do serviço
- ✅ Badge "Template Personalizado" identifica o template
- ✅ Imagem aparece no **PDF do orçamento** quando selecionado

---

## 🔄 Fluxo Completo

### **1. Master Adiciona Template**
```
Master > Biblioteca de Projetos > Novo Template
↓
Preenche dados + Upload da imagem
↓
Salva no Firestore + Storage
```

### **2. Usuário Cria Orçamento**
```
Usuário > Novo Orçamento > Instalação
↓
Seleciona Categoria (ex: Janela)
↓
VÊ O TEMPLATE com imagem na lista
↓
Clica no template
↓
Modal abre com nome pré-preenchido
↓
Adiciona medidas, cores, preço
↓
Salva item no orçamento
```

### **3. Cliente Vê o PDF**
```
PDF é gerado com:
- Nome do serviço
- IMAGEM do template
- Descrição
- Quantidade e valores
```

---

## 🎨 Organização dos Templates

### **Por Profissão:**
- 🪟 Vidraçaria
- ⚡ Elétrica
- 💧 Hidráulica
- 🎨 Pintura
- 🪚 Marcenaria
- 🧱 Alvenaria
- 📦 Outros

### **Por Tipo:**
- 🔨 Instalação - Projetos novos
- 🔧 Manutenção - Reparos e ajustes

### **Por Categoria (Vidraçaria):**
- Box
- Janela
- Porta
- Sacada
- Espelho
- Guarda-Corpo
- Divisório
- Vidro Fixo
- Outros

---

## 🔍 Busca e Filtros

### **Barra de Busca:**
- Busca por **título** ou **descrição**
- Exemplo: Digite "janela" para ver todos os templates de janela

### **Filtros:**
1. **Profissão** - Filtra por área
2. **Tipo** - Instalação ou Manutenção
3. **Categoria** - Categoria específica

---

## ✏️ Editar Template

1. Encontre o template na biblioteca
2. Clique em **"Editar"**
3. Modifique os campos desejados
4. Para trocar a imagem:
   - Clique no **X** na imagem atual
   - Faça upload da nova imagem
5. Clique em **"Salvar Alterações"**

---

## 🗑️ Excluir Template

1. Encontre o template na biblioteca
2. Clique no ícone de **lixeira** 🗑️
3. Confirme a exclusão
4. ⚠️ **Atenção:** 
   - Template será removido permanentemente
   - Imagem será deletada do Storage
   - Orçamentos já criados não serão afetados

---

## 📊 Vantagens do Sistema

### **Para o Master:**
✅ Controle centralizado de todos os templates  
✅ Facilita padronização dos serviços  
✅ Imagens ajudam na apresentação visual  
✅ Organização por profissão e categoria  

### **Para os Usuários:**
✅ Seleção mais rápida de serviços  
✅ Visualização clara com imagens  
✅ Templates pré-configurados  
✅ PDFs mais profissionais  

### **Para os Clientes:**
✅ PDFs com imagens dos projetos  
✅ Melhor compreensão do serviço  
✅ Apresentação mais profissional  
✅ Facilita tomada de decisão  

---

## 🚀 Dicas de Uso

### **Boas Práticas:**
1. ✅ Use fotos reais dos projetos executados
2. ✅ Mantenha imagens em boa qualidade (mínimo 800x600px)
3. ✅ Escreva descrições claras e objetivas
4. ✅ Organize bem as categorias
5. ✅ Mantenha a biblioteca atualizada

### **O que Evitar:**
1. ❌ Imagens de baixa qualidade
2. ❌ Arquivos muito grandes (acima de 5MB)
3. ❌ Descrições vagas ou confusas
4. ❌ Duplicar templates desnecessariamente

---

## 🔒 Segurança

- ✅ Apenas **master** pode adicionar/editar/excluir templates
- ✅ Imagens são armazenadas no **Firebase Storage**
- ✅ Templates são salvos no **Firestore**
- ✅ Usuários normais têm acesso **somente leitura**

---

## 📱 Compatibilidade

- ✅ Funciona em desktop e mobile
- ✅ Imagens são otimizadas automaticamente
- ✅ PDFs gerados com imagens em alta qualidade
- ✅ Compatible com todos os navegadores modernos

---

## 🆘 Suporte

Se tiver dúvidas ou problemas:
1. Verifique se os campos obrigatórios estão preenchidos
2. Certifique-se de que a imagem está no formato correto (PNG/JPG)
3. Verifique o tamanho da imagem (máximo 5MB)
4. Entre em contato com o suporte técnico

---

## 📝 Resumo Rápido

```
1. Master > Biblioteca de Projetos
2. Novo Template
3. Preenche: Título, Profissão, Tipo, Categoria
4. Upload da imagem
5. Salvar
6. Template aparece automaticamente para os usuários
7. Imagem aparece nos orçamentos e PDFs
```

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0

# Guia para Adicionar Novos Posts no Blog

## Como Adicionar um Novo Post

### 1. Criar o Arquivo

Crie um novo arquivo na pasta `src/content/blog/` com o nome do post seguido de `.md`

**Exemplo:** `src/content/blog/meu-novo-post.md`

### 2. Estrutura do Post

Cada post deve começar com um "frontmatter" (cabeçalho) em YAML:

```markdown
---
title: "Título do Post"
description: "Descrição curta do post que aparece na listagem"
pubDate: 2024-02-01
author: "House Manutenção"
tags: ["tag1", "tag2", "tag3"]
image: "/images/projeto-1.jpeg"
draft: false
---
```

### 3. Campos Obrigatórios

- **title**: Título do post
- **description**: Descrição que aparece na listagem
- **pubDate**: Data de publicação (formato: YYYY-MM-DD)
- **author**: Autor do post (padrão: "House Manutenção")

### 4. Campos Opcionais

- **tags**: Array de tags (ex: ["manutenção", "dicas"])
- **image**: Caminho da imagem (ex: "/images/projeto-1.jpeg")
- **draft**: Se `true`, o post não aparece em produção

### 5. Conteúdo

Após o frontmatter, escreva o conteúdo em Markdown:

```markdown
# Título Principal

Texto do parágrafo...

## Subtítulo

Mais conteúdo...
```

### 6. Exemplo Completo

```markdown
---
title: "Como Escolher a Melhor Cortina de Vidro"
description: "Guia completo para escolher a cortina de vidro ideal para sua residência"
pubDate: 2024-02-01
author: "House Manutenção"
tags: ["dicas", "escolha", "cortina"]
image: "/images/projeto-1.jpeg"
---

# Como Escolher a Melhor Cortina de Vidro

Conteúdo do post aqui...

## Fatores Importantes

- Qualidade do vidro
- Sistema de deslizamento
- Vedação adequada
```

## Formatação Markdown

### Títulos
```markdown
# Título Principal (H1)
## Subtítulo (H2)
### Sub-subtítulo (H3)
```

### Texto
```markdown
**negrito**
*itálico*
```

### Listas
```markdown
- Item 1
- Item 2
- Item 3

1. Item numerado
2. Item numerado
```

### Links
```markdown
[Texto do link](https://url.com)
```

## Imagens

Use imagens da pasta `public/images/`:

```markdown
![Descrição da imagem](/images/nome-da-imagem.jpg)
```

## Publicar o Post

1. Salve o arquivo `.md` na pasta `src/content/blog/`
2. Execute `npm run build` para gerar o site
3. O post aparecerá automaticamente na página `/blog`

## Dicas

- Use títulos descritivos e chamativos
- Inclua imagens relevantes
- Use tags para categorizar os posts
- Mantenha a descrição curta e atrativa
- Use formatação Markdown para melhor legibilidade





# Technical writing authoring guide

Technical notes are repository-owned plain Markdown files. React supplies the presentation, navigation, code controls, and related-project context; article files contain no JSX or MDX.

## Content directories

- `src/content/notes/drafts/` contains local authoring previews.
- `src/content/notes/published/` contains published notes.
- The filename becomes the route slug: `dependency-direction.md` becomes `/notes/dependency-direction`.
- Filenames must be unique, lowercase, and kebab-case across both directories.

The development server exposes valid drafts under `/notes/:slug` and labels them `DRAFT`. Production builds exclude drafts from the visible catalogue, index, and article lookup.

## Reusable article template

````markdown
---
title: "Article title"
description: "A concise description used by the Notes index and article header."
publishedAt: "2026-08-18"
updatedAt: "2026-08-20"
draft: true
tags:
  - architecture
  - maintainability
technologies:
  - C#
  - TypeScript
series:
  name: "Optional series name"
  order: 1
relatedProjects:
  - little-worlds
featured: false
---

Opening prose can use **emphasis**, [links](https://example.com), and `inline code`.

## First meaningful section

- Unordered item
- Another item

1. Ordered step
2. Next step

> A useful quotation or callout.

```typescript
export function ordinaryCodeBlock(): boolean {
  return true
}
```

## Equivalent implementations

The explanation remains outside the group and appears only once.

:::code-tabs

```csharp
public static bool IsReady() => true;
```

```typescript
export const isReady = (): boolean => true
```

```python
def is_ready() -> bool:
    return True
```

:::

| Concern | Approach |
| --- | --- |
| Portability | Plain Markdown |
| Presentation | React components |

![Meaningful alternative text](/tech/notes/example/image.png)

---

Closing prose.
````

For a new draft, omit `publishedAt` instead of inventing a date. Before publication:

1. Complete and review the article.
2. Set `draft: false`.
3. Add the real `publishedAt` date and optional `updatedAt` date.
4. Move the file from `drafts/` to `published/`.
5. Run `npm run content:check`, followed by the normal project validation.

## Frontmatter rules

- `title` and `description` are required non-empty strings.
- `draft` must be explicitly `true` or `false`.
- Published notes require a real `publishedAt` value in `YYYY-MM-DD` format.
- `updatedAt` is optional and cannot precede `publishedAt`.
- `tags` and `technologies` are optional string lists.
- `series` is optional and requires a name plus a positive integer order.
- `relatedProjects` is optional and accepts only IDs from the shared project data.
- `featured` is optional and defaults to `false`.

Invalid dates, duplicate slugs, malformed metadata, unknown project IDs, and malformed code-tab groups fail content validation.

## Code blocks and language tabs

Ordinary fenced blocks receive syntax highlighting, a language label when recognised, horizontal overflow, and a copy action. Supported aliases include:

- `csharp`, `cs`
- `typescript`, `ts`
- `javascript`, `js`
- `python`, `py`
- `json`
- `bash`, `shell`
- `powershell`, `ps1`
- `sql`
- `html`
- `css`
- `text`, `plaintext`

A `:::code-tabs` group must contain at least two labelled fenced blocks. It cannot repeat a canonical language. Selecting a language stores the preference under `ferdinraphael.tech.preferred-code-language` and synchronises compatible groups. A group that lacks the preferred language falls back to its first example without changing the stored preference.

## Markdown and safety

The renderer supports headings, paragraphs, emphasis, lists, links, images, blockquotes, inline code, fenced code, tables, horizontal rules, and GitHub-flavoured Markdown conventions provided by the parser. Heading IDs follow GitHub-style slugging and feed the article table of contents.

Do not place raw HTML or scripts in an article. Raw HTML is rendered inert rather than executed. External links receive safe new-tab attributes, and unsafe URL schemes are discarded.

Run this before committing article changes:

```bash
npm run content:check
```

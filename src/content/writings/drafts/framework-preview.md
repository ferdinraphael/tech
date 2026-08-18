---
title: "Technical writing framework preview"
description: "A development-only fixture for reviewing Markdown structure, code presentation, and reader controls."
format: article
draft: true
tags:
  - framework-preview
  - authoring
technologies:
  - C#
  - TypeScript
  - Python
series:
  name: "Framework previews"
  order: 1
relatedProjects:
  - little-worlds
featured: false
---

This page is a **framework preview**, not a published technical article. It exercises the writing system without making professional claims or inventing publication history.

> The content exists only to make the authoring and reading experience reviewable during development.

## What this fixture checks

The preview keeps ordinary Markdown readable while demonstrating:

- headings and direct anchor links
- ordered and unordered lists
- emphasis, links, and `inline code`
- normal fenced code with a language label
- equivalent examples grouped into accessible language tabs

1. Choose a language in one grouped example.
2. Continue reading without duplicated prose.
3. Copy only the code that is currently visible.

## A normal fenced block

Single-language blocks remain independent and do not change the saved language preference.

```json
{
  "mode": "framework-preview",
  "published": false
}
```

## Equivalent examples

The surrounding explanation appears once. Only the implementation changes.

:::code-tabs

```csharp
public static string Describe(string name)
{
    return $"Preview: {name}";
}
```

```typescript
export function describe(name: string): string {
  return `Preview: ${name}`
}
```

```python
def describe(name: str) -> str:
    return f"Preview: {name}"
```

:::

### Graceful preference fallback

This second group intentionally omits C#. If C# is preferred globally, this block falls back to its first language without changing the stored preference.

:::code-tabs

```typescript
const stages = ['parse', 'validate', 'render'] as const
```

```python
stages = ("parse", "validate", "render")
```

:::

## Portable Markdown elements

| Capability | Preview state |
| --- | --- |
| Plain Markdown source | Ready |
| Production draft exclusion | Ready |
| Multi-language preference | Ready |

A normal [Markdown link](https://commonmark.org/) remains portable, and a long identifier such as `ferdinraphael.tech.preferred-code-language` can wrap without widening the page.

---

The final article layout ends with related project context when frontmatter references a verified project.

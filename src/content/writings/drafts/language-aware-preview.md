---
title: "Language-aware writing preview"
description: "A development-only fixture for reviewing reader-specific technical prose."
format: article
draft: true
tags:
  - framework-preview
  - language-aware
technologies:
  - C#
  - Java
  - Python
readerLanguages:
  - csharp
  - java
  - python
defaultReaderLanguage: csharp
featured: false
---

This development fixture exercises synchronized language-aware prose and code.

## Start with a number

The same value can be described through each language's own model.

:::code-tabs

```csharp
int count = 10;
```

```java
int count = 10;
```

```python
count = 10
```

:::

::::language-content

:::language csharp
`count` is a **local variable** whose value is the integer `10`.
:::

:::language java
`count` is a **variable** of primitive type `int`, and its value is `10`.
:::

:::language python
The name `count` is **bound** to an integer object representing `10`.
:::

::::

## Change the value

:::code-tabs

```csharp
count = 11;
```

```java
count = 11;
```

```python
count = 11
```

:::

::::language-content

:::language csharp
The assignment updates the local variable.

- Read the [assignment](https://learn.microsoft.com/dotnet/csharp/language-reference/operators/assignment-operator) from right to left.
- Store the result in `count`.
:::

:::language java
The assignment updates the primitive variable.

- Evaluate the expression on the right.
- Store the resulting `int` in `count`.
:::

:::language python
The assignment rebinds the name.

- Evaluate the expression on the right.
- Bind `count` to the resulting object.
:::

::::

## Keep one stable outline

Only generic headings contribute to this page's Contents list.

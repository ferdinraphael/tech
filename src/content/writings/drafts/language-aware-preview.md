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

## Runtime model: number

The code and its conceptual runtime model form one language-aware teaching unit.

::::runtime-model

:::language csharp

```csharp
int count = 10;
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: count
        kind: variable
        label: count
        directValue:
          type: int
          value: "10"
    relationships: []
```

:::

:::language java

```java
int count = 10;
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: count
        kind: variable
        label: count
        directValue:
          type: int
          value: "10"
    relationships: []
```

:::

:::language python

```python
count = 10
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: count
        kind: name
        label: count
      - id: int-10
        kind: object
        typeLabel: int
        scalarValue: "10"
    relationships:
      - kind: binding
        from: count
        to: int-10
```

:::

::::

## Runtime model: object

Each language shows one source associated with one `Counter` object.

::::runtime-model

:::language csharp

```csharp
var a = new Counter { Value = 10 };
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: variable
        label: a
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: Value
            kind: property
            value: "10"
    relationships:
      - kind: reference
        from: a
        to: counter
```

:::

:::language java

```java
Counter a = new Counter(10);
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: variable
        label: a
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: value
            kind: field
            value: "10"
    relationships:
      - kind: reference
        from: a
        to: counter
```

:::

:::language python

```python
a = Counter(value=10)
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: name
        label: a
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: value
            kind: field
            value: "10"
    relationships:
      - kind: binding
        from: a
        to: counter
```

:::

::::

## Copy the object reference

Assigning `a` to `b` makes both sources identify the same `Counter` object.

::::language-content

:::language csharp

The reference value is copied, so both variables refer to the same object.

:::

:::language java

The object reference is copied, so both variables refer to the same object.

:::

:::language python

`b` becomes another name bound to the same object.

:::

::::

::::runtime-model

:::language csharp

```csharp
var a = new Counter { Value = 10 };
var b = a;
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: variable
        label: a
      - id: b
        kind: variable
        label: b
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: Value
            kind: property
            value: "10"
    relationships:
      - kind: reference
        from: b
        to: counter
      - kind: reference
        from: a
        to: counter
```

:::

:::language java

```java
Counter a = new Counter(10);
Counter b = a;
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: variable
        label: a
      - id: b
        kind: variable
        label: b
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: value
            kind: field
            value: "10"
    relationships:
      - kind: reference
        from: a
        to: counter
      - kind: reference
        from: b
        to: counter
```

:::

:::language python

```python
a = Counter(value=10)
b = a
```

```model
states:
  - id: current
    label: Current
    entities:
      - id: a
        kind: name
        label: a
      - id: b
        kind: name
        label: b
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - name: value
            kind: field
            value: "10"
    relationships:
      - kind: binding
        from: a
        to: counter
      - kind: binding
        from: b
        to: counter
```

:::

::::

## Keep one stable outline

Only generic headings contribute to this page's Contents list.

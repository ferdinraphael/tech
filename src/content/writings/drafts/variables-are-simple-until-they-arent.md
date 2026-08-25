---
title: "Variables Are Simple — Until They Aren't"
description: 'A practical look at what variables hold, what assignment copies, and what changes once objects enter the picture.'
format: article
draft: true
tags:
  - variables
  - memory
  - language-semantics
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

Variables are one of the first things we learn in programming.

The explanation is usually simple:

> A variable is a named location in memory where a value is stored.

It is a useful explanation. For simple cases, it tells us enough.

But eventually two assignments that look almost the same behave differently.

Then the useful question is no longer just _what value does this variable have?_

It is:

**What did the assignment copy?**

So rather than start with memory, let us start with the assignments themselves.

## The simple case

:::code-tabs

```csharp
int count = 10;
count = 20;
```

```java
int count = 10;
count = 20;
```

```python
count = 10
count = 20
```

:::

::::language-content

:::language csharp

`count` is a local `int` variable. It holds `10`, then `20`.

:::

:::language java

`count` is a variable of primitive type `int`. It holds `10`, then `20`.

:::

:::language python

`count` is a variable. It is `10`, then `20`.

:::

::::

Nothing surprising yet.

## What did `b = a` copy?

A second variable makes things more interesting.

:::code-tabs

```csharp
int a = 10;
int b = a;

b = 20;
```

```java
int a = 10;
int b = a;

b = 20;
```

```python
a = 10
b = a

b = 20
```

:::

At the end, `a` is `10` and `b` is `20`.

That looks like a simple copy.

But the important line is `b = a`.

::::language-content

:::language csharp

`int` is a value type, so `b = a` copies `10` into `b`.

From then on, `a` and `b` are independent. Changing `b` does not change `a`.

:::

:::language java

`int` is a primitive type, so `b = a` copies the primitive value `10` into `b`.

From then on, `a` and `b` are independent. Changing `b` does not change `a`.

:::

:::language python

Python treats an integer such as `10` as an object.

`b = a` does not create another copy of that object. Both variables refer to the same integer object.

Then `b = 20` makes `b` refer to a different integer object. `a` still refers to the original `10`.

:::

::::

::::language-only python

### Why that difference is hard to see

The result still looks exactly like a copied value: `a` is `10` and `b` is `20`.

The reason is that integer objects cannot be changed.

`b = 20` does not change the object representing `10`. It makes `b` refer to another integer object instead.

So nothing in this example exposes the moment when `a` and `b` referred to the same thing.

::::

::::language-content

:::language csharp

For an `int`, then, `b = a` really did copy the value.

:::

:::language java

For a primitive `int`, then, `b = a` really did copy the value.

:::

:::language python

The integer example leaves us with something we cannot observe yet: for a moment, both variables referred to the same thing.

:::

::::

A number is not enough to expose the next case. We need something with state of its own.

## A value with state

A tiny `Counter` is enough.

::::runtime-model

:::language csharp

```csharp
class Counter
{
    public int Value { get; set; }
}

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
class Counter {
    int value;

    Counter(int value) {
        this.value = value;
    }
}

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
class Counter:
    def __init__(self, value):
        self.value = value

a = Counter(10)
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

Here `Counter` is the class. The `Counter` created while the program is running is an object, with its own value of `10`.

::::language-content

:::language csharp

`a` does not contain that object itself. It holds a reference to it.

:::

:::language java

`a` does not contain that object itself. It holds a reference to it.

:::

:::language python

`a` refers to that object.

:::

::::

Now `b = a` is worth another look.

## Two variables, one object

This time, `b = a` does not give us a second `Counter`.

::::runtime-model

:::language csharp

```csharp
var a = new Counter { Value = 10 };
var b = a;
```

```model
states:
  - id: current
    label: After b = a
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
        from: a
        to: counter
      - kind: reference
        from: b
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
    label: After b = a
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
a = Counter(10)
b = a
```

```model
states:
  - id: current
    label: After b = a
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

::::language-content

:::language csharp

`b = a` copied the reference held by `a`.

There is still only one `Counter`. Both variables refer to it.

:::

:::language java

`b = a` copied the object reference held by `a`.

There is still only one `Counter`. Both variables refer to it.

:::

:::language python

`b = a` made `b` refer to the same object as `a`.

There is still only one `Counter`.

:::

::::

That difference matters as soon as the object changes.

## Changing the object

Suppose we change the counter through `b`.

::::runtime-model

:::language csharp

```csharp
var a = new Counter { Value = 10 };
var b = a;
b.Value = 20;
```

```model
states:
  - id: before
    label: Before b.Value = 20
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: Value, kind: property, value: "10" }
    relationships:
      - { kind: reference, from: a, to: counter }
      - { kind: reference, from: b, to: counter }
  - id: after
    label: After b.Value = 20
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: Value, kind: property, value: "20" }
    relationships:
      - { kind: reference, from: a, to: counter }
      - { kind: reference, from: b, to: counter }
```

:::

:::language java

```java
Counter a = new Counter(10);
Counter b = a;
b.value = 20;
```

```model
states:
  - id: before
    label: Before b.value = 20
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "10" }
    relationships:
      - { kind: reference, from: a, to: counter }
      - { kind: reference, from: b, to: counter }
  - id: after
    label: After b.value = 20
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "20" }
    relationships:
      - { kind: reference, from: a, to: counter }
      - { kind: reference, from: b, to: counter }
```

:::

:::language python

```python
a = Counter(10)
b = a
b.value = 20
```

```model
states:
  - id: before
    label: Before b.value = 20
    entities:
      - { id: a, kind: name, label: a }
      - { id: b, kind: name, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "10" }
    relationships:
      - { kind: binding, from: a, to: counter }
      - { kind: binding, from: b, to: counter }
  - id: after
    label: After b.value = 20
    entities:
      - { id: a, kind: name, label: a }
      - { id: b, kind: name, label: b }
      - id: counter
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "20" }
    relationships:
      - { kind: binding, from: a, to: counter }
      - { kind: binding, from: b, to: counter }
```

:::

::::

Now `a` also sees `20`.

Nothing was copied from `b` back into `a`. The `Counter` itself changed, and both variables still lead to that same object.

This is the part that the integer example could not make visible.

## Changing the variable

There is another operation that looks similar in code but does something quite different.

This time, instead of changing the existing `Counter`, we assign a new one to `b`.

::::runtime-model

:::language csharp

```csharp
var a = new Counter { Value = 10 };
var b = a;
b = new Counter { Value = 20 };
```

```model
states:
  - id: before
    label: Before b gets a new Counter
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter-original
        kind: object
        typeLabel: Counter
        members:
          - { name: Value, kind: property, value: "10" }
    relationships:
      - { kind: reference, from: a, to: counter-original }
      - { kind: reference, from: b, to: counter-original }
  - id: after
    label: After b gets a new Counter
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter-original
        kind: object
        typeLabel: Counter
        members:
          - { name: Value, kind: property, value: "10" }
      - id: counter-new
        kind: object
        typeLabel: Counter
        members:
          - { name: Value, kind: property, value: "20" }
    relationships:
      - { kind: reference, from: a, to: counter-original }
      - { kind: reference, from: b, to: counter-new }
```

:::

:::language java

```java
Counter a = new Counter(10);
Counter b = a;
b = new Counter(20);
```

```model
states:
  - id: before
    label: Before b gets a new Counter
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter-original
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "10" }
    relationships:
      - { kind: reference, from: a, to: counter-original }
      - { kind: reference, from: b, to: counter-original }
  - id: after
    label: After b gets a new Counter
    entities:
      - { id: a, kind: variable, label: a }
      - { id: b, kind: variable, label: b }
      - id: counter-original
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "10" }
      - id: counter-new
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "20" }
    relationships:
      - { kind: reference, from: a, to: counter-original }
      - { kind: reference, from: b, to: counter-new }
```

:::

:::language python

```python
a = Counter(10)
b = a
b = Counter(20)
```

```model
states:
  - id: before
    label: Before b gets a new Counter
    entities:
      - { id: a, kind: name, label: a }
      - { id: b, kind: name, label: b }
      - id: counter-original
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "10" }
    relationships:
      - { kind: binding, from: a, to: counter-original }
      - { kind: binding, from: b, to: counter-original }
  - id: after
    label: After b gets a new Counter
    entities:
      - { id: a, kind: name, label: a }
      - { id: b, kind: name, label: b }
      - id: counter-original
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "10" }
      - id: counter-new
        kind: object
        typeLabel: Counter
        members:
          - { name: value, kind: field, value: "20" }
    relationships:
      - { kind: binding, from: a, to: counter-original }
      - { kind: binding, from: b, to: counter-new }
```

:::

::::

The original `Counter` is still `10`.

`a` still leads to it. Only `b` changed where it leads.

That gives us two different kinds of change that are easy to confuse:

- changing the object;
- changing which object a variable refers to.

They can both involve `b`, but they are not the same operation.

## The memory question

We can now return to the explanation we started with:

> A variable is a named location in memory where a value is stored.

The problem is not that this explanation is always useless. It is that it compresses several different ideas into one sentence.

For the examples above, the first question was not really _where in memory is this stored?_

It was _what does this assignment mean in this language?_

::::language-content

:::language csharp

For an `int`, the variable contains the value itself.

For a `Counter`, the variable contains a reference value. The `Counter` object is separate from that variable.

:::

:::language java

For a primitive `int`, the variable contains the primitive value itself.

For a `Counter`, the variable contains an object reference. The `Counter` object is separate from that variable.

:::

:::language python

A variable refers to an object.

Assignment changes what a variable refers to; it does not copy the object unless we explicitly ask for a copy.

:::

::::

Only after that distinction is clear does it make sense to ask how a particular runtime lays those things out in memory.

And that is where the familiar shortcuts become dangerous.

## Stack and heap are not the definition

It is tempting to replace the first simplification with another one:

> Values live on the stack. Objects live on the heap.

That is not a safe definition either.

::::language-content

:::language csharp

A value type is not defined by living on the stack. A value can also be a field inside an object, an element in an array, or part of another value.

A reference can be held by a local variable, a field, an array element, or somewhere else entirely.

The language-level distinction is about value semantics and reference semantics, not about memorizing one physical location for each kind of type.

:::

:::language java

A primitive is not defined by being "on the stack", and a reference is not defined by being there either.

Primitives and references can appear as locals, fields, and array elements. The JVM and JIT are also free to optimize how values are represented while preserving Java's observable behavior.

The useful distinction here is primitive value versus object reference.

:::

:::language python

Python does not define variables in terms of a stack-versus-heap rule.

The language tells us how names and objects behave. The details of how a Python implementation stores frames, references, and objects are implementation details.

For reasoning about assignment, the useful fact is that variables refer to objects.

:::

::::

The runtime still has to put bits somewhere, of course. But that physical layout is a different layer of the problem.

The diagrams in this article are therefore not pictures of literal RAM.

They are pictures of the relationships we need in order to reason about the program.

## What did the assignment copy?

That brings us back to the question from the beginning.

::::language-content

:::language csharp

With `int b = a`, the `int` value is copied.

With `var b = a` when `a` refers to a `Counter`, the reference value is copied. The `Counter` is not.

:::

:::language java

With `int b = a`, the primitive `int` value is copied.

With `Counter b = a`, the object reference is copied. The `Counter` is not.

:::

:::language python

With `b = a`, Python does not copy the object.

`b` simply starts referring to the same object as `a`.

:::

::::

Once that is clear, the later behavior stops being surprising.

If two variables lead to the same mutable object, changing that object can be seen through either variable.

If one variable is later made to lead somewhere else, the other variable does not follow it.

Memory still matters. But for understanding assignment, it usually should not be the first thing we reach for.

The language semantics come first.

---
title: "When the Workaround Becomes the Architecture"
description: "How a reasonable fallback can quietly redefine a system's contract—and how AI-assisted development can make that normalization happen faster."
format: article
publishedAt: "2026-05-10"
draft: false
tags:
  - architecture
  - integration
  - maintainability
  - ai-assisted-development
technologies:
  - C#
  - TypeScript
  - Python
featured: false
---

## The harmless workaround

An upstream service was supposed to send us three things for every order: an ID, an amount, and a currency.

:::code-tabs

```csharp
public interface IOrderApi
{
    void AddOrder(
        string id,
        decimal amount,
        string currency);
}
```

```typescript
interface OrderApi {
  addOrder(
    id: string,
    amount: number,
    currency: string
  ): void;
}
```

```python
class OrderApi(Protocol):
    def add_order(
        self,
        id: str,
        amount: Decimal,
        currency: str
    ) -> None:
        ...
```

:::

The contract was simple enough. `currency` was required.

Then one day, some orders arrived without it.

At first, the upstream team sent `null`. That broke our integration, so as a temporary measure they started sending an empty string instead.

The orders began flowing again.

Problem solved.

Or at least, that is what it looked like.

## When the workaround becomes behavior

It did not take long before the empty currency started causing problems elsewhere.

Any code that expected a real currency now had to defend itself:

:::code-tabs

```csharp
var currency = order.Currency;

if (string.IsNullOrWhiteSpace(currency))
{
    currency = "INR";
}
```

```typescript
let currency = order.currency;

if (!currency?.trim())
{
    currency = "INR";
}
```

```python
currency = order.currency

if not currency or not currency.strip():
    currency = "INR"
```

:::

The fix was small. Reasonable, even.

Then the same issue appeared somewhere else.

And somewhere else again.

Eventually, someone did what any good developer would be tempted to do: remove the duplication.

:::code-tabs

```csharp
public void AddOrder(
    string id,
    decimal amount,
    string currency)
{
    if (string.IsNullOrWhiteSpace(currency))
    {
        currency = "INR";
    }

    // Save the order
}
```

```typescript
function addOrder(
  id: string,
  amount: number,
  currency: string
): void {
  if (!currency?.trim()) {
    currency = "INR";
  }

  // Save order
}
```

```python
def add_order(
    id: str,
    amount: Decimal,
    currency: str
) -> None:
    if not currency or not currency.strip():
        currency = "INR"

    # Save order
```

:::

Now the rest of the application no longer needed to apply the workaround individually. Every order simply appeared to have a currency.

And once this became expected behavior, it was natural to protect it with a test.

:::code-tabs

```csharp
[Fact]
public async Task Missing_currency_defaults_to_INR()
{
    orderApi.AddOrder("ORD-1", 1499m, "");

    var order = await client.GetOrder("ORD-1");

    Assert.Equal("INR", order.Currency);
}
```

```typescript
it("defaults missing currency to INR", async () => {
  addOrder("ORD-1", 1499, "");

  const order = await client.getOrder("ORD-1");

  expect(order.currency).toBe("INR");
});
```

```python
def test_missing_currency_defaults_to_inr():
    order_api.add_order("ORD-1", Decimal("1499"), "")

    order = client.get_order("ORD-1")

    assert order.currency == "INR"
```

:::

Everything appeared to be working again. Over the following months, the original currency issue faded from memory. There was little reason to think about it — the workaround was doing exactly what it was meant to do. From then on, removing the fallback would look like breaking expected behavior.

> The workaround had stopped looking like a workaround. It had become expected system behavior.

## The information we erased

But no one noticed that downstream reports were silently including orders that had arrived without a currency as INR revenue.

And then one day, during an audit the issue was noticed. By then, the distinction had been erased at ingestion. A real INR order and an order that had merely defaulted to INR looked identical in storage. The elegant workaround had altered the system's behavior, but nothing preserved the fact that this was a workaround for a broken upstream contract rather than intended domain behavior. And it had erased the information we would later need to understand its impact.

A workaround was necessary to keep the system running. But no one fully understood the impact of the workaround until much later. Without the audit, the issue could have remained in the system for years without anyone noticing it.

What could have prevented this?

## Don't let the workaround disappear

When an empty currency is replaced with INR, we shouldn't lose the fact that the value was defaulted.

:::code-tabs

```csharp
public enum CurrencySource
{
    Provided,
    Defaulted
}

public record CurrencyValue(
    string Value,
    CurrencySource Source);
	
public record Order(
    string Id,
    decimal Amount,
    CurrencyValue Currency);
```

```typescript
export enum CurrencySource {
  Provided = "Provided",
  Defaulted = "Defaulted"
}

export interface CurrencyValue {
  readonly value: string;
  readonly source: CurrencySource;
}

export interface Order {
  readonly id: string;
  readonly amount: number;
  readonly currency: CurrencyValue;
}
```

```python
class CurrencySource(Enum):
    PROVIDED = "Provided"
    DEFAULTED = "Defaulted"

@dataclass(frozen=True)
class CurrencyValue:
    value: str
    source: CurrencySource

@dataclass(frozen=True)
class Order:
    id: str
    amount: Decimal
    currency: CurrencyValue
```

:::

The value may still be INR, but the system now knows whether that value came from the source or from our fallback.

Then downstream reports could decide whether they wanted to exclude these orders or separately classify them.

Because this is still a workaround, we should also know when the fallback is being invoked.

Source lets us reason about individual records. Observability lets us reason about whether the workaround itself is becoming normal.

:::code-tabs

```csharp
if (string.IsNullOrWhiteSpace(currency))
{
    logger.LogWarning(
        "Order {OrderId} arrived without currency. Defaulting to INR.",
        id);

    currency = "INR";
}
```

```typescript
if (!currency?.trim()) {
    logger.warn(`Order ${id} arrived without currency. Defaulting to INR.`);
    
    currency = "INR";
}
```

```python
if not currency or not currency.strip():
    logger.warning(f"Order {id} arrived without currency. Defaulting to INR.")

    currency = "INR"
```

:::

Or we could add a metric to track it.

:::code-tabs

```csharp
currencyFallbackCounter.Add(1);
```

```typescript
currencyFallbackCounter.add(1);
```

```python
currency_fallback_counter.add(1)
```

:::

Now over time, the trend can be observed.

```text
currency fallback usage

April       12
May         37
June       184
July       611
```

## When tolerance changes the contract

The system can continue compensating for the failure without allowing the failure itself to disappear.

The trend makes the workaround visible enough for someone to ask why it is still needed, whether its usage is increasing, and whether the source problem is actually being fixed.

But there is a deeper question: Should we have defaulted to INR in the first place?

The contract is still "currency must be supplied." The workaround should not silently redefine the contract as "currency may be missing because we'll make one up."

A compatibility rule should describe how the system survives a contract violation. It should not quietly become the new contract.

The real danger began when the system stopped treating missing currency as an abnormal condition.

## AI can accelerate the same mistake

This problem is not new. Developers have been normalizing broken behavior for decades. But AI-assisted development can compress that cycle because local fixes can now be generated, applied, and repeated much faster.

If a test fails because `currency` is empty, a generated fix like this is very plausible:

:::code-tabs

```csharp
if (string.IsNullOrWhiteSpace(currency))
{
    currency = "INR";
}
```

```typescript
if (!currency?.trim())
{
    currency = "INR";
}
```

```python
if not currency or not currency.strip():
    currency = "INR"
```

:::

The code passes. The immediate problem disappears. But unless someone asks _why the value is missing, what information is being invented, and who may rely on that invented value later_, the workaround can slip in without its implications being examined.

The risk is not that AI writes bad code. The risk is that AI can make plausible workarounds cheap enough to multiply before anyone pauses to examine what behavior they are quietly redefining.

## Make the decision explicit

One way to guard against this is to make the expectation explicit in your AI coding instructions:

```text
When fixing a bug or failing test, do not silently introduce defaults, fallbacks, retries, coercions, ignored errors, or other compensating behavior just to make the code pass.

If such a workaround appears necessary:
- identify the underlying assumption or contract being violated;
- explain what behavior the workaround changes;
- preserve information about the original failure where relevant;
- make the workaround observable if it may persist;
- distinguish temporary compatibility behavior from the intended system contract;
- do not change a failing test merely to accommodate the workaround unless the intended behavior has been confirmed;
- flag the workaround explicitly before implementing it.
```

Now the AI is not being prevented from using workarounds. It's being asked to surface the decision.

Whether the workaround was written by a developer or generated by an AI assistant, the risk is the same. A system becomes dangerous when it stops distinguishing between what is true and what it has merely learned to tolerate.

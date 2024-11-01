---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Aggregating the Behaviour

The `combine` is a binary operation over the `decider`, `view` and `saga`, satisfying associativity and having an
identity/empty element.

**Associativity facilitates parallelization by giving us the freedom to break problems into chunks that can be computed
in parallel.**

Functional paradigm and category theory define this algebra as a `Monoid`.
Stated tersely, a `monoid` is a type together with a binary operation (`combine`) over that type, satisfying
associativity
and having an identity element (zero/empty).

**`combine` operation is also commutative** / *commutative* `monoid`

<Tabs groupId="component-type" queryString="component-type">
  <TabItem value="decider" label="Decider">

```
associative: (decider1 + decider2) + decider3 = decider1 + (decider2 + decider3)
commutative: decider1 + decider2 = decider2 + decider1
zero:        decider1 + decider0 = decider1
```

By combining two or more deciders you get the new decider.

This is a formal signature of the `combine` function defined on the `decider`:

```ts
combine<C2, S2, E2>(decider2: Decider<C2, S2, E2>): Decider<C | C2, S & S2, E | E2>
```

Example:

```ts
export const restaurantDecider: Decider<RestaurantCommand, Restaurant | null, RestaurantEvent>

export const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>

// Combining two deciders into one big decider that can handle all commands of the system.
const decider: Decider<Command, (Order & Restaurant) | null, Event> =
      restaurantDecider.combine(orderDecider);
```


**Mappable**
____________

Additionally, `Decider<C, S, E>` provides map functions:

```ts
mapContraOnCommand<Cn>(f: (cn: Cn) => C): Decider<Cn, S, E>

dimapOnEvent<En>(fl: (en: En) => E, fr: (e: E) => En): Decider<C, S, En>

dimapOnState<Sn>(fl: (sn: Sn) => S, fr: (s: S) => Sn): Decider<C, Sn, E>
```


  </TabItem>
  <TabItem value="view" label="View">

```
associative: (view1 + view2) + view3 = view1 + (view2 + view3)
commutative: view1 + view2 = view2 + view1
zero:        view1 + view0 = view1
```

By combining two or more views you get the new view.

This is a formal signature of the `combine` function defined on the `view`:

```ts
combine<S2, E2>(view2: View<S2, E2>): View<S & S2, E | E2>
```

Example:

```ts
export const restaurantView: View<RestaurantView | null, RestaurantEvent>

export const orderView: View<OrderView | null, OrderEvent> 

// Combining two views into one big view that can handle all events of the system.
const view: View<(RestaurantView & OrderView) | null, OrderEvent | RestaurantEvent> = restaurantView.combine(orderView);
```


**Mappable**
____________

Additionally, `View<S, E>` provides map functions:

```ts
mapContraOnEvent<En>(f: (en: En) => E): View<S, En>

dimapOnState<Sn>(fl: (sn: Sn) => S, fr: (s: S) => Sn): View<Sn, E>
```


  </TabItem>
  <TabItem value="saga" label="Saga">

```
associative: (saga1 + saga2) + saga3 = saga1 + (saga2 + saga3)
commutative: saga1 + saga2 = saga2 + saga1
zero:        saga1 + saga0 = saga1
```

By combining two or more sagas you get the new saga.

This is a formal signature of the `combine` function defined on the `saga`:

```ts
combine<AR2, A2>(saga2: Saga<AR2, A2>): Saga<AR | AR2, A | A2>
```

Example:

```ts
export const restaurantSaga: Saga<OrderEvent, RestaurantCommand>
export const orderSaga: Saga<RestaurantEvent, OrderCommand>

// Combining two choreography sagas into one big system orchestrating saga.
const saga: Saga<Event, Command> = restaurantSaga.combine(orderSaga);
```

If the constraints are not met, the `combine` function will not be available for usage!

**Mappable**
____________

Additionally, `Saga<AR, A>` provides map functions:

```kotlin
inline fun <ARn> mapLeftOnActionResult(crossinline f: (ARn) -> AR): Saga<ARn, A>

inline fun <An> mapOnAction(crossinline f: (A) -> An): Saga<AR, An>
```

  </TabItem>
</Tabs>


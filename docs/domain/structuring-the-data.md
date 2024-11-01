---
sidebar_position: 2
---

# Structuring the data

In computer programming, especially functional programming, and type theory, an algebraic data type is a kind of
composite / a type formed by combining other types.

Two standard classes of algebraic types are:

- `product` types (i.e., tuples, pair, intersection)
- `sum` types (i.e., enums and unions).

**They provide the necessary abstraction for structuring the various data of our domain model.**

- Whereas `sum` types let you model the variations within a particular data type,
- `product` types help cluster related data into a larger abstraction.


- `Sum` type models an `OR` relationship,
- and `Product` type models an `AND` relationship.

**So, the `OR` and `AND` operations constitute the algebra of our data types.**

It is becoming clear that we have various classes of algebraic data types in our domain. Let's categorize them:

- Command / C
- Event / E
- State / S

## Commands

Commands represent the intent to change the state of the information system.

![command image](/img/command.svg)

### Sum/OR

The `union` (`|`) type in TypeScript represents data composition, also known as a `Sum` type (models the `OR` relationship). A union type is a type formed from two or more other types, representing values that may be any one of those types.

The key benefit of using `union` types comes into play when using `type narrowing` to exhaustively match all possible cases.

We model our commands as a `Sum` type (`OR` relationship) by using the `unuin` type. In this example, we have five
possible
concrete union members of `Command` which are known at compile
time: `CreateRestaurantCommand`, `ChangeRestaurantMenuCommand`, `PlaceOrderCommand`, `CreateOrderCommand`, `MarkOrderAsPreparedCommand`.

Additionally, commands are categorized as Restaurant and Order commands which are respectfully matching two concepts presented on the blueprint / swim-lanes at the bottom / yellow sticky notes.

![restaurant model](/img/restaurant-model.jpg)

```ts
// All variants of commands
export type Command = RestaurantCommand | OrderCommand;

export type RestaurantCommand =
  | CreateRestaurantCommand
  | ChangeRestaurantMenuCommand
  | PlaceOrderCommand;

export type CreateRestaurantCommand = {
  readonly decider: "Restaurant";
  readonly kind: "CreateRestaurantCommand";
  readonly id: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
};

export type ChangeRestaurantMenuCommand = {
  readonly decider: "Restaurant";
  readonly kind: "ChangeRestaurantMenuCommand";
  readonly id: RestaurantId;
  readonly menu: RestaurantMenu;
};

export type PlaceOrderCommand = {
  readonly decider: "Restaurant";
  readonly kind: "PlaceOrderCommand";
  readonly id: RestaurantId;
  readonly orderId: OrderId;
  readonly menuItems: MenuItem[];
};

export type OrderCommand = CreateOrderCommand | MarkOrderAsPreparedCommand;

export type CreateOrderCommand = {
  readonly decider: "Order";
  readonly kind: "CreateOrderCommand";
  readonly id: OrderId;
  readonly restaurantId: RestaurantId;
  readonly menuItems: MenuItem[];
};

export type MarkOrderAsPreparedCommand = {
  readonly decider: "Order";
  readonly kind: "MarkOrderAsPreparedCommand";
  readonly id: OrderId;
};
```

### Product/AND

If you zoom in into the concrete command types, for example, `CreateRestaurantCommand,` you will notice that it is
formed by combining other types: `RestaurantId`, `RestaurantName`, `RestaurantMenu`.
Essentially, `CreateRestaurantCommand` data class is a `Product` type which models `AND` relationship:

```
CreateRestaurantOrderCommand = RestaurantId & RestaurantName & RestaurantMenu
```

Our model is well typed! Notice how `RestaurantId`, `RestaurantName` and `RestaurantMenu` are not of type `string` which
would provide no value and has no meaning from the type system perspective.
Rather, we model these information as TypeScript types.

```ts
export type SchemaVersion = number;
export type RestaurantId = string;
export type OrderId = string;
export type MenuItemId = string;
export type RestaurantName = string;
export type RestaurantMenuId = string;
export type MenuItemName = string;
export type MenuItemPrice = string;
export type OrderStatus = "NOT_CREATED" | "CREATED" | "PREPARED";
export type Reason =
  | "Restaurant already exist!"
  | "Restaurant does not exist!"
  | "Order already exist!"
  | "Order does not exist!";
export type MenuItem = {
  readonly menuItemId: MenuItemId;
  readonly name: MenuItemName;
  readonly price: MenuItemPrice;
};

export type RestaurantMenu = {
  readonly menuItems: MenuItem[];
  readonly menuId: RestaurantMenuId;
  readonly cuisine: RestaurantMenuCuisine;
};
```


## Events

Events represent the state change itself, a fact.
These events represent decisions that have already happened (past tense).

![event image](/img/event.svg)

### Sum/OR

We model our events as a `Sum` type (`OR` relationship) by using `union` type. In this example, we have ten possible
sub-classes of `Event` which are known at compile
time: `RestaurantCreatedEvent`, `RestaurantNotCreatedEvent`, `RestaurantMenuChangedEvent`, `RestaurantMenuNotChangedEvent`, `OrderPlacedAtRestaurantEvent`, `OrderNotPlacedAtRestaurantEvent`, `OrderRejectedByRestaurantEvent`, `OrderCreatedEvent`, `OrderPreparedEvent`, `OrderRejectedEvent`.

Additionally, events are categorized as Restaurant and Order events which are respectfully matching two concepts presented on the blueprint / swim-lanes at the bottom / yellow sticky notes.

![restaurant model](/img/restaurant-model.jpg)

```ts
// All variants of events
export type Event = RestaurantEvent | OrderEvent;

export type RestaurantEvent =
  | RestaurantCreatedEvent
  | RestaurantNotCreatedEvent
  | RestaurantMenuChangedEvent
  | RestaurantMenuNotChangedEvent
  | RestaurantOrderPlacedEvent
  | RestaurantOrderNotPlacedEvent;

export type RestaurantCreatedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Restaurant";
  readonly kind: "RestaurantCreatedEvent";
  readonly id: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
  readonly final: boolean;
};

export type RestaurantNotCreatedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Restaurant";
  readonly kind: "RestaurantNotCreatedEvent";
  readonly id: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
  readonly reason: Reason;
  readonly final: boolean;
};

export type RestaurantMenuChangedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Restaurant";
  readonly kind: "RestaurantMenuChangedEvent";
  readonly id: RestaurantId;
  readonly menu: RestaurantMenu;
  readonly final: boolean;
};

export type RestaurantMenuNotChangedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Restaurant";
  readonly kind: "RestaurantMenuNotChangedEvent";
  readonly id: RestaurantId;
  readonly menu: RestaurantMenu;
  readonly reason: Reason;
  readonly final: boolean;
};

export type RestaurantOrderPlacedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Restaurant";
  readonly kind: "RestaurantOrderPlacedEvent";
  readonly id: RestaurantId;
  readonly orderId: OrderId;
  readonly menuItems: MenuItem[];
  readonly final: boolean;
};

export type RestaurantOrderNotPlacedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Restaurant";
  readonly kind: "RestaurantOrderNotPlacedEvent";
  readonly id: RestaurantId;
  readonly orderId: OrderId;
  readonly menuItems: MenuItem[];
  readonly reason: Reason;
  readonly final: boolean;
};

export type OrderEvent =
  | OrderCreatedEvent
  | OrderNotCreatedEvent
  | OrderPreparedEvent
  | OrderNotPreparedEvent;

export type OrderCreatedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Order";
  readonly kind: "OrderCreatedEvent";
  readonly id: OrderId;
  readonly restaurantId: RestaurantId;
  readonly menuItems: MenuItem[];
  readonly final: boolean;
};

export type OrderNotCreatedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Order";
  readonly kind: "OrderNotCreatedEvent";
  readonly id: OrderId;
  readonly restaurantId: RestaurantId;
  readonly reason: Reason;
  readonly menuItems: MenuItem[];
  readonly final: boolean;
};

export type OrderPreparedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Order";
  readonly kind: "OrderPreparedEvent";
  readonly id: OrderId;
  readonly final: boolean;
};

export type OrderNotPreparedEvent = {
  readonly version: SchemaVersion;
  readonly decider: "Order";
  readonly kind: "OrderNotPreparedEvent";
  readonly id: OrderId;
  readonly reason: Reason;
  readonly final: boolean;
};
```

### Product/AND

If you zoom in into the concrete event types, for example, `OrderPlacedAtRestaurantEvent,` you will notice that it is
formed by combining other types: `RestaurantId`, `OrderId`, `OrderLineItem`.
Essentially, `OrderPlacedAtRestaurantEvent` data class is a `Product` type which models `AND` relationship:

```
OrderPlacedAtRestaurantEvent = RestaurantId & OrderId & list of [OrderLineItem]
```


## State

The current state of the information system is evolved out of past events/facts.

![state image](/img/state.svg)

```ts
export type Restaurant = {
  readonly restaurantId: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
};

export type Order = {
  readonly orderId: OrderId;
  readonly restaurantId: RestaurantId;
  readonly menuItems: MenuItem[];
  readonly status: OrderStatus;
};
```

### Product/AND

If you zoom in into the concrete state types, for example, `Restaurant,` you will notice that it is formed by
combining other types: `RestaurantId`, `RestaurantName`, `RestaurantMenu`.
Essentially, `Restaurant` data class is a `Product` type that models `AND` relationship:

```
Restaurant = RestaurantId & RestaurantName & RestaurantMenu
```

## Embrace Immutability

Use the TypeScript readonly access modifier to mark properties as immutable!

Immutable objects are thread safe. No race conditions, no concurrency problems, no need to synchronize.


## Encapsulation

:::info
One might object that algebraic data types violate encapsulation by making public the internal representation of a type.
In functional programming, we approach concerns about encapsulation differently / we don’t typically have
a `delicate mutable state` which could lead to bugs or violation of invariants if exposed publicly.
Exposing the data constructors of a data type is often fine, and the decision to do so is approached much like any other
decision about what the public API of a data type should be.
:::


# **f`(`model`)`** - Functional Domain Modeling with TypeScript

[![CI with Node/NPM - Test and Build](https://github.com/fraktalio/fmodel-ts/actions/workflows/node-test-build.yml/badge.svg)](https://github.com/fraktalio/fmodel-ts/actions/workflows/node-test-build.yml)

<!-- TOC -->
* [**f`(`model`)`** - Functional Domain Modeling with TypeScript](#fmodel---functional-domain-modeling-with-typescript)
  * [`IOR<Library, Inspiration>`](#iorlibrary-inspiration)
  * [`(command: C, state: S) => readonly E[]`](#command-c-state-s--readonly-e)
  * [`(state: S, event: E) => S`](#state-s-event-e--s)
  * [Event-sourced or State-stored systems](#event-sourced-or-state-stored-systems)
  * [Decider](#decider)
    * [Event-sourcing aggregate](#event-sourcing-aggregate)
    * [State-stored aggregate](#state-stored-aggregate)
  * [View](#view)
    * [Materialized View](#materialized-view)
  * [Saga](#saga)
    * [Saga Manager](#saga-manager)
  * [Event Modeling](#event-modeling)
  * [Structuring the data](#structuring-the-data)
    * [`C` / Command / Intent to change the state of the system](#c--command--intent-to-change-the-state-of-the-system)
    * [`E` / Event / Fact](#e--event--fact)
    * [`S` / State / Current state of the system/aggregate/entity](#s--state--current-state-of-the-systemaggregateentity)
  * [Modeling the Behaviour](#modeling-the-behaviour)
      * [Decider - data type that represents the main decision-making algorithm.](#decider---data-type-that-represents-the-main-decision-making-algorithm)
      * [Event-sourcing aggregate](#event-sourcing-aggregate-1)
  * [Install as a dependency of your project](#install-as-a-dependency-of-your-project)
  * [Examples](#examples)
  * [FModel in other languages](#fmodel-in-other-languages)
  * [Resources](#resources)
  * [Credits](#credits)
<!-- TOC -->


> v2.0.0 of the library is introducing breaking changes. [Check the PR](https://github.com/fraktalio/fmodel-ts/pull/692)!
> Besides keeping the focus on separating data from behavior, we want to split the responsibilities between the domain and application/adapter layers better.
> For example, `metadata types` exist only on the application layer, not leaking into the domain, as these don't benefit core logic. Example: `traceId`, `correlationId`, ...
> To keep it simple, `v2.*.*` will use the main branch going forward. [v1.*.*](https://github.com/fraktalio/fmodel-ts/tree/v1) will continue to be supported (bugs only, no new features)

When you’re developing an information system to automate the activities of the business, you are modeling the business.
The abstractions that you design, the behaviors that you implement, and the UI interactions that you build all reflect
the business — together, they constitute the model of the domain.

![event-modeling](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/event-modeling.png)

## `IOR<Library, Inspiration>`

This project can be used as a library, or as an inspiration, or both. It provides just enough tactical Domain-Driven
Design patterns, optimised for Event Sourcing and CQRS.

The library is fully isolated from the application and infrastructure layers. It represents a pure 
declaration of the program logic. It is written in [TypeScript](https://www.typescriptlang.org/) programming language.
  
## `(command: C, state: S) => readonly E[]`

On a higher level of abstraction, any information system is responsible for handling the intent (`Command`) and based on
the current `State`, produce new facts (`Events`):

- given the current `State/S` *on the input*,
- when `Command/C` is handled *on the input*,
- expect `list` of new `Events/E` to be published/emitted *on the output*

## `(state: S, event: E) => S`

The new state is always evolved out of the current state `S` and the current event `E`:

- given the current `State/S` *on the input*,
- when `Event/E` is handled *on the input*,
- expect new `State/S` to be published *on the output*

## Event-sourced or State-stored systems

- State-stored systems are traditional systems that are only storing the current State by overwriting the previous State
  in the storage.
- Event-sourced systems are storing the events in immutable storage by only appending.

**Both types of systems can be designed by using only these two functions and three generic parameters**

![event sourced vs state stored](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/es-ss-system.png)

`Decider` is the most important datatype, but it is not the only one. Let's discuss all of them, and visualize how they fit the Onion architecture.
The arrows in the image are showing the direction of the dependency. Notice that all dependencies point inwards, and that Domain is not depending on anything.

![onion architecture image](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/onion.png)

## Decider

`Decider` is a datatype that represents the main decision-making algorithm. It belongs to the Domain layer. It has three
generic parameters `C`, `S`, `E` , representing the type of the values that `Decider` may contain or use.
`Decider` can be specialized for any type `C` or `S` or `E` because these types do not affect its
behavior. `Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.

`Decider` is a pure domain component.

- `C` - Command
- `S` - State
- `E` - Event

Notice that `Decider` implements an interface `IDecider` to communicate the contract.

```typescript
export class Decider<C, S, E> implements IDecider<C, S, E> {
  constructor(
    readonly decide: (c: C, s: S) => readonly E[],
    readonly evolve: (s: S, e: E) => S,
    readonly initialState: S
  ) {
  }
}
```

Additionally, `initialState` of the Decider is introduced to gain more control over the initial state of the Decider.

![decider image](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/decider.png)

We can now construct event-sourcing or/and state-storing aggregate by using the same `decider`.

### Event-sourcing aggregate

`Event sourcing aggregate` is using/delegating a `Decider` to handle commands and produce events. It belongs to the Application layer.
In order to handle the command, aggregate needs to fetch the current state (represented as a list of events)
via `EventRepository.fetchEvents` function, and then delegate the command to the decider which can produce new events as a result.
Produced events are then stored via `EventRepository.save` function.

![event sourced aggregate](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/es-aggregate.png)

### State-stored aggregate

`State stored aggregate` is using/delegating a `Decider` to handle commands and produce new state. It belongs to the Application layer.
In order to handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then
delegate the command to the decider which can produce new state as a result.
New state is then stored via `StateRepository.save` function.

![state storedaggregate](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/ss-aggregate.png)


## View

`View`  is a datatype that represents the event handling algorithm, responsible for translating the events into
denormalized state, which is more adequate for querying. It belongs to the Domain layer. It is usually used to create
the view/query side of the CQRS pattern. Obviously, the command side of the CQRS is usually event-sourced aggregate.

It has two generic parameters `S`, `E`, representing the type of the values that `View` may contain or use.
`View` can be specialized for any type of `S`, `E` because these types do not affect its behavior.
`View` behaves the same for `E`=`Int` or `E`=`YourCustomType`, for example.

`View` is a pure domain component.

- `S` - State
- `E` - Event

Notice that `View` implements an interface `IView` to communicate the contract.


```typescript
export class View<S, E> implements IView<S, E> {
  constructor(readonly evolve: (s: S, e: E) => S, readonly initialState: S) {
  }
}
```

![view image](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/view.png)

### Materialized View

A `Materialized view` is using/delegating a `View` to handle events of type `E` and to maintain a state of denormalized projection(s) as a
result. Essentially, it represents the query/view side of the CQRS pattern. It belongs to the Application layer.

In order to handle the event, materialized view needs to fetch the current state via `ViewStateRepository.fetchState` function first, and then delegate the event to the view, which can produce new state as a result. New state
is then stored via `ViewStateRepository.save` function.


## Saga

`Saga` is a datatype that represents the central point of control, deciding what to execute next (`A`). It is
responsible for mapping different events from many aggregates into action results `AR` that the `Saga` then can use to
calculate the next actions `A` to be mapped to commands of other aggregates.

`Saga` is stateless, it does not maintain the state.

It has two generic parameters `AR`, `A`, representing the type of the values that `Saga` may contain or use.
`Saga` can be specialized for any type of `AR`, `A` because these types do not affect its behavior.
`Saga` behaves the same for `AR`=`Int` or `AR`=`YourCustomType`, for example.

`Saga` is a pure domain component.

- `AR` - Action Result
- `A`  - Action

Notice that `Saga` implements an interface `ISaga` to communicate the contract.

```typescript
export class Saga<AR, A> implements ISaga<AR, A>{
    constructor(readonly react: (ar: AR) => readonly A[]) {}
}
```

![saga image](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/saga.png)

### Saga Manager

`Saga manager` is a stateless process orchestrator. It belongs to the Application layer.
It is reacting on Action Results of type `AR` and produces new actions `A` based on them.

Saga manager is using/delegating a `Saga` to react on Action Results of type `AR` and produce new actions `A` which are
going to be published via `ActionPublisher.publish` function.

## Event Modeling

[Event Modeling](https://eventmodeling.org/posts/what-is-event-modeling/) is:

- a method of describing systems using an example of how information has changed within them over time.
- a scenario-based and UX-driven approach to defining requirements.

![restaurant model](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/restaurant-model.jpg)

## Structuring the data

> TypeScript adopts a structural type system which determines type compatibility and equivalence based on the type structure or definition rather than the declarative relationship between types and interfaces, which contrasts with nominal type system.

In TypeScript, we can use Algebraic Data Types (ADTs) to model our application's domain entities and relationships in a functional way, clearly defining the set of possible values and states.
TypeScript has two main types of ADTs: union types (`"|"` operator), intersection types (`"&"` operator), tuples and records

- `union types` is used to define a type that can take on one of several possible variants - modeling a `sum/OR` type.
- `intersection types`, `tuples` and `records` are used to combine several types into one - modeling a `product/AND` type.

ADTs will help with

- representing the business domain in the code accurately
- enforcing correctness
- reducing the likelihood of bugs.

In FModel, we extensively use ADTs to model the data.

### `C` / Command / Intent to change the state of the system

```typescript
// Be precise and explicit about the types
export type SchemaVersion = number;
export type RestaurantId = string;
export type OrderId = string;
export type MenuItemId = string;
export type RestaurantName = string;
export type RestaurantMenuId = string;
export type MenuItemName = string;
export type MenuItemPrice = string;
```
```typescript
export type Command = RestaurantCommand | OrderCommand;

export type RestaurantCommand = CreateRestaurantCommand | ChangeRestaurantMenuCommand | PlaceOrderCommand;

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
```

```typescript
export type OrderCommand = CreateOrderCommand | MarkOrderAsPreparedCommand;

export type CreateOrderCommand = {
  decider: "Order";
  kind: "CreateOrderCommand";
  id: OrderId;
  restaurantId: RestaurantId;
  menuItems: MenuItem[];
};

export type MarkOrderAsPreparedCommand = {
  decider: "Order";
  kind: "MarkOrderAsPreparedCommand";
  id: OrderId;
};
```

### `E` / Event / Fact

```typescript
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
```

```typescript
export type OrderEvent =
  | OrderCreatedEvent
  | OrderNotCreatedEvent
  | OrderPreparedEvent
  | OrderNotPreparedEvent;

export type OrderCreatedEvent = {
  version: SchemaVersion;
  decider: "Order";
  kind: "OrderCreatedEvent";
  id: OrderId;
  restaurantId: RestaurantId;
  menuItems: MenuItem[];
  final: boolean;
};

export type OrderNotCreatedEvent = {
  version: SchemaVersion;
  decider: "Order";
  kind: "OrderNotCreatedEvent";
  id: OrderId;
  restaurantId: RestaurantId;
  reason: Reason;
  menuItems: MenuItem[];
  final: boolean;
};

export type OrderPreparedEvent = {
  version: SchemaVersion;
  decider: "Order";
  kind: "OrderPreparedEvent";
  id: OrderId;
  final: boolean;
};

export type OrderNotPreparedEvent = {
  version: SchemaVersion;
  decider: "Order";
  kind: "OrderNotPreparedEvent";
  id: OrderId;
  reason: Reason;
  final: boolean;
};
```
### `S` / State / Current state of the system/aggregate/entity

```typescript
/**
 * Restaurant state / a data type that represents the current state of the Restaurant
 */
export type Restaurant = {
  readonly restaurantId: RestaurantId;
  readonly name: RestaurantName;
  readonly menu: RestaurantMenu;
};
```

```typescript
/**
 * Order state / a data type that represents the current state of the Order
 */
export type Order = {
  readonly orderId: OrderId;
  readonly restaurantId: RestaurantId;
  readonly menuItems: MenuItem[];
  readonly status: OrderStatus;
};
```

## Modeling the Behaviour

- algebraic data types form the structure of our entities (commands, state, and events).
- functions/lambda offers the algebra of manipulating the entities in a compositional manner, effectively modeling the behavior.

This leads to modularity in design and a clear separation of the entity’s structure and functions/behaviour of the entity.

Fmodel library offers generic and abstract components to specialize in for your specific case/expected behavior:

#### Decider - data type that represents the main decision-making algorithm.

```typescript
/**
 * Restaurant - `pure` command handler / a decision-making component
 * ___
 * A pure command handling algorithm, responsible for evolving the state of the restaurant.
 * It does not produce any side effects, such as I/O, logging, etc.
 * It utilizes type narrowing to make sure that the command is handled exhaustively.
 * https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
 * ___
 * @param c - command type that is being handled - `RestaurantCommand`
 * @param s - state type that is being evolved - `Restaurant | null`
 * @param e - event type that is being produced / a fact / an outcome of the decision - `RestaurantEvent`
 */
export const restaurantDecider: Decider<
  RestaurantCommand,
  Restaurant | null,
  RestaurantEvent
> = new Decider<RestaurantCommand, Restaurant | null, RestaurantEvent>(
  (command, currentState) => {
    switch (command.kind) {
      case "CreateRestaurantCommand":
        return currentState == null
          ? [
            {
              version: 1,
              decider: "Restaurant",
              kind: "RestaurantCreatedEvent",
              id: command.id,
              name: command.name,
              menu: command.menu,
              final: false,
            },
          ]
          : [
            {
              version: 1,
              decider: "Restaurant",
              kind: "RestaurantNotCreatedEvent",
              id: command.id,
              name: command.name,
              menu: command.menu,
              reason: "Restaurant already exist!",
              final: false,
            },
          ];
      case "ChangeRestaurantMenuCommand":
        return currentState !== null
          ? [
            {
              version: 1,
              decider: "Restaurant",
              kind: "RestaurantMenuChangedEvent",
              id: currentState.restaurantId,
              menu: command.menu,
              final: false,
            },
          ]
          : [
            {
              version: 1,
              decider: "Restaurant",
              kind: "RestaurantMenuNotChangedEvent",
              id: command.id,
              menu: command.menu,
              reason: "Restaurant does not exist!",
              final: false,
            },
          ];
      case "PlaceOrderCommand":
        return currentState !== null
          ? [
            {
              version: 1,
              decider: "Restaurant",
              kind: "RestaurantOrderPlacedEvent",
              id: command.id,
              orderId: command.orderId,
              menuItems: command.menuItems,
              final: false,
            },
          ]
          : [
            {
              version: 1,
              decider: "Restaurant",
              kind: "RestaurantOrderNotPlacedEvent",
              id: command.id,
              orderId: command.orderId,
              menuItems: command.menuItems,
              reason: "Restaurant does not exist!",
              final: false,
            },
          ];
      default:
        // Exhaustive matching of the command type
        const _: never = command;
        return [];
    }
  },
  (currentState, event) => {
    switch (event.kind) {
      case "RestaurantCreatedEvent":
        return { restaurantId: event.id, name: event.name, menu: event.menu };
      case "RestaurantNotCreatedEvent":
        return currentState;
      case "RestaurantMenuChangedEvent":
        return currentState !== null
          ? {
            restaurantId: currentState.restaurantId,
            name: currentState.name,
            menu: event.menu,
          }
          : currentState;
      case "RestaurantMenuNotChangedEvent":
        return currentState;
      case "RestaurantOrderPlacedEvent":
        return currentState;
      case "RestaurantOrderNotPlacedEvent":
        return currentState;
      default:
        // Exhaustive matching of the event type
        const _: never = event;
        return currentState;
    }
  },
  null,
);
```

```typescript
/**
 * Order  - `pure` command handler / a decision-making component
 * ___
 * A pure command handling algorithm, responsible for evolving the state of the order.
 * It does not produce any side effects, such as I/O, logging, etc.
 * It utilizes type narrowing to make sure that the command is handled exhaustively.
 * https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
 * ___
 * @param c - command type that is being handled - `OrderCommand`
 * @param s - state type that is being evolved - `Order | null`
 * @param e - event type that is being produced / a fact / an outcome of the decision - `Order`Event`
 */
export const orderDecider: Decider<OrderCommand, Order | null, OrderEvent> =
  new Decider<OrderCommand, Order | null, OrderEvent>(
    (command, currentState) => {
      switch (command.kind) {
        case "CreateOrderCommand":
          return currentState == null
            ? [
              {
                version: 1,
                decider: "Order",
                kind: "OrderCreatedEvent",
                id: command.id,
                restaurantId: command.restaurantId,
                menuItems: command.menuItems,
                final: false,
              },
            ]
            : [
              {
                version: 1,
                decider: "Order",
                kind: "OrderNotCreatedEvent",
                id: command.id,
                restaurantId: command.restaurantId,
                menuItems: command.menuItems,
                final: false,
                reason: "Order already exist!",
              },
            ];
        case "MarkOrderAsPreparedCommand":
          return currentState !== null
            ? [
              {
                version: 1,
                decider: "Order",
                kind: "OrderPreparedEvent",
                id: currentState.orderId,
                final: false,
              },
            ]
            : [
              {
                version: 1,
                decider: "Order",
                kind: "OrderNotPreparedEvent",
                id: command.id,
                reason: "Order does not exist!",
                final: false,
              },
            ];
        default:
          // Exhaustive matching of the command type
          const _: never = command;
          return [];
      }
    },
    (currentState, event) => {
      switch (event.kind) {
        case "OrderCreatedEvent":
          return {
            orderId: event.id,
            restaurantId: event.restaurantId,
            menuItems: event.menuItems,
            status: "CREATED",
          };
        case "OrderNotCreatedEvent":
          return currentState;
        case "OrderPreparedEvent":
          return currentState !== null
            ? {
              orderId: currentState.orderId,
              restaurantId: currentState.restaurantId,
              menuItems: currentState.menuItems,
              status: "PREPARED",
            }
            : currentState;
        case "OrderNotPreparedEvent":
          return currentState;
        default:
          // Exhaustive matching of the event type
          const _: never = event;
          return currentState;
      }
    },
    null,
  );
```

The logic execution will be orchestrated by the outside components that use the domain components (decider, view) to do the computations. These components will be responsible for fetching and saving the data (repositories).


The arrows in the image (adapters->application->domain) show the direction of the dependency. Notice that all dependencies point inward and that Domain does not depend on anybody or anything.

Pushing these decisions from the core domain model is very valuable. Being able to postpone them is a sign of good architecture.

#### Event-sourcing aggregate
```typescript
// We are adding new types on this layer: Metadatada and Version. Observe how these types are not leaking into the Domain layer (decider), and not influencing the core logic.
export type StreamVersion = { event_id: string };
export type CommandMetadata = { tenant: string };
export type EventMetadata = {
  tenant: string;
  command_id: string;
  event_id: string;
};
```
```typescript
/**
 * An aggregate that handles the command and produces new events / A convenient type alias for the Fmodel's `EventSourcingAggregate`
 * 
 * This aggregate can handle all the commands of the system. Observe how two deciders (restaurant and order) are combined into one.
 */
export type ApplicationAggregate = EventSourcingAggregate<
  Command,
  Restaurant & Order,
  Event,
  StreamVersion,
  CommandMetadata,
  EventMetadata
>;

// Parse the command from the request
const command: Command = JSON.parse(await req.json());
console.log("Handling command: ", command);
// We can combine deciders to create a new decider that can handle both restaurant and order commands
const decider = restaurantDecider.combine(orderDecider);
// Create a repository for the events of all types
const eventRepository = new EventRepository(supabaseClient);
// Create an aggregate to handle the commands of all types!
const aggregate: ApplicationAggregate = new EventSourcingAggregate(
  decider,
  eventRepository,
);

// Handle the command
const result = await aggregate.handle(command);
```
## Install as a dependency of your project

```shell
npm i @fraktalio/fmodel-ts
```
> Available on [https://www.npmjs.com/package/@fraktalio/fmodel-ts](https://www.npmjs.com/package/@fraktalio/fmodel-ts)

## Examples

- Why don't you start by browsing [tests](https://github.com/fraktalio/fmodel-ts/blob/main/src/lib/domain/decider.spec.ts)?
- [Event sourcing and event streaming with Axon - Gift Card domain](https://github.com/AxonIQ/giftcard-demo-ts)

## FModel in other languages

- [FModel in Kotlin](https://github.com/fraktalio/fmodel)
- [FModel in Rust](https://github.com/fraktalio/fmodel-rust)


## Resources

- [The Blog - Domain modeling](https://fraktalio.com/blog/)
- [Event Modeling - What is it?](https://eventmodeling.org/posts/what-is-event-modeling/)

## Credits

Special credits to `Jérémie Chassaing` for sharing his [research](https://www.youtube.com/watch?v=kgYGMVDHQHs)
and `Adam Dymitruk` for hosting the meetup.

---
Created with :heart: by [Fraktalio](https://fraktalio.com/)

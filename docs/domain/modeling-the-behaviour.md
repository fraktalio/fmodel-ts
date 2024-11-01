---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Modeling the Behaviour

- algebraic data types form the `structure` of our entities (commands, state, and events)
- functions/lambda offers the algebra of manipulating the entities in a compositional manner, effectively modeling
  the `behavior.`

This leads to modularity in design and a clear separation of the entity’s structure and functions/`behaviour` of the
entity.


Fmodel offers generic and abstract components to specialize in for your specific case/expected behavior:

- Decider
- View
- Saga

## Decider

The decider is a data type that represents the main decision-making algorithm.

- `initialState` - A starting point / An initial state
- `decide` (Exhaustive / pattern matching command handler) - A function/lambda that takes command and input state as
  parameters, and returns/emits the flow of output events
- `evolve` (Exhaustive / pattern matching event-sourcing handler) - A function/lambda that takes input state and input
  event as parameters, and returns the output/new state

![decider image](/img/decider-ts.png)

<Tabs groupId="concept" queryString="concept">
  <TabItem value="restaurant" label="Restaurant">

```ts
export const restaurantDecider: Decider<
  RestaurantCommand,
  Restaurant | null,
  RestaurantEvent
> = new Decider<RestaurantCommand, Restaurant | null, RestaurantEvent>(
  (command, currentState) => {
    switch (command.kind) {
      case "CreateRestaurantCommand":
        return (currentState === null ||
            currentState.restaurantId === undefined)
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
        return (currentState !== null &&
            currentState.restaurantId === command.id)
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
        return (currentState !== null &&
            currentState.restaurantId === command.id)
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
      default: {
        // Exhaustive matching of the command type
        const _: never = command;
        return [];
      }
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
      default: {
        const _: never = event;
        return currentState;
      }
    }
  },
  null,
);
```


  </TabItem>
  <TabItem value="order" label="Order">

```ts
export const orderDecider: Decider<OrderCommand, Order | null, OrderEvent> =
  new Decider<OrderCommand, Order | null, OrderEvent>(
    (command, currentState) => {
      switch (command.kind) {
        case "CreateOrderCommand":
          return (currentState === null || currentState.orderId === undefined)
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
          return (currentState !== null && currentState.orderId === command.id)
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
        default: {
          // Exhaustive matching of the command type
          const _: never = command;
          return [];
        }
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
        default: {
          // Exhaustive matching of the event type
          const _: never = event;
          return currentState;
        }
      }
    },
    null,
  );
```

</TabItem>
</Tabs>

## View

The view is a data type that represents the event handling algorithm responsible for translating the events into the
denormalized state, which is adequate for querying.

- `initialState` - A starting point / An initial state
- `evolve` (Exhaustive / pattern matching event handler) - A function/lambda that takes input state and input event as
  parameters, and returns the output/new state

![view image](/img/view-ts.png)

<Tabs groupId="concept" queryString="concept">
  <TabItem value="restaurant" label="Restaurant">

```ts
export const restaurantView: View<RestaurantView | null, RestaurantEvent> =
  new View<RestaurantView | null, RestaurantEvent>(
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
        default: {
          // Exhaustive matching of the event type
          const _: never = event;
          return currentState;
        }
      }
    },
    null,
  );
```

  </TabItem>
  <TabItem value="order" label="Order">

```ts
export const orderView: View<OrderView | null, OrderEvent> = new View<
  OrderView | null,
  OrderEvent
>(
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
      default: {
        // Exhaustive matching of the event type
        const _: never = event;
        return currentState;
      }
    }
  },
  null,
);
```

</TabItem>
</Tabs>

## Saga

Saga is a data type that represents the central point of control, deciding what to execute next. It is responsible for
mapping different events from deciders into action results that the Saga then can use to calculate the subsequent
actions to be
mapped to the command of other deciders.

In the context of smart endpoints and dumb pipes, deciders would be smart endpoints, and saga would be a dumb pipe.

- `react` - A function/lambda that takes input action-result/event, and returns the flow of actions/commands that should
  be published.

![saga image](/img/saga-ts.png)

<Tabs groupId="concept" queryString="concept">
  <TabItem value="restaurant" label="Restaurant">

```ts
export const restaurantSaga: Saga<OrderEvent, RestaurantCommand> = new Saga(
  (event) => {
    switch (event.kind) {
      case "OrderPreparedEvent":
      case "OrderNotPreparedEvent":
      case "OrderCreatedEvent":
      case "OrderNotCreatedEvent":
        return [];
      default: {
        // Exhaustive matching of the Action Result/Event type
        const _: never = event;
        return [];
      }
    }
  },
);
```

  </TabItem>
  <TabItem value="order" label="Order">

```ts
export const orderSaga: Saga<RestaurantEvent, OrderCommand> = new Saga<
  RestaurantEvent,
  OrderCommand
>(
  (event) => {
    switch (event.kind) {
      case "RestaurantOrderPlacedEvent":
        return [
          {
            decider: "Order",
            kind: "CreateOrderCommand",
            id: event.orderId,
            restaurantId: event.id,
            menuItems: event.menuItems,
          },
        ];
      case "RestaurantCreatedEvent":
      case "RestaurantNotCreatedEvent":
      case "RestaurantMenuChangedEvent":
      case "RestaurantMenuNotChangedEvent":
      case "RestaurantOrderNotPlacedEvent":
        return [];
      default: {
        // Exhaustive matching of the Action Result/Event type
        const _: never = event;
        return [];
      }
    }
  },
);
```

</TabItem>
</Tabs>

## Totality

A function is `total` if it is defined for all of its possible inputs.

By having algebraic data types modeling the `Sum/OR` relationship with `union` type, it's possible to verify that the `switch` statement covers all cases. 

The `never` type is assignable to every type; however, no type is assignable to never (except never itself). This means you can use narrowing and rely on never turning up to do exhaustive checking in a switch statement.


The compiler/transpiler will yell at you if you add a new command/event into the model/project (`switch` statement goes red), and
you will have to fix it immediately.
It will positively influence the function (`decide`, `evolve`, `react`) totality giving more guarantees about code
correctness.

:::info
The essence of functional programming lies in the power of pure functions. Add static types to the mix, and you have
algebraic abstractions—functions operating on types and honoring certain laws. Make the functions generic on types, and
you have parametricity. The function becomes polymorphic, which implies more reusability, and if you’re disciplined
enough not to leak any implementation details by sneaking in specialized types (or unmanaged hazards such as
exceptions), you get free theorems.
:::
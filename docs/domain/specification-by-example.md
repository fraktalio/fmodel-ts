---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Specification By Example

- It is a collaborative approach to software analysis and testing.
- It is the fastest way to align people from different roles on what exactly we need to build and how to test it.

## Illustrating requirements using examples

The requirements are presented as scenarios.
A scenario is an example of the system’s behavior from the users’ perspective,
and they are specified using the `Given-When-Then` structure to create a testable specification:

- Given `< some precondition(s) >`
- When `< an action/trigger occurs >`
- Then `< some post condition >`

We face business with specific questions they should be able to answer.
We are not facing them with abstractions or generalizations.
We are dealing only with data that are formally representing preconditions (events), actions (commands) and post
conditions (new events):

- Given `< some event(s) / current state of our system > `
- When `< a command occurs >`
- Then `< some new event(s) / evolves to the new state of our system >`

It also represents an acceptance criterion of the system, and acts as a documentation.

## Refining specifications

Let's pivot the blueprint for 90 degrees, and refine our requirements further.

![restaurant model](/img/restaurant-model.jpg)

We need to go through all the scenarios, successes and errors.
For example, for an `OrderDecider` with given `OrderCreatedEvent` event as a precondition, when
command `MarkOrderAsPreparedCommand` is triggered, then Order is successfully prepared (`OrderPreparedEvent`).
But, without `OrderCreatedEvent` given as precondition, handling the same command `MarkOrderAsPreparedCommand` will
produce different result/failure (`OrderNotPreparedEvent`).

It means that order can be marked as prepared only if it was previously created/placed.

![spec image](/img/spec-by-example.jpg)

## Automating tests based on examples

Functions/lambda offers the algebra of manipulating the data (commands, events, state) in a compositional manner,
effectively modeling the behavior.
This leads to modularity in design and a clear separation of the entity’s structure and functions/behaviour of the
entity. **It makes it easy to test!**

You can create a small DSL in Kotlin to write and run specifications in `Given-When-Then` structure (testable
specification):

<Tabs groupId="component-type" queryString="component-type">
  <TabItem value="decider" label="Decider">

```ts
export const DeciderSpecification = {
  for: <C, S, E>(decider: IDecider<C, S, E>): DeciderSpecification<C, E> => {
    return {
      given: (events: E[]) => {
        return {
          when: (command: C) => {
            const handle = () => {
              const currentState = events.reduce<S>(
                decider.evolve,
                decider.initialState
              );
              return decider.decide(command, currentState);
            };

            return {
              then: (expectedEvents: E[]) => {
                const resultEvents = handle();
                assertEquals(resultEvents, expectedEvents);
              },
              thenThrows: (check?: (error: Error) => boolean) => {
                try {
                  handle();
                  throw new Error("Handler did not fail as expected");
                } catch (error) {
                  if (check) assert(check(error as Error) === true);
                }
              },
            };
          },
        };
      },
    };
  },
};
```

  </TabItem>
  <TabItem value="view" label="View">

```ts
export const ViewSpecification = {
  for: <S, E>(view: IView<S, E>): ViewSpecification<S, E> => {
    return {
      given: (events: E[]) => {
        const handle = () => {
          return events.reduce<S>(view.evolve, view.initialState);
        };
        return {
          then: (expectedState: S) => {
            const resultState = handle();
            assertEquals(resultState, expectedState);
          },
          thenThrows: (check?: (error: Error) => boolean) => {
            try {
              handle();
              throw new Error("Handler did not fail as expected");
            } catch (error) {
              if (check) assert(check(error as Error) === true);
            }
          },
        };
      },
    };
  },
};
```

  </TabItem>
 
</Tabs>

Runnable tests:

<Tabs groupId="component-type" queryString="component-type">
  <TabItem value="decider" label="Decider">

```ts
Deno.test(function markOrderAsPeparedDeciderTest() {
  // Parse the order command from the request / Zod validation/parsing
  const markOrderAsPreparedCommand: OrderCommand = orderCommandSchema
    .parse(
      JSON.parse(markOrderAsPreparedCommandJson),
    );

  // Parse the order event.
  const orderCreatedEvent: OrderEvent = orderEventSchema
    .parse(
      JSON.parse(orderCreatedEventJson),
    );
  // Parse the order event.
  const orderPreparedEvent: OrderEvent = orderEventSchema
    .parse(
      JSON.parse(orderPreparedEventJson),
    );

  // Run the test specification for the order decider
  DeciderSpecification.for(orderDecider)
    .given([orderCreatedEvent])
    .when(markOrderAsPreparedCommand)
    .then([orderPreparedEvent]);
});
```

  </TabItem>
  <TabItem value="view" label="View">

```ts

Deno.test(function orderPreparedViewTest() {
  // Parse the order event.
  const orderCreatedEvent: OrderEvent = orderEventSchema
    .parse(
      JSON.parse(orderCreatedEventJson),
    );
  const orderPreparedEvent: OrderEvent = orderEventSchema
    .parse(
      JSON.parse(orderPreparedEventJson),
    );

  ViewSpecification.for(orderView)
    .given([orderCreatedEvent, orderPreparedEvent])
    .then({
      orderId: "691490bb-c4d3-45b8-99d0-efcf20e353ag",
      restaurantId: "691490bb-c4d3-45b8-99d0-efcf20e353ao",
      menuItems: [
        { menuItemId: "1", name: "Salad2", price: "18.59" },
        { menuItemId: "2", name: "Soup2", price: "16.94" },
        { menuItemId: "3", name: "Steak2", price: "19.89" },
      ],
      status: "PREPARED",
    });
});
```

  </TabItem>
  
</Tabs>

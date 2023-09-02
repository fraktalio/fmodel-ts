# **f`(`model`)`** - Functional Domain Modeling with TypeScript

[![CI with Node/NPM - Test and Build](https://github.com/fraktalio/fmodel-ts/actions/workflows/node-test-build.yml/badge.svg)](https://github.com/fraktalio/fmodel-ts/actions/workflows/node-test-build.yml)

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

*The logic is orchestrated on the application layer. The components/functions are composed in different ways to support variety of requirements.*

![aggregates-application-layer](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/aggregates.png)

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

*The logic is orchestrated on the application layer. The components/functions are composed in different ways to support variety of requirements.*

![materialized-views-application-layer](https://github.com/fraktalio/fmodel-ts/raw/main/.assets/mviews.png)

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

## Install

```shell
npm i @fraktalio/fmodel-ts
```
> Available on [https://www.npmjs.com/package/@fraktalio/fmodel-ts](https://www.npmjs.com/package/@fraktalio/fmodel-ts)

## Examples

- Why don't you start by browsing [tests](https://github.com/fraktalio/fmodel-ts/blob/main/src/lib/domain/decider.spec.ts)?
- [Event sourcing and event streaming with Axon - Gift Card domain](https://github.com/AxonIQ/giftcard-demo-ts)

## Resources

- [The Blog - Domain modeling](https://fraktalio.com/blog/)
- [A Kotlin multiplatform version of the library](https://github.com/fraktalio/fmodel)
- [Event Modeling - What is it?](https://eventmodeling.org/posts/what-is-event-modeling/)

## Credits

Special credits to `Jérémie Chassaing` for sharing his [research](https://www.youtube.com/watch?v=kgYGMVDHQHs)
and `Adam Dymitruk` for hosting the meetup.

---
Created with :heart: by [Fraktalio](https://fraktalio.com/)

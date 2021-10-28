# **f`(`model`)`** - Functional Domain Modeling with TypeScript

[![CI with Node/NPM - Test and Build](https://github.com/fraktalio/fmodel-ts/actions/workflows/node-test-build.yml/badge.svg)](https://github.com/fraktalio/fmodel-ts/actions/workflows/node-test-build.yml)

When you’re developing an information system to automate the activities of the business, you are modeling the business.
The abstractions that you design, the behaviors that you implement, and the UI interactions that you build all reflect
the business — together, they constitute the model of the domain.

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

`_Decider` is a datatype that represents the main decision-making algorithm. It belongs to the Domain layer. It has five
generic parameters `C`, `Si`, `So`, `Ei`, `Eo` , representing the type of the values that `_Decider` may contain or use.
`_Decider` can be specialized for any type `C` or `Si` or `So` or `Ei` or `Eo` because these types do not affect its
behavior. `_Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.

`_Decider` is a pure domain component.

- `C` - Command
- `Si` - input State
- `So` - output State
- `Ei` - input Event
- `Eo` - output Event

We make a difference between input and output types, and we are more general in this case. We can always specialize down
to the 3 generic parameters: `export class Decider<C, S, E> extends _Decider<C, S, S, E, E> {}`

```typescript
export class _Decider<C, Si, So, Ei, Eo> {
    constructor(
      readonly decide: (c: C, s: Si) => readonly Eo[],
      readonly evolve: (s: Si, e: Ei) => So,
      readonly initialState: So
    ) {}
}

export class Decider<C, S, E> extends _Decider<C, S, S, E, E> {}
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

`_View`  is a datatype that represents the event handling algorithm, responsible for translating the events into
denormalized state, which is more adequate for querying. It belongs to the Domain layer. It is usually used to create
the view/query side of the CQRS pattern. Obviously, the command side of the CQRS is usually event-sourced aggregate.

It has three generic parameters `Si`, `So`, `E`, representing the type of the values that `_View` may contain or use.
`_View` can be specialized for any type of `Si`, `So`, `E` because these types do not affect its behavior.
`_View` behaves the same for `E`=`Int` or `E`=`YourCustomType`, for example.

`_View` is a pure domain component.

- `Si` - input State
- `So` - output State
- `E`  - Event

We make a difference between input and output types, and we are more general in this case. We can always specialize down
to the 2 generic parameters: `class View<S, E> extends _View<S, S, E> {}`

```typescript
export class _View<Si, So, E> {
    constructor(
        readonly evolve: (s: Si, e: E) => So,
        readonly initialState: So
    ) {}
}

export class View<S, E> extends _View<S, S, E> {}
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

```typescript
export class Saga<AR, A> {
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

## Credits

Special credits to `Jérémie Chassaing` for sharing his [research](https://www.youtube.com/watch?v=kgYGMVDHQHs)
and `Adam Dymitruk` for hosting the meetup.

---
Created with :heart: by [Fraktalio](https://fraktalio.com/)

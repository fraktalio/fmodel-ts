---
sidebar_position: 2
---

# Kotlin (Multiplatform)


Kotlin is ideal thanks to its language features and type system, which enforce correctness and reduce the likelihood of bugs. 
By modeling the domain accurately, we aim to use the Kotlin compiler to catch errors early and prevent them from propagating to runtime.

 - You can find the source code for the `fmodel` [here](https://fraktalio.com/fmodel/)

## Decide

`decide: (C, S) -> Flow<E>`

On a higher level of abstraction, any information system is responsible for handling the intent (`Command`) and based on
the current `State`, produce new facts (`Events`):

- given the current `State/S` *on the input*,
- when `Command/C` is handled *on the input*,
- expect `list` of new `Events/E` to be published/emitted *on the output*

## Evolve

`evolve: (S, E) -> S`

The new state is always evolved out of the current state `S` and the current event `E`:

- given the current `State/S` *on the input*,
- when `Event/E` is handled *on the input*,
- expect new `State/S` to be published *on the output*

Two functions are wrapped in a datatype class (algebraic data structure), which is generalized with three generic
parameters:

```kotlin
data class Decider<in C, S, E>(
    override val decide: (C, S) -> Flow<E>,
    override val evolve: (S, E) -> S,
    override val initialState: S
) : IDecider<C, S, E> 
```

## Further reading

[**Read more**](https://fraktalio.com/fmodel/)
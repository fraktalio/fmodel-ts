/*
 * Copyright 2023 Fraktalio D.O.O. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "
 * AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */

/* eslint-disable functional/no-mixed-types, functional/no-classes */

/**
 * `_Decider` is a datatype that represents the main decision-making algorithm.
 * It has five generic parameters `C`, `Si`, `So`, `Ei`, `Eo` , representing the type of the values that `_Decider` may contain or use.
 * `_Decider` can be specialized for any type `C` or `Si` or `So` or `Ei` or `Eo` because these types does not affect its behavior.
 * `_Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `_Decider` is a pure `internal` domain component.
 * It is not exported, and rather used to differentiate covariant and contravariant parameters, so we can map over them correctly.
 *
 * _Decider` is used to model simpler (three parameter) public `Decider` component that has more practical usage.
 * `Decider` has three type parameters: `C`, `S`, `E`, in where `E` = `Ei` = `Eo` and `S` = `Si` = `So`
 *
 * @typeParam C - Command
 * @typeParam Si - Input_State type
 * @typeParam So - Output_State type
 * @typeParam Ei - Input_Event type
 * @typeParam Eo - Output_Event type
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
class _Decider<C, Si, So, Ei, Eo> {
  constructor(
    readonly decide: (c: C, s: Si) => readonly Eo[],
    readonly evolve: (s: Si, e: Ei) => So,
    readonly initialState: So,
  ) {}

  /**
   * Contra (Left) map on C/Command parameter - Contravariant
   *
   * @typeParam Cn - New Command
   */
  mapContraOnCommand<Cn>(f: (cn: Cn) => C): _Decider<Cn, Si, So, Ei, Eo> {
    return new _Decider(
      (cn: Cn, s: Si) => this.decide(f(cn), s),
      (s: Si, e: Ei) => this.evolve(s, e),
      this.initialState,
    );
  }

  /**
   * Dimap on E/Event parameter - Contravariant on input event and Covariant on output event = Profunctor
   *
   * @typeParam Ein - New input Event
   * @typeParam Eon - New output Event
   */
  dimapOnEvent<Ein, Eon>(
    fl: (ein: Ein) => Ei,
    fr: (eo: Eo) => Eon,
  ): _Decider<C, Si, So, Ein, Eon> {
    return new _Decider(
      (c: C, s: Si) => this.decide(c, s).map(fr),
      (s: Si, ein: Ein) => this.evolve(s, fl(ein)),
      this.initialState,
    );
  }

  /**
   * Dimap on S/State parameter - Contravariant on input state (Si) and Covariant on output state (So) = Profunctor
   *
   * @typeParam Sin - New input State
   * @typeParam Son - New output State
   */
  dimapOnState<Sin, Son>(
    fl: (sin: Sin) => Si,
    fr: (so: So) => Son,
  ): _Decider<C, Sin, Son, Ei, Eo> {
    return new _Decider(
      (c: C, sin: Sin) => this.decide(c, fl(sin)),
      (sin: Sin, e: Ei) => fr(this.evolve(fl(sin), e)),
      fr(this.initialState),
    );
  }

  /**
   * Contra (Left) map on S/State parameter - Contravariant
   *
   * @typeParam Sin - New input State
   */
  mapContraOnState<Sin>(f: (sin: Sin) => Si): _Decider<C, Sin, So, Ei, Eo> {
    return this.dimapOnState(f, identity);
  }

  /**
   * (Right) map on S/State parameter - Covariant
   *
   * @typeParam Son - New output State
   */
  mapOnState<Son>(f: (so: So) => Son): _Decider<C, Si, Son, Ei, Eo> {
    return this.dimapOnState(identity, f);
  }

  /**
   * Right apply on S/State parameter - Applicative
   *
   * @typeParam Son - New output State
   */
  applyOnState<Son>(
    ff: _Decider<C, Si, (so: So) => Son, Ei, Eo>,
  ): _Decider<C, Si, Son, Ei, Eo> {
    return new _Decider(
      (c: C, s: Si) => ff.decide(c, s).concat(this.decide(c, s)),
      (s: Si, e: Ei) => ff.evolve(s, e)(this.evolve(s, e)),
      ff.initialState(this.initialState),
    );
  }

  /**
   * Right product on S/State parameter - Applicative
   * Combines state via intersection (So & Son)
   *
   * @typeParam Son - New output State
   */
  productOnState<Son>(
    fb: _Decider<C, Si, Son, Ei, Eo>,
  ): _Decider<C, Si, So & Son, Ei, Eo> {
    return this.applyOnState(
      fb.mapOnState((son: Son) => (so: So) => {
        return Object.assign({}, so, son);
      }),
    );
  }

  /**
   * Right product on S/State parameter - Applicative
   * Combines state via tuple [So, Son]
   *
   * @typeParam Son - New output State
   */
  productViaTuplesOnState<Son>(
    fb: _Decider<C, Si, Son, Ei, Eo>,
  ): _Decider<C, Si, readonly [So, Son], Ei, Eo> {
    return this.applyOnState(fb.mapOnState((b: Son) => (a: So) => [a, b]));
  }

  /**
   * Combine Deciders into one big Decider
   *
   * The States/S are combined via `intersection`
   */
  combine<C2, Si2, So2, Ei2, Eo2>(
    y: _Decider<C2, Si2, So2, Ei2, Eo2>,
  ): _Decider<C | C2, Si & Si2, So & So2, Ei | Ei2, Eo | Eo2> {
    const deciderX = this.mapContraOnCommand<C | C2>((c) => c as C)
      .mapContraOnState<Si & Si2>((sin) => sin as Si)
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei,
        (eo) => eo,
      );

    const deciderY = y
      .mapContraOnCommand<C | C2>((c) => c as C2)
      .mapContraOnState<Si & Si2>((sin) => sin as Si2)
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei2,
        (eo2) => eo2,
      );

    return deciderX.productOnState(deciderY);
  }

  /**
   * Combine Deciders into one big Decider
   *
   * The States/S are combined via `tuples`
   */
  combineViaTuples<C2, Si2, So2, Ei2, Eo2>(
    y: _Decider<C2, Si2, So2, Ei2, Eo2>,
  ): _Decider<
    C | C2,
    readonly [Si, Si2],
    readonly [So, So2],
    Ei | Ei2,
    Eo | Eo2
  > {
    const deciderX = this.mapContraOnCommand<C | C2>((c) => c as C)
      .mapContraOnState<readonly [Si, Si2]>((sin) => sin[0])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei,
        (eo) => eo,
      );

    const deciderY = y
      .mapContraOnCommand<C | C2>((c) => c as C2)
      .mapContraOnState<readonly [Si, Si2]>((sin) => sin[1])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei2,
        (eo2) => eo2,
      );

    return deciderX.productViaTuplesOnState(deciderY);
  }
}

/**
 * `IDecider` represents the main decision-making algorithm.
 * It has three generic parameters `C`, `S`, `E` , representing the type of the values that `IDecider` may contain or use.
 * `IDecider` can be specialized for any type `C` or `S` or `E` because these types does not affect its behavior.
 * `IDecider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `IDecider` is a pure domain interface.
 *
 * @typeParam C - Command
 * @typeParam S - State
 * @typeParam E - Event
 *
 * @param decide - A function/lambda that takes command of type `C` and input state of type `S` as parameters, and returns/emits the list of output events `E[]`>
 * @param evolve - A function/lambda that takes input state of type `S` and input event of type `E` as parameters, and returns the output/new state `S`
 * @param initialState - A starting point / An initial state of type `S`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IDecider<C, S, E> {
  readonly decide: (command: C, state: S) => readonly E[];
  readonly evolve: (state: S, event: E) => S;
  readonly initialState: S;
}

/**
 * `Decider` is a datatype that represents the main decision-making algorithm.
 * It has three generic parameters `C`, `S`, `E` , representing the type of the values that `Decider` may contain or use.
 * `Decider` can be specialized for any type `C` or `S` or `E` because these types does not affect its behavior.
 * `Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `Decider` is a pure domain component.
 *
 * @typeParam C - Command type
 * @typeParam S - State type
 * @typeParam E - Event type
 * @param decide - A function/lambda that takes command of type `C` and input state of type `S` as parameters, and returns/emits the list of output events `E[]`>
 * @param evolve - A function/lambda that takes input state of type `S` and input event of type `E` as parameters, and returns the output/new state `S`
 * @param initialState - A starting point / An initial state of type `S`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 *
 * @example
 * ```typescript
 * export const orderDecider: Decider<OrderCommand, Order | null, OrderEvent> =
 *   new Decider<OrderCommand, Order | null, OrderEvent>(
 *     (command, currentState) => {
 *       switch (command.kind) {
 *         case "CreateOrderCommand":
 *           return currentState == null
 *             ? [
 *               {
 *                 version: 1,
 *                 decider: "Order",
 *                 kind: "OrderCreatedEvent",
 *                 id: command.id,
 *                 restaurantId: command.restaurantId,
 *                 menuItems: command.menuItems,
 *                 final: false,
 *               },
 *             ]
 *             : [
 *               {
 *                 version: 1,
 *                 decider: "Order",
 *                 kind: "OrderNotCreatedEvent",
 *                 id: command.id,
 *                 restaurantId: command.restaurantId,
 *                 menuItems: command.menuItems,
 *                 final: false,
 *                 reason: "Order already exist!",
 *               },
 *             ];
 *         case "MarkOrderAsPreparedCommand":
 *           return currentState !== null
 *             ? [
 *               {
 *                 version: 1,
 *                 decider: "Order",
 *                 kind: "OrderPreparedEvent",
 *                 id: currentState.orderId,
 *                 final: false,
 *               },
 *             ]
 *             : [
 *               {
 *                 version: 1,
 *                 decider: "Order",
 *                 kind: "OrderNotPreparedEvent",
 *                 id: command.id,
 *                 reason: "Order does not exist!",
 *                 final: false,
 *               },
 *             ];
 *         default:
 *           // Exhaustive matching of the command type
 *           const _: never = command;
 *           return [];
 *       }
 *     },
 *     (currentState, event) => {
 *       switch (event.kind) {
 *         case "OrderCreatedEvent":
 *           return {
 *             orderId: event.id,
 *             restaurantId: event.restaurantId,
 *             menuItems: event.menuItems,
 *             status: "CREATED",
 *           };
 *         case "OrderNotCreatedEvent":
 *           return currentState;
 *         case "OrderPreparedEvent":
 *           return currentState !== null
 *             ? {
 *               orderId: currentState.orderId,
 *               restaurantId: currentState.restaurantId,
 *               menuItems: currentState.menuItems,
 *               status: "PREPARED",
 *             }
 *             : currentState;
 *         case "OrderNotPreparedEvent":
 *           return currentState;
 *         default:
 *           // Exhaustive matching of the event type
 *           const _: never = event;
 *           return currentState;
 *       }
 *     },
 *     null,
 *   );
 * ```
 */
export class Decider<C, S, E> implements IDecider<C, S, E> {
  constructor(
    readonly decide: (command: C, state: S) => readonly E[],
    readonly evolve: (state: S, event: E) => S,
    readonly initialState: S,
  ) {}

  /**
   * Contra (Left) map on C/Command parameter - Contravariant
   *
   * @typeParam Cn - New Command
   */
  mapContraOnCommand<Cn>(f: (cn: Cn) => C): Decider<Cn, S, E> {
    return asDecider(
      new _Decider(
        this.decide,
        this.evolve,
        this.initialState,
      ).mapContraOnCommand(f),
    );
  }

  /**
   * Dimap on E/Event parameter - Profunctor
   *
   * @typeParam En - New Event
   */
  dimapOnEvent<En>(fl: (en: En) => E, fr: (e: E) => En): Decider<C, S, En> {
    return asDecider(
      new _Decider(this.decide, this.evolve, this.initialState).dimapOnEvent(
        fl,
        fr,
      ),
    );
  }

  /**
   * Dimap on S/State parameter  - Profunctor
   *
   * @typeParam Sn - New State
   */
  dimapOnState<Sn>(fl: (sn: Sn) => S, fr: (s: S) => Sn): Decider<C, Sn, E> {
    return asDecider(
      new _Decider(this.decide, this.evolve, this.initialState).dimapOnState(
        fl,
        fr,
      ),
    );
  }

  /**
   * Combine multiple Deciders into one Decider  - Monoid
   *
   * State/S is combined via `intersection / (S & S2)`. It only makes sense if S ans S2 are objects, not primitives.
   * Check alternative method `combineViaTuples`
   *
   * Intersections provide more flexibility and can handle more complex scenarios,
   * while tuples are more straightforward and may be more suitable for simple cases.
   *
   * Flexibility: If you anticipate needing to access individual components of the combined state separately, using tuples might be more appropriate, as it allows you to maintain separate types for each component. However, if you primarily need to treat the combined state as a single entity with all properties accessible at once, intersections might be more suitable.
   *
   * Readability: Consider which approach makes your code more readable and understandable to other developers who may be working with your codebase. Choose the approach that best communicates your intentions and the structure of your data.
   *
   * Compatibility: Consider the compatibility of your chosen approach with other libraries, frameworks, or tools you're using in your TypeScript project. Some libraries or tools might work better with one approach over the other.
   */
  combine<C2, S2, E2>(
    decider2: Decider<C2, S2, E2>,
  ): Decider<C | C2, S & S2, E | E2> {
    return asDecider(
      new _Decider(this.decide, this.evolve, this.initialState).combine(
        new _Decider(decider2.decide, decider2.evolve, decider2.initialState),
      ),
    );
  }

  /**
   * Combine multiple Deciders into one Decider - Monoid
   *
   * State/S is combined via `tuples / [S, S2]`. Check alternative method `combine`
   *
   * Tuples are more straightforward and may be more suitable for simple cases,
   * while intersections provide more flexibility and can handle more complex scenarios.
   *
   * 1. Flexibility: If you anticipate needing to access individual components of the combined state separately, using tuples might be more appropriate, as it allows you to maintain separate types for each component. However, if you primarily need to treat the combined state as a single entity with all properties accessible at once, intersections might be more suitable.
   *
   * 2. Readability: Consider which approach makes your code more readable and understandable to other developers who may be working with your codebase. Choose the approach that best communicates your intentions and the structure of your data.
   *
   * 3. Compatibility: Consider the compatibility of your chosen approach with other libraries, frameworks, or tools you're using in your TypeScript project. Some libraries or tools might work better with one approach over the other.
   */
  combineViaTuples<C2, S2, E2>(
    decider2: Decider<C2, S2, E2>,
  ): Decider<C | C2, readonly [S, S2], E | E2> {
    return asDecider(
      new _Decider(
        this.decide,
        this.evolve,
        this.initialState,
      ).combineViaTuples(
        new _Decider(decider2.decide, decider2.evolve, decider2.initialState),
      ),
    );
  }
}

/**
 * Identity function
 */
const identity = <T>(t: T) => t;

/**
 * Creates `Decider` from internal `_Decider`
 *
 * @param decider
 */
function asDecider<C, S, E>(
  decider: _Decider<C, S, S, E, E>,
): Decider<C, S, E> {
  return new Decider(decider.decide, decider.evolve, decider.initialState);
}

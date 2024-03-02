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

/* eslint-disable functional/no-mixed-types,functional/no-classes */

/**
 * `_View` is a datatype that represents the event handling algorithm,
 * responsible for translating the events into denormalized state,
 * which is more adequate for querying.
 *
 * @typeParam Si - input State
 * @typeParam So - output State
 * @typeParam E - Event
 *
 * @param evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
 * @param initialState - A starting point / An initial state of type `So`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
class _View<Si, So, E> {
  constructor(
    readonly evolve: (s: Si, e: E) => So,
    readonly initialState: So
  ) {}

  /**
   * Contra (Left) map on E/Event parameter - Contravariant
   *
   * @typeParam En - New Event
   */
  mapContraOnEvent<En>(f: (en: En) => E): _View<Si, So, En> {
    return new _View(
      (s: Si, en: En) => this.evolve(s, f(en)),
      this.initialState
    );
  }

  /**
   * Dimap on S/State parameter - Contravariant on the Si (input State) - Covariant on the So (output State) = Profunctor
   *
   * @typeParam Sin - New input State
   * @typeParam Son - New output State
   */
  dimapOnState<Sin, Son>(
    fl: (sin: Sin) => Si,
    fr: (so: So) => Son
  ): _View<Sin, Son, E> {
    return new _View(
      (s: Sin, e: E) => fr(this.evolve(fl(s), e)),
      fr(this.initialState)
    );
  }

  /**
   * Contra (Left) map on S/State parameter - Contravariant
   *
   * @typeParam Sin - New input State
   */
  mapContraOnState<Sin>(f: (sin: Sin) => Si): _View<Sin, So, E> {
    return this.dimapOnState(f, identity);
  }

  /**
   * (Right) map on S/State parameter - Covariant
   *
   * @typeParam Son - New output State
   */
  mapOnState<Son>(f: (so: So) => Son): _View<Si, Son, E> {
    return this.dimapOnState(identity, f);
  }

  /**
   * Right apply on S/State parameter - Applicative
   *
   * @typeParam Son - New output State
   */
  applyOnState<Son>(ff: _View<Si, (so: So) => Son, E>): _View<Si, Son, E> {
    return new _View(
      (s: Si, e: E) => ff.evolve(s, e)(this.evolve(s, e)),
      ff.initialState(this.initialState)
    );
  }

  /**
   * Right product on S/State parameter - Applicative
   *
   * Combines state via tuple [So, Son]
   *
   * @typeParam Son - New output State
   */
  productOnState<Son>(fb: _View<Si, Son, E>): _View<Si, readonly [So, Son], E> {
    return this.applyOnState(fb.mapOnState((b: Son) => (a: So) => [a, b]));
  }

  /**
   * Right product on S/State parameter - Applicative
   *
   * Combines state via intersection (So & Son)
   *
   * @typeParam Son - New output State
   */
  productAndIntersectionOnState<Son extends object>(
    fb: _View<Si, Son, E>
  ): _View<Si, So & Son, E> {
    return this.applyOnState(
      fb.mapOnState((b: Son) => (a: So) => ({ ...a, ...b }))
    );
  }

  /**
   * Combines multiple Views into one View.
   *
   * Combines state via tuple [So, Son].
   *
   */
  combine<Si2, So2, E2>(
    y: _View<Si2, So2, E2>
  ): _View<readonly [Si, Si2], readonly [So, So2], E | E2> {
    const viewX = this.mapContraOnEvent<E | E2>(
      (en) => en as unknown as E
    ).mapContraOnState<readonly [Si, Si2]>((sin) => sin[0]);

    const viewY = y
      .mapContraOnEvent<E | E2>((en2) => en2 as unknown as E2)
      .mapContraOnState<readonly [Si, Si2]>((sin) => sin[1]);

    return viewX.productOnState(viewY);
  }

  /**
   * Combines multiple Views into one View.
   *
   * Combines state via intersection (So & Son)
   *
   */
  combineAndIntersect<Si2 extends object, So2 extends object, E2>(
    y: _View<Si2, So2, E2>
  ): _View<Si & Si2, So & So2, E | E2> {
    const viewX = this.mapContraOnEvent<E | E2>(
      (en) => en as unknown as E
    ).mapContraOnState<Si & Si2>((sin) => sin as Si);

    const viewY = y
      .mapContraOnEvent<E | E2>((en2) => en2 as unknown as E2)
      .mapContraOnState<Si & Si2>((sin) => sin as Si2);

    return viewX.productAndIntersectionOnState(viewY);
  }
}

/**
 * `IView` Interface
 *
 * Represents the event handling algorithm,
 * responsible for translating the events into denormalized state,
 * which is more adequate for querying.
 *
 * @typeParam S - State
 * @typeParam E - Event
 *
 * @param evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
 * @param initialState - A starting point / An initial state of type `So`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IView<S, E> {
  readonly evolve: (s: S, e: E) => S;
  readonly initialState: S;
}

/**
 * `View` is a datatype that represents the event handling algorithm,
 * responsible for translating the events into denormalized state,
 * which is more adequate for querying.
 *
 * @typeParam S - State
 * @typeParam E - Event
 *
 * ### Example
 * ```typescript
 * export const orderView: View<OrderView | null, OrderEvent> = new View<
 *   OrderView | null,
 *   OrderEvent
 * >(
 *   (currentState, event) => {
 *     switch (event.kind) {
 *       case "OrderCreatedEvent":
 *         return new OrderView(
 *           event.id,
 *           event.restaurantId,
 *           event.menuItems,
 *           "CREATED",
 *         );
 *       case "OrderNotCreatedEvent":
 *         return currentState;
 *       case "OrderPreparedEvent":
 *         return currentState !== null
 *           ? new OrderView(
 *             currentState.id,
 *             currentState.restaurantId,
 *             currentState.menuItems,
 *             "PREPARED",
 *           )
 *           : currentState;
 *       case "OrderNotPreparedEvent":
 *         return currentState;
 *       default:
 *         // Exhaustive matching of the event type
 *         const _: never = event;
 *         return currentState;
 *     }
 *   },
 *   null,
 * );
 * ```
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class View<S, E> implements IView<S, E> {
  constructor(readonly evolve: (s: S, e: E) => S, readonly initialState: S) {}

  /**
   * @deprecated This method is deprecated/renamed. Use `mapContraOnEvent` instead.
   *
   * @typeParam En - New Event
   */
  mapLeftOnEvent<En>(f: (en: En) => E): View<S, En> {
    return asView(
      new _View(this.evolve, this.initialState).mapContraOnEvent(f)
    );
  }

  /**
   * Contra (Left) map on E/Event parameter - Contravariant
   *
   * @typeParam En - New Event
   */
  mapContraOnEvent<En>(f: (en: En) => E): View<S, En> {
    return asView(
      new _View(this.evolve, this.initialState).mapContraOnEvent(f)
    );
  }

  /**
   * Dimap on S/State parameter - Profunctor
   *
   * @typeParam Sn - New State
   */
  dimapOnState<Sn>(fl: (sn: Sn) => S, fr: (s: S) => Sn): View<Sn, E> {
    return asView(
      new _View(this.evolve, this.initialState).dimapOnState(fl, fr)
    );
  }

  /**
   * Combines Views into one bigger View - Monoid
   *
   * Combines state via tuple [S, S2]. Check alternative method `combineAndIntersect`
   *
   * 1. Flexibility: If you anticipate needing to access individual components of the combined state separately, using tuples might be more appropriate, as it allows you to maintain separate types for each component. However, if you primarily need to treat the combined state as a single entity with all properties accessible at once, intersections might be more suitable.
   *
   * 2. Readability: Consider which approach makes your code more readable and understandable to other developers who may be working with your codebase. Choose the approach that best communicates your intentions and the structure of your data.
   *
   * 3. Compatibility: Consider the compatibility of your chosen approach with other libraries, frameworks, or tools you're using in your TypeScript project. Some libraries or tools might work better with one approach over the other.
   */
  combine<S2, E2>(y: View<S2, E2>): View<readonly [S, S2], E | E2> {
    return asView(
      new _View(this.evolve, this.initialState).combine(
        new _View(y.evolve, y.initialState)
      )
    );
  }

  /**
   * Combines Views into one bigger View - Monoid
   *
   * Combines state via intersection (S & S2). Check alternative method `combine`.
   *
   * 1. Flexibility: If you anticipate needing to access individual components of the combined state separately, using tuples might be more appropriate, as it allows you to maintain separate types for each component. However, if you primarily need to treat the combined state as a single entity with all properties accessible at once, intersections might be more suitable.
   *
   * 2. Readability: Consider which approach makes your code more readable and understandable to other developers who may be working with your codebase. Choose the approach that best communicates your intentions and the structure of your data.
   *
   * 3. Compatibility: Consider the compatibility of your chosen approach with other libraries, frameworks, or tools you're using in your TypeScript project. Some libraries or tools might work better with one approach over the other.
   */
  combineAndIntersect<S2 extends object, E2>(
    y: View<S2, E2>
  ): View<S & S2, E | E2> {
    return asView(
      new _View(this.evolve, this.initialState).combineAndIntersect(
        new _View(y.evolve, y.initialState)
      )
    );
  }
}

/**
 * Identity function
 */
const identity = <T>(t: T) => t;

/**
 * Creates `View` from internal `_View`
 *
 * @param view
 */
function asView<S, E>(view: _View<S, S, E>): View<S, E> {
  return new View(view.evolve, view.initialState);
}

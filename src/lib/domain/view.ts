/*
 * Copyright 2022 Fraktalio D.O.O. All rights reserved.
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

/* eslint-disable functional/no-this-expression,functional/prefer-type-literal,functional/no-mixed-type, functional/no-class */

/**
 * `I_View` represents the event handling algorithm,
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
export interface I_View<Si, So, E> {
  readonly evolve: (s: Si, e: E) => So;
  readonly initialState: So;
}

/**
 * `IView` represents the event handling algorithm,
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
export type IView<S, E> = I_View<S, S, E>;

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
export class _View<Si, So, E> implements I_View<Si, So, E> {
  /**
   * @constructor - creates the `_View`
   * @param evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
   * @param initialState - A starting point / An initial state of type `So`
   */
  constructor(
    readonly evolve: (s: Si, e: E) => So,
    readonly initialState: So
  ) {}

  /**
   * Left map on E/Event parameter - Contravariant
   *
   * @typeParam En - New Event
   */
  mapLeftOnEvent<En>(f: (en: En) => E): _View<Si, So, En> {
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
   * Left map on S/State parameter - Contravariant
   *
   * @typeParam Sin - New input State
   */
  private mapLeftOnState<Sin>(f: (sin: Sin) => Si): _View<Sin, So, E> {
    return this.dimapOnState(f, identity);
  }

  /**
   * Right map on S/State parameter - Covariant
   *
   * @typeParam Son - New output State
   */
  private mapOnState<Son>(f: (so: So) => Son): _View<Si, Son, E> {
    return this.dimapOnState(identity, f);
  }

  /**
   * Right apply on S/State parameter - Applicative
   *
   * @typeParam Son - New output State
   */
  private applyOnState<Son>(
    ff: _View<Si, (so: So) => Son, E>
  ): _View<Si, Son, E> {
    return new _View(
      (s: Si, e: E) => ff.evolve(s, e)(this.evolve(s, e)),
      ff.initialState(this.initialState)
    );
  }

  /**
   * Right product on S/State parameter - Applicative
   *
   * @typeParam Son - New output State
   */
  private productOnState<Son>(
    fb: _View<Si, Son, E>
  ): _View<Si, readonly [So, Son], E> {
    return this.applyOnState(fb.mapOnState((b: Son) => (a: So) => [a, b]));
  }

  /**
   * Combines Views into one bigger View
   *
   */
  combine<Si2, So2, E2>(
    y: _View<Si2, So2, E2>
  ): _View<readonly [Si, Si2], readonly [So, So2], E | E2> {
    const viewX = this.mapLeftOnEvent<E | E2>(
      (en) => en as unknown as E
    ).mapLeftOnState<readonly [Si, Si2]>((sin) => sin[0]);

    const viewY = y
      .mapLeftOnEvent<E | E2>((en2) => en2 as unknown as E2)
      .mapLeftOnState<readonly [Si, Si2]>((sin) => sin[1]);

    return viewX.productOnState(viewY);
  }
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
 * const view: View<number, OddNumberEvt> = new View<number, OddNumberEvt>(
 * (s, e) => {
 *    if (e instanceof OddNumberAddedEvt) {
 *      return s + e.value;
 *    } else if (e instanceof OddNumberMultiplied) {
 *      return s * e.value;
 *    } else {
 *      const _: never = e;
 *      console.log('Never just happened in evolve function: ' + _);
 *      return s;
 *    }
 *  },
 * 0
 * );
 * ```
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class View<S, E> extends _View<S, S, E> implements IView<S, E> {}

/**
 * Identity function
 */
const identity = <T>(t: T) => t;

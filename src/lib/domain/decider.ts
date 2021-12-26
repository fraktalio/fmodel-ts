/*
 * Copyright 2021 Fraktalio D.O.O. All rights reserved.
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

/* eslint-disable functional/no-this-expression,functional/no-mixed-type, functional/no-class, functional/prefer-type-literal */

/**
 * `I_Decider` represents the main decision-making algorithm.
 * It has five generic parameters `C`, `Si`, `So`, `Ei`, `Eo` , representing the type of the values that `I_Decider` may contain or use.
 * `I_Decider` can be specialized for any type `C` or `Si` or `So` or `Ei` or `Eo` because these types does not affect its behavior.
 * `I_Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `I_Decider` is a pure domain interface.
 *
 * @typeParam C - Command
 * @typeParam Si - Input_State type
 * @typeParam So - Output_State type
 * @typeParam Ei - Input_Event type
 * @typeParam Eo - Output_Event type
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface I_Decider<C, Si, So, Ei, Eo> {
  readonly decide: (c: C, s: Si) => readonly Eo[];
  readonly evolve: (s: Si, e: Ei) => So;
  readonly initialState: So;
}

/**
 * `IDecider` represents the main decision-making algorithm.
 * It has five generic parameters `C`, `S`, `E` , representing the type of the values that `IDecider` may contain or use.
 * `IDecider` can be specialized for any type `C` or `S` or `E` because these types does not affect its behavior.
 * `IDecider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `IDecider` is a pure domain interface.
 *
 * @typeParam C - Command
 * @typeParam S - State
 * @typeParam E - Event
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export type IDecider<C, S, E> = I_Decider<C, S, S, E, E>;

/**
 * `_Decider` is a datatype that represents the main decision-making algorithm.
 * It has five generic parameters `C`, `Si`, `So`, `Ei`, `Eo` , representing the type of the values that `_Decider` may contain or use.
 * `_Decider` can be specialized for any type `C` or `Si` or `So` or `Ei` or `Eo` because these types does not affect its behavior.
 * `_Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `_Decider` is a pure domain component.
 *
 * @typeParam C - Command
 * @typeParam Si - Input_State type
 * @typeParam So - Output_State type
 * @typeParam Ei - Input_Event type
 * @typeParam Eo - Output_Event type
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class _Decider<C, Si, So, Ei, Eo>
  implements I_Decider<C, Si, So, Ei, Eo>
{
  /**
   * @constructor Creates the `_Decider`
   * @param decide - A function/lambda that takes command of type `C` and input state of type `Si` as parameters, and returns/emits the list of output events `Eo[]`>
   * @param evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
   * @param initialState - A starting point / An initial state of type `So`
   */
  constructor(
    readonly decide: (c: C, s: Si) => readonly Eo[],
    readonly evolve: (s: Si, e: Ei) => So,
    readonly initialState: So
  ) {}

  /**
   * Left map on C/Command parameter - Contravariant
   *
   * @typeParam Cn - New Command
   */
  mapLeftOnCommand<Cn>(f: (cn: Cn) => C): _Decider<Cn, Si, So, Ei, Eo> {
    return new _Decider(
      (cn: Cn, s: Si) => this.decide(f(cn), s),
      (s: Si, e: Ei) => this.evolve(s, e),
      this.initialState
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
    fr: (eo: Eo) => Eon
  ): _Decider<C, Si, So, Ein, Eon> {
    return new _Decider(
      (c: C, s: Si) => this.decide(c, s).map(fr),
      (s: Si, ein: Ein) => this.evolve(s, fl(ein)),
      this.initialState
    );
  }

  /**
   * Left map on E/Event parameter - Contravariant
   *
   * @typeParam Ein - New input Event
   */
  mapLeftOnEvent<Ein>(f: (ein: Ein) => Ei): _Decider<C, Si, So, Ein, Eo> {
    return this.dimapOnEvent(f, identity);
  }

  /**
   * Right map on E/Event parameter - Covariant
   *
   * @typeParam Eon - New output Event
   */
  mapOnEvent<Eon>(f: (ein: Eo) => Eon): _Decider<C, Si, So, Ei, Eon> {
    return this.dimapOnEvent(identity, f);
  }

  /**
   * Dimap on S/State parameter - Contravariant on input state (Si) and Covariant on output state (So) = Profunctor
   *
   * @typeParam Sin - New input State
   * @typeParam Son - New output State
   */
  dimapOnState<Sin, Son>(
    fl: (sin: Sin) => Si,
    fr: (so: So) => Son
  ): _Decider<C, Sin, Son, Ei, Eo> {
    return new _Decider(
      (c: C, sin: Sin) => this.decide(c, fl(sin)),
      (sin: Sin, e: Ei) => fr(this.evolve(fl(sin), e)),
      fr(this.initialState)
    );
  }

  /**
   * Left map on S/State parameter - Contravariant
   *
   * @typeParam Sin - New input State
   */
  mapLeftOnState<Sin>(f: (sin: Sin) => Si): _Decider<C, Sin, So, Ei, Eo> {
    return this.dimapOnState(f, identity);
  }

  /**
   * Right map on S/State parameter - Covariant
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
    ff: _Decider<C, Si, (so: So) => Son, Ei, Eo>
  ): _Decider<C, Si, Son, Ei, Eo> {
    return new _Decider(
      (c: C, s: Si) => ff.decide(c, s).concat(this.decide(c, s)),
      (s: Si, e: Ei) => ff.evolve(s, e)(this.evolve(s, e)),
      ff.initialState(this.initialState)
    );
  }

  /**
   * Right product on S/State parameter - Applicative
   *
   * @typeParam Son - New output State
   */
  productOnState<Son>(
    fb: _Decider<C, Si, Son, Ei, Eo>
  ): _Decider<C, Si, readonly [So, Son], Ei, Eo> {
    return this.applyOnState(fb.mapOnState((b: Son) => (a: So) => [a, b]));
  }

  /**
   * Combine Deciders into one big Decider
   */
  combine<C2, Si2, So2, Ei2, Eo2>(
    y: _Decider<C2, Si2, So2, Ei2, Eo2>
  ): _Decider<
    C | C2,
    readonly [Si, Si2],
    readonly [So, So2],
    Ei | Ei2,
    Eo | Eo2
  > {
    const deciderX = this.mapLeftOnCommand<C | C2>((c) => c as C)
      .mapLeftOnState<readonly [Si, Si2]>((sin) => sin[0])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei,
        (eo) => eo
      );

    const deciderY = y
      .mapLeftOnCommand<C | C2>((c) => c as C2)
      .mapLeftOnState<readonly [Si, Si2]>((sin) => sin[1])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei2,
        (eo2) => eo2
      );

    return deciderX.productOnState(deciderY);
  }
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
 * const decider: Decider<OddNumberCmd, number, OddNumberEvt> = new Decider<OddNumberCmd, number, OddNumberEvt>(
 * (c, _) => {
 *   if (c instanceof AddOddNumberCmd) {
 *      return [new OddNumberAddedEvt(c.value)];
 *    } else if (c instanceof MultiplyOddNumberCmd) {
 *      return [new OddNumberMultiplied(c.value)];
 *    } else {
 *      const _: never = c;
 *      console.log('Never just happened in decide function: ' + _);
 *      return [];
 *    }
 *  },
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
 */
export class Decider<C, S, E>
  extends _Decider<C, S, S, E, E>
  implements IDecider<C, S, E> {}

/**
 * Identity function
 */
const identity = <T>(t: T) => t;

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

/* eslint-disable functional/no-mixed-type, functional/no-class, functional/prefer-type-literal, functional/no-this-expression */

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
class _Decider<C, Si, So, Ei, Eo> {
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
  mapContraOnState<Sin>(f: (sin: Sin) => Si): _Decider<C, Sin, So, Ei, Eo> {
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
      .mapContraOnState<readonly [Si, Si2]>((sin) => sin[0])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei,
        (eo) => eo
      );

    const deciderY = y
      .mapLeftOnCommand<C | C2>((c) => c as C2)
      .mapContraOnState<readonly [Si, Si2]>((sin) => sin[1])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as Ei2,
        (eo2) => eo2
      );

    return deciderX.productOnState(deciderY);
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
  readonly decide: (c: C, s: S) => readonly E[];
  readonly evolve: (s: S, e: E) => S;
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
export class Decider<C, S, E> implements IDecider<C, S, E> {
  constructor(
    readonly decide: (c: C, s: S) => readonly E[],
    readonly evolve: (s: S, e: E) => S,
    readonly initialState: S
  ) {}

  /**
   * Left map on C/Command parameter - Contravariant
   *
   * @typeParam Cn - New Command
   */
  mapLeftOnCommand<Cn>(f: (cn: Cn) => C): Decider<Cn, S, E> {
    return asDecider(
      new _Decider(
        this.decide,
        this.evolve,
        this.initialState
      ).mapLeftOnCommand(f)
    );
  }

  /**
   * Dimap on E/Event parameter
   *
   * @typeParam En - New Event
   */
  dimapOnEvent<En>(fl: (en: En) => E, fr: (e: E) => En): Decider<C, S, En> {
    return asDecider(
      new _Decider(this.decide, this.evolve, this.initialState).dimapOnEvent(
        fl,
        fr
      )
    );
  }

  /**
   * Dimap on S/State parameter
   *
   * @typeParam Sn - New State
   */
  dimapOnState<Sn>(fl: (sn: Sn) => S, fr: (s: S) => Sn): Decider<C, Sn, E> {
    return asDecider(
      new _Decider(this.decide, this.evolve, this.initialState).dimapOnState(
        fl,
        fr
      )
    );
  }

  /**
   * Combine Deciders into one Decider
   */
  combine<C2, S2, E2>(
    y: Decider<C2, S2, E2>
  ): Decider<C | C2, readonly [S, S2], E | E2> {
    return asDecider(
      new _Decider(this.decide, this.evolve, this.initialState).combine(
        new _Decider(y.decide, y.evolve, y.initialState)
      )
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
  decider: _Decider<C, S, S, E, E>
): Decider<C, S, E> {
  return new Decider(decider.decide, decider.evolve, decider.initialState);
}

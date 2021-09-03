/* eslint-disable functional/no-this-expression */

/* eslint-disable functional/no-class */

/**
 * `_Decider` is a datatype that represents the main decision-making algorithm.
 * It has five generic parameters `C`, `Si`, `So`, `Ei`, `Eo` , representing the type of the values that `_Decider` may contain or use.
 * `_Decider` can be specialized for any type `C` or `Si` or `So` or `Ei` or `Eo` because these types does not affect its behavior.
 * `_Decider` behaves the same for `C`=`Int` or `C`=`YourCustomType`, for example.
 *
 * `_Decider` is a pure domain component.
 *
 * @param C Command type
 * @param Si Input_State type
 * @param So Output_State type
 * @param Ei Input_Event type
 * @param Eo Output_Event type
 * @property decide - A function/lambda that takes command of type `C` and input state of type `Si` as parameters, and returns/emits the list of output events `Eo[]`>
 * @property evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
 * @property initialState - A starting point / An initial state of type `So`
 * @constructor Creates `_Decider`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class _Decider<C, Si, So, Ei, Eo> {
  constructor(
    readonly decide: (c: C, s: Si) => readonly Eo[],
    readonly evolve: (s: Si, e: Ei) => So,
    readonly initialState: So
  ) {}

  /**
   * Left map on C/Command parameter - Contravariant
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
   */
  mapLeftOnEvent<Ein>(f: (ein: Ein) => Ei): _Decider<C, Si, So, Ein, Eo> {
    return this.dimapOnEvent(f, identity);
  }

  /**
   * Right map on E/Event parameter - Covariant
   */
  mapOnEvent<Eon>(f: (ein: Eo) => Eon): _Decider<C, Si, So, Ei, Eon> {
    return this.dimapOnEvent(identity, f);
  }

  /**
   * Dimap on S/State parameter - Contravariant on input state (Si) and Covariant on output state (So) = Profunctor
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
   */
  mapLeftOnState<Sin>(f: (sin: Sin) => Si): _Decider<C, Sin, So, Ei, Eo> {
    return this.dimapOnState(f, identity);
  }

  /**
   * Right map on S/State parameter - Covariant
   */
  mapOnState<Son>(f: (so: So) => Son): _Decider<C, Si, Son, Ei, Eo> {
    return this.dimapOnState(identity, f);
  }

  /**
   * Right apply on S/State parameter - Applicative
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
    const deciderX = this.mapLeftOnCommand<C | C2>((c) => c as unknown as C)
      .mapLeftOnState<readonly [Si, Si2]>((sin) => sin[0])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as unknown as Ei,
        (eo) => eo
      );

    const deciderY = y
      .mapLeftOnCommand<C | C2>((c) => c as unknown as C2)
      .mapLeftOnState<readonly [Si, Si2]>((sin) => sin[1])
      .dimapOnEvent<Ei | Ei2, Eo | Eo2>(
        (ein) => ein as unknown as Ei2,
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
 * @param C Command type
 * @param S State type
 * @param E Event type
 * @property decide - A function/lambda that takes command of type `C` and input state of type `Si` as parameters, and returns/emits the list of output events `Eo[]`>
 * @property evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
 * @property initialState - A starting point / An initial state of type `So`
 * @constructor Creates `Decider`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class Decider<C, S, E> extends _Decider<C, S, S, E, E> {}

/**
 * Identity function
 */
const identity = <T>(t: T) => t;

/* eslint-disable functional/no-this-expression */

/* eslint-disable functional/no-class */

/**
 * `_View` is a datatype that represents the event handling algorithm,
 * responsible for translating the events into denormalized state,
 * which is more adequate for querying.
 *
 * @param Si - input State
 * @param So - output State
 * @param E - Event
 *
 * @constructor Creates `_View`
 *
 * @property evolve - A function/lambda that takes input state of type `Si` and input event of type `Ei` as parameters, and returns the output/new state `So`
 * @property initialState - A starting point / An initial state of type `So`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class _View<Si, So, E> {
  constructor(
    readonly evolve: (s: Si, e: E) => So,
    readonly initialState: So
  ) {}

  /**
   * Left map on E/Event parameter - Contravariant
   */
  mapLeftOnEvent<En>(f: (en: En) => E): _View<Si, So, En> {
    return new _View(
      (s: Si, en: En) => this.evolve(s, f(en)),
      this.initialState
    );
  }

  /**
   * Dimap on S/State parameter - Contravariant on the Si (input State) - Covariant on the So (output State) = Profunctor
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
   */
  mapLeftOnState<Sin>(f: (sin: Sin) => Si): _View<Sin, So, E> {
    return this.dimapOnState(f, identity);
  }

  /**
   * Right map on S/State parameter - Covariant
   *
   */
  mapOnState<Son>(f: (so: So) => Son): _View<Si, Son, E> {
    return this.dimapOnState(identity, f);
  }

  /**
   * Right apply on S/State parameter - Applicative
   *
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
   */
  productOnState<Son>(fb: _View<Si, Son, E>): _View<Si, readonly [So, Son], E> {
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
 * This is a specialized version of the `_View` with `Si=So=S`
 *
 * ### Example (es module)
 * ```js
 * import { View } from 'fmodel-ts'
 * const view: View<number, number> = new View<number, number>((s, e) => {
 *  // pattern matching
 *  if (isNumber(e)) { return s + e; }
 *  else { return s; }
 * }, 0);
 * ```
 *
 * @param S - State
 * @param E - Event
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class View<S, E> extends _View<S, S, E> {}

/**
 * Identity function
 * @param t
 */
const identity = <T>(t: T) => t;

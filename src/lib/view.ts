/* eslint-disable functional/no-this-expression */

/* eslint-disable functional/no-class */

/**
 * _View is a datatype that represents the event handling algorithm,
 * responsible for translating the events into denormalized state,
 * which is more adequate for querying.
 *
 * @param Si - input State
 * @param So - output State
 * @param E - Event
 */
export class _View<Si, So, E> {
  readonly evolve: (s: Si, e: E) => So;
  readonly initialState: So;

  constructor(evolve: (s: Si, e: E) => So, initialState: So) {
    this.evolve = evolve;
    this.initialState = initialState;
  }

  /**
   * Left map on E/Event parameter - Contravariant
   *
   * @param f
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
   * @param fl
   * @param fr
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
   * @param f
   */
  mapLeftOnState<Sin>(f: (sin: Sin) => Si): _View<Sin, So, E> {
    return this.dimapOnState(f, (so) => so);
  }

  /**
   * Right map on S/State parameter - Covariant
   *
   * @param f
   */
  mapOnState<Son>(f: (so: So) => Son): _View<Si, Son, E> {
    return this.dimapOnState((sin) => sin, f);
  }

  /**
   * Right apply on S/State parameter - Applicative
   *
   * @param ff
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
   * @param fb
   */
  productOnState<Son>(fb: _View<Si, Son, E>): _View<Si, readonly [So, Son], E> {
    return this.applyOnState(fb.mapOnState((b: Son) => (a: So) => [a, b]));
  }

  /**
   * Combines Views into one bigger View
   *
   * @param y second View
   * @return new View of type [_View]<[Pair]<[Si], [Si2]>, [Pair]<[So], [So2]>, [E_SUPER]>
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
 * View is a datatype that represents the event handling algorithm,
 * responsible for translating the events into denormalized state,
 * which is more adequate for querying.
 *
 * This is a specialized version of the _View with `Si=So=S`
 *
 * ### Example (es module)
 * ```js
 * import { View } from 'fmodel-ts'
 * const view: View<number, number> = new View<number, number>((s, e) => {
 *  // pattern matching
 *  if (isNumber(e)) { return s + e; }
 *  else { return s; }
 * }, 0);
 * // => 8
 * ```
 *
 * @param S - State
 * @param E - Event
 */
export class View<S, E> extends _View<S, S, E> {}

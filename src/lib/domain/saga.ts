/* eslint-disable functional/no-this-expression */

/* eslint-disable functional/no-class */

/**
 * `Saga` is a datatype that represents the central point of control deciding what to execute next `A`.
 * It is responsible for mapping different events from aggregates into action results `AR` that the `Saga` then can use to calculate the next actions `A` to be mapped to command of other aggregates.
 *
 * @param AR - Action Result type
 * @param A - Action type
 * @property react - A function/lambda that takes input state of type `AR`, and returns the list of actions `A[]`>.
 * @constructor Creates `Saga`
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class Saga<AR, A> {
  constructor(readonly react: (ar: AR) => readonly A[]) {}

  /**
   * Left map on `AR`/ActionResult parameter - Contravariant
   */
  mapLeftOnActionResult<ARn>(f: (arn: ARn) => AR): Saga<ARn, A> {
    return new Saga((arn: ARn) => this.react(f(arn)));
  }

  /**
   * Right map on `A`/Action parameter - Covariant
   */
  mapOnAction<An>(f: (a: A) => An): Saga<AR, An> {
    return new Saga((ar: AR) => this.react(ar).map(f));
  }

  combine<AR2, A2>(y: Saga<AR2, A2>): Saga<AR | AR2, A | A2> {
    const sagaX = this.mapLeftOnActionResult<AR | AR2>(
      (en) => en as AR
    ).mapOnAction<A | A2>(identity);

    const sagaY = y
      .mapLeftOnActionResult<AR | AR2>((en) => en as AR2)
      .mapOnAction<A | A2>(identity);

    return new Saga<AR | AR2, A | A2>((ar: AR | AR2) =>
      sagaX.react(ar).concat(sagaY.react(ar))
    );
  }
}

const identity = <T>(t: T) => t;

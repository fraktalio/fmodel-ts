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

/* eslint-disable functional/no-classes */

/**
 * `ISaga` represents the central point of control deciding what to execute next `A`.
 * It is responsible for mapping different events from aggregates into action results `AR` that the `Saga` then can use to calculate the next actions `A` to be mapped to command of other aggregates.
 *
 * @typeParam AR - Action Result type
 * @typeParam A - Action type
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ISaga<AR, A> {
  readonly react: (ar: AR) => readonly A[];
}

/**
 * `Saga` is a datatype that represents the central point of control deciding what to execute next `A`.
 * It is responsible for mapping different events from aggregates into action results `AR` that the `Saga` then can use to calculate the next actions `A` to be mapped to command of other aggregates.
 *
 * @typeParam AR - Action Result type
 * @typeParam A - Action type
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class Saga<AR, A> implements ISaga<AR, A> {
  /**
   * @constructor Creates `Saga`
   * @param react - A function/lambda that takes input state of type `AR`, and returns the list of actions `A[]`>.
   */
  constructor(readonly react: (ar: AR) => readonly A[]) {}

  /**
   * Left map on `AR`/ActionResult parameter - Contravariant
   *
   * @typeParam ARn - New Action Result
   */
  mapContraOnActionResult<ARn>(f: (arn: ARn) => AR): Saga<ARn, A> {
    return new Saga((arn: ARn) => this.react(f(arn)));
  }

  /**
   * Right map on `A`/Action parameter - Covariant
   *
   * @typeParam An - New Action
   */
  mapOnAction<An>(f: (a: A) => An): Saga<AR, An> {
    return new Saga((ar: AR) => this.react(ar).map(f));
  }

  /**
   * Combines two choreography sagas into one orchestrating Saga
   *
   * @param y - second Saga
   */
  combine<AR2, A2>(y: Saga<AR2, A2>): Saga<AR | AR2, A | A2> {
    const sagaX = this.mapContraOnActionResult<AR | AR2>(
      (en) => en as AR
    ).mapOnAction<A | A2>(identity);

    const sagaY = y
      .mapContraOnActionResult<AR | AR2>((en) => en as AR2)
      .mapOnAction<A | A2>(identity);

    return new Saga<AR | AR2, A | A2>((ar: AR | AR2) =>
      sagaX.react(ar).concat(sagaY.react(ar))
    );
  }
}

/**
 * Identity function
 *
 * @param t - some type
 */
const identity = <T>(t: T) => t;

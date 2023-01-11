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

/* eslint-disable functional/no-class,functional/no-this-expression */

/* eslint-disable functional/prefer-type-literal */

import { ISaga } from '../domain/saga';

/**
 * Saga manager interface - Stateless process orchestrator.
 *
 * It is reacting on Action Results of type `AR` and produces new actions `A` based on them.
 *
 * @typeParam AR - Action Result of type `AR`
 * @typeParam A - Action of type `A` that are going to be published downstream
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ISagaManager<AR, A> extends ISaga<AR, A>, ActionPublisher<A> {
  readonly handle: (actionResult: AR) => Promise<readonly A[]>;
}

/**
 * Saga manager - Stateless process orchestrator.
 *
 * It is reacting on Action Results of type `AR` and produces new actions `A` based on them.
 *
 * @typeParam AR - Action Result of type `AR`
 * @typeParam A - Action of type `A` that are going to be published downstream
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class SagaManager<AR, A> implements ISagaManager<AR, A> {
  /**
   *
   * @param saga  - A saga component of type `ISaga`<`AR`, `A`>
   * @param actionPublisher - Interface for `A`ction publishing of type `IActionPublisher`<`A`>
   */
  constructor(
    private readonly saga: ISaga<AR, A>,
    private readonly actionPublisher: ActionPublisher<A>
  ) {
    this.react = this.saga.react;
    this.publish = this.actionPublisher.publish;
    this.publishAll = this.actionPublisher.publishAll;
  }

  readonly react: (ar: AR) => readonly A[];
  readonly publish: (a: A) => Promise<A>;
  readonly publishAll: (aList: readonly A[]) => Promise<readonly A[]>;

  /**
   * Handles the action result of type `AR`
   *
   * @param actionResult - Action Result represent the outcome of some action you want to handle in some way
   * @return list of Actions of type `A`
   */
  async handle(actionResult: AR): Promise<readonly A[]> {
    return this.publishAll(this.react(actionResult));
  }
}

/**
 * Action publisher interface
 *
 * Used by [[SagaManager]]
 *
 * @param A - Action
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ActionPublisher<A> {
  /**
   * Publish action
   *
   * @param a - Action of type `A`
   * @return newly published Action of type `A`
   */
  readonly publish: (a: A) => Promise<A>;

  /**
   * Publish actions
   *
   * @param aList - of Actions of type `A`
   * @return list of newly published Actions of type `A`
   */
  readonly publishAll: (aList: readonly A[]) => Promise<readonly A[]>;
}

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

import { ISaga } from '../domain/saga';

/**
 * Action publisher interface
 *
 * Used by [SagaManager]
 *
 * @typeParam A - Action
 * @typeParam ARM - Action Result Metadata
 * @typeParam AM - Action Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IActionPublisher<A, ARM, AM> {
  /**
   * Publish actions
   *
   * @param actions - of Actions with Action Result Metadata of type `A & ARM`
   * @return list of newly published Actions with Action Metadata of type `A & AM`
   */
  readonly publish: (
    actions: readonly (A & ARM)[],
  ) => Promise<readonly (A & AM)[]>;
}

/**
 * Saga manager interface - Stateless process orchestrator.
 *
 * It is reacting on Action Results of type `AR` and produces new actions `A` based on them.
 *
 * @typeParam AR - Action Result of type `AR`
 * @typeParam A - Action of type `A` that are going to be published downstream
 * @typeParam ARM - Action Result metadata
 * @typeParam AM - Action metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ISagaManager<AR, A, ARM, AM>
  extends ISaga<AR, A>,
    IActionPublisher<A, ARM, AM> {
  readonly handle: (actionResult: AR & ARM) => Promise<readonly (A & AM)[]>;
}

/**
 * Saga manager - Stateless process orchestrator.
 *
 * It is reacting on Action Results of type `AR` and produces new actions `A` based on them.
 *
 * @typeParam AR - Action Result of type `AR`
 * @typeParam A - Action of type `A` that are going to be published downstream
 * @typeParam ARM - Action Result metadata
 * @typeParam AM - Action metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class SagaManager<AR, A, ARM, AM>
  implements ISagaManager<AR, A, ARM, AM>
{
  /**
   *
   * @param saga  - A saga component of type `ISaga`<`AR`, `A`>
   * @param actionPublisher - Interface for Action publishing
   */
  constructor(
    protected readonly saga: ISaga<AR, A>,
    protected readonly actionPublisher: IActionPublisher<A, ARM, AM>,
  ) {}

  react(actionResult: AR): readonly A[] {
    return this.saga.react(actionResult);
  }

  async publish(actions: readonly (A & ARM)[]): Promise<readonly (A & AM)[]> {
    return this.actionPublisher.publish(actions);
  }

  /**
   * Handles the action result with metadata of type `AR & ARM`
   *
   * @param actionResult - Action Result represent the outcome of some action you want to handle in some way
   * @return list of Actions with Metadata of type `A & AM`
   */
  async handle(actionResult: AR & ARM): Promise<readonly (A & AM)[]> {
    const actions = this.saga.react(actionResult);
    return this.actionPublisher.publish(
      actions.map((a: A) => ({ ...a, ...(actionResult as ARM) })),
    );
  }
}

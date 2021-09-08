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

/* eslint-disable functional/no-class,functional/no-this-expression */

/* eslint-disable functional/prefer-type-literal */

import { View } from '../domain/view';

/**
 * Materialized view is using/delegating a `View` to handle events of type `E` and to maintain a state of denormalized projection(s) as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class MaterializedView<S, E> {
  /**
   * @constructor Creates `MaterializedView`
   * @param view - A view component of type `View`<`S`, `E`>
   * @param viewStateRepository - Interface for `S`tate management/persistence
   */
  constructor(
    private readonly view: View<S, E>,
    private readonly viewStateRepository: ViewStateRepository<E, S>
  ) {}

  /**
   * Handles the event of type `E`, and returns new persisted state of type `S`
   *
   * @param event Event of type `E` to be handled
   * @return State of type `S`
   */
  handle(event: E): S {
    const currentState = this.viewStateRepository.fetchState(event);
    const newState = this.view.evolve(
      currentState ? currentState : this.view.initialState,
      event
    );
    return this.viewStateRepository.save(newState);
  }
}

/**
 * View State repository interface
 *
 * Used by [[MaterializedView]]
 *
 * @param E - Event
 * @param S - State
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ViewStateRepository<E, S> {
  /**
   * Fetch state
   *
   * @param e - Event of type `E`
   *
   * @return current state of type `S`
   */
  readonly fetchState: (e: E) => S | null;

  /**
   * Save state
   *
   * @param s - State of type `S`
   * @return newly saved State of type `S`
   */
  readonly save: (s: S) => S;
}

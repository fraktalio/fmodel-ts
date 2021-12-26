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

import { IView } from '../domain/view';

/**
 * Materialized view interface is using/delegating a `IView` to handle events of type `E` and to maintain a state of denormalized projection(s) via `ViewStateRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized IView state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IMaterializedView<S, E>
  extends IView<S, E>,
    ViewStateRepository<E, S> {
  /**
   * Handles the event of type `E`, and returns new persisted state of type `S`
   *
   * @param event Event of type `E` to be handled
   * @return State of type `S`
   */
  handle(event: E): Promise<S>;
}

/**
 * Materialized view is using/delegating a `View` to handle events of type `E` and to maintain a state of denormalized projection(s) via `ViewStateRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class MaterializedView<S, E> implements IMaterializedView<S, E> {
  /**
   * @constructor Creates `MaterializedView`
   * @param view - A view component of type `IView`<`S`, `E`>
   * @param viewStateRepository - Interface for `S`tate management/persistence
   */
  constructor(
    private readonly view: IView<S, E>,
    private readonly viewStateRepository: ViewStateRepository<E, S>
  ) {
    this.evolve = this.view.evolve;
    this.initialState = this.view.initialState;
    this.fetchState = this.viewStateRepository.fetchState;
    this.save = this.viewStateRepository.save;
  }

  readonly evolve: (s: S, e: E) => S;
  readonly initialState: S;
  readonly fetchState: (e: E) => Promise<S | null>;
  readonly save: (s: S) => Promise<S>;

  /**
   * Handles the event of type `E`, and returns new persisted state of type `S`
   *
   * @param event Event of type `E` to be handled
   * @return State of type `S`
   */
  async handle(event: E): Promise<S> {
    const currentState = await this.fetchState(event);
    const newState = this.evolve(
      currentState ? currentState : this.initialState,
      event
    );
    return this.save(newState);
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
  readonly fetchState: (e: E) => Promise<S | null>;

  /**
   * Save state
   *
   * @param s - State of type `S`
   * @return newly saved State of type `S`
   */
  readonly save: (s: S) => Promise<S>;
}

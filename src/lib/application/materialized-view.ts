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

import { IView } from '../domain/view';

/**
 * View State repository interface
 *
 * @typeParam E - Event
 * @typeParam S - State
 * @typeParam V - Version of the state
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IViewStateRepository<E, S, V, EM> {
  /**
   * Fetch state
   *
   * @param e - Event of type `E` with metadata of type `EM`
   *
   * @return current state / `S` with version / `V`, or NULL
   */
  readonly fetch: (e: E) => Promise<(S & V) | null>;
  /**
   * Save state
   *
   * @param s - State and Event Metadata of type `S & EM`
   * @param v - State version of type `V | null`
   * @return newly saved State and Version of type `S` & `V`
   */
  readonly save: (s: S & EM, v: V | null) => Promise<S & V>;
}

/**
 * Materialized view interface is using/delegating a `IView` to handle events of type `E` and to maintain a state of projection(s) via `IViewStateRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 * @typeParam V - Version of the state
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IMaterializedView<S, E, V, EM>
  extends IView<S, E>,
    IViewStateRepository<E, S, V, EM> {
  /**
   * Handles the event of type `E`, and returns new persisted state of type `S`
   *
   * @param event Event of type `E & EM` to be handled / event with event metadata
   * @return State of type `S` & `V`
   */
  readonly handle: (event: E & EM) => Promise<S & V>;
}

/**
 * Materialized view is using/delegating a `View` to handle events of type `E` and to maintain a state of projection(s) via `IViewStateRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 * @typeParam V - Version of the state
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class MaterializedView<S, E, V, EM>
  implements IMaterializedView<S, E, V, EM>
{
  constructor(
    protected readonly view: IView<S, E>,
    protected readonly viewStateRepository: IViewStateRepository<E, S, V, EM>
  ) {
    this.initialState = this.view.initialState;
  }

  readonly initialState: S;
  evolve(s: S, e: E): S {
    return this.view.evolve(s, e);
  }

  async fetch(e: E): Promise<(S & V) | null> {
    return this.viewStateRepository.fetch(e);
  }

  async save(s: S & EM, v: V | null): Promise<S & V> {
    return this.viewStateRepository.save(s, v);
  }

  async handle(event: E & EM): Promise<S & V> {
    const currentStateAndVersion = await this.viewStateRepository.fetch(event);
    const newState = this.view.evolve(
      currentStateAndVersion ? currentStateAndVersion : this.view.initialState,
      event
    );
    return this.viewStateRepository.save(
      { ...(newState as S), ...(event as EM) },
      currentStateAndVersion as V
    );
  }
}

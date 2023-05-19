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
 * Materialized view interface is using/delegating a `IView` to handle events of type `E` and to maintain a state of projection(s) via `ViewStateRepository` as a result.
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
  readonly handle: (event: E) => Promise<S>;
}

/**
 * Materialized Locking view interface is using/delegating a `IView` to handle events of type `E` and to maintain a state of projection(s) via `ViewStateLockingRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized IView state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 * @typeParam V - Version of the state
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IMaterializedLockingView<S, E, V>
  extends IView<S, E>,
    ViewStateLockingRepository<E, S, V> {
  /**
   * Handles the event of type `E`, and returns new persisted state of type `S`
   *
   * @param event Event of type `E` to be handled
   * @return State of type [`S`, `V`]
   */
  readonly handle: (event: E) => Promise<readonly [S, V]>;
}

/**
 * Materialized Locking and Deduplication view interface is using/delegating a `IView` to handle events of type `E` and to maintain a state of projection(s) via `ViewStateLockingDeduplicationRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * It can deduplicate events within `at-least-once` delivery guaranty - inspired by optimistic locking
 *
 * @typeParam S - Materialized IView state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 * @typeParam EV - Version of the event
 * @typeParam SV - Version of the state
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IMaterializedLockingDeduplicationView<S, E, EV, SV>
  extends IView<S, E>,
    ViewStateLockingDeduplicationRepository<E, S, EV, SV> {
  /**
   * Handles the event of type `E`, and returns new persisted state of type `S`
   *
   * @param eventAndVersion Event and Version of type [`E`, `EV`] to be handled
   * @return State of type [`S`, `V`]
   */
  readonly handle: (
    eventAndVersion: readonly [E, EV]
  ) => Promise<readonly [S, SV]>;
}

/**
 * Materialized view is using/delegating a `View` to handle events of type `E` and to maintain a state of projection(s) via `ViewStateRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class MaterializedView<S, E> implements IMaterializedView<S, E> {
  constructor(
    protected readonly view: IView<S, E>,
    protected readonly viewStateRepository: ViewStateRepository<E, S>
  ) {
    this.initialState = this.view.initialState;
  }

  readonly initialState: S;

  evolve(s: S, e: E): S {
    return this.view.evolve(s, e);
  }

  async fetchState(e: E): Promise<S | null> {
    return this.viewStateRepository.fetchState(e);
  }

  async save(s: S): Promise<S> {
    return this.viewStateRepository.save(s);
  }

  async handle(event: E): Promise<S> {
    const currentState = await this.viewStateRepository.fetchState(event);
    const newState = this.view.evolve(
      currentState ? currentState : this.view.initialState,
      event
    );
    return this.viewStateRepository.save(newState);
  }
}

/**
 * Materialized Locking view is using/delegating a `View` to handle events of type `E` and to maintain a state of projection(s) via `ViewStateLockingRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 * @typeParam V - Version of the state
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class MaterializedLockingView<S, E, V>
  implements IMaterializedLockingView<S, E, V>
{
  constructor(
    protected readonly view: IView<S, E>,
    protected readonly viewStateRepository: ViewStateLockingRepository<E, S, V>
  ) {
    this.initialState = this.view.initialState;
  }

  readonly initialState: S;
  evolve(s: S, e: E): S {
    return this.view.evolve(s, e);
  }

  async fetchState(e: E): Promise<readonly [S | null, V | null]> {
    return this.viewStateRepository.fetchState(e);
  }

  async save(s: S, currentStateVersion: V | null): Promise<readonly [S, V]> {
    return this.viewStateRepository.save(s, currentStateVersion);
  }

  async handle(event: E): Promise<readonly [S, V]> {
    const [currentState, currentVersion] =
      await this.viewStateRepository.fetchState(event);
    const newState = this.view.evolve(
      currentState ? currentState : this.view.initialState,
      event
    );
    return this.viewStateRepository.save(newState, currentVersion);
  }
}

/**
 * Materialized Locking And Deduplication view is using/delegating a `View` to handle events of type `E` and to maintain a state of projection(s) via `ViewStateLockingDeduplicationRepository` as a result.
 * Essentially, it represents the query/view side of the CQRS pattern.
 *
 * @typeParam S - Materialized View state of type `S`
 * @typeParam E - Events of type `E` that are handled by this Materialized View
 * @typeParam SV - Version of the state
 * @typeParam EV - Version of the event
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class MaterializedLockingDeduplicationView<S, E, EV, SV>
  implements IMaterializedLockingDeduplicationView<S, E, EV, SV>
{
  constructor(
    protected readonly view: IView<S, E>,
    protected readonly viewStateRepository: ViewStateLockingDeduplicationRepository<
      E,
      S,
      EV,
      SV
    >
  ) {
    this.initialState = this.view.initialState;
  }

  readonly initialState: S;

  evolve(s: S, e: E): S {
    return this.view.evolve(s, e);
  }

  async fetchState(e: E): Promise<readonly [S | null, SV | null]> {
    return this.viewStateRepository.fetchState(e);
  }

  async save(
    s: S,
    eventVersion: EV,
    currentStateVersion: SV | null
  ): Promise<readonly [S, SV]> {
    return this.viewStateRepository.save(s, eventVersion, currentStateVersion);
  }

  async handle(eventAndVersion: readonly [E, EV]): Promise<readonly [S, SV]> {
    const [event, eventVersion] = eventAndVersion;
    const [currentState, currentStateVersion] =
      await this.viewStateRepository.fetchState(event);
    const newState = this.view.evolve(
      currentState ? currentState : this.view.initialState,
      event
    );
    return this.viewStateRepository.save(
      newState,
      eventVersion,
      currentStateVersion
    );
  }
}

/**
 * View State repository interface
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

/**
 * View State Locking repository interface
 *
 * @param E - Event
 * @param S - State
 * @param V - Version of the state
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ViewStateLockingRepository<E, S, V> {
  /**
   * Fetch state
   *
   * @param e - Event of type `E`
   *
   * @return current state of type [`S` , `V`]
   */
  readonly fetchState: (e: E) => Promise<readonly [S | null, V | null]>;
  /**
   * Save state
   *
   * @param s - State of type `S`
   * @param currentStateVersion - State version of type `V | null`
   * @return newly saved State of type [`S`, `V`]
   */
  readonly save: (
    s: S,
    currentStateVersion: V | null
  ) => Promise<readonly [S, V]>;
}

/**
 * View State Locking and Deduplication repository interface
 *
 * @param E - Event
 * @param S - State
 * @param EV - Version of the event
 * @param SV - Version of the state
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface ViewStateLockingDeduplicationRepository<E, S, EV, SV> {
  /**
   * Fetch state
   *
   * @param e - Event of type `E`
   *
   * @return current state of type [`S` , `SV`]
   */
  readonly fetchState: (e: E) => Promise<readonly [S | null, SV | null]>;
  /**
   * Save state
   *
   * @param s - State of type `S`
   * @param eventVersion - Event version of type `EV`
   * @param currentStateVersion - State version of type `SV | null`
   * @return newly saved State of type [`S`, `V`]
   */
  readonly save: (
    s: S,
    eventVersion: EV,
    currentStateVersion: SV | null
  ) => Promise<readonly [S, SV]>;
}

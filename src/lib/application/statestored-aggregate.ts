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

import { Decider } from '../domain/decider';
import { Saga } from '../domain/saga';

/**
 * State stored aggregate is using/delegating a `StateStoredAggregate.decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then delegate the command to the `StateStoredAggregate.decider` which can produce new state as a result.
 * If the `StateStoredAggregate.decider` is combined out of many deciders via `combine` function, an optional `StateStoredAggregate.saga` could be used to react on new events and send new commands to the `StateStoredAggregate.decider` recursively, in one transaction.
 *
 * New state is then stored via `StateRepository.save` suspending function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class StateStoredAggregate<C, S, E> {
  /**
   * @constructor Creates `StateStoredAggregate`
   * @param decider - A decider component of type `Decider`<`C`, `S`, `E`>.
   * @param stateRepository  - Interface for `S`tate management/persistence
   * @param saga - An optional saga component of type `Saga`<`E`, `C`>
   */
  constructor(
    private readonly decider: Decider<C, S, E>,
    private readonly stateRepository: StateRepository<C, S>,
    private readonly saga?: Saga<E, C>
  ) {}
  private calculateNewState(state: S, command: C): S {
    const events = this.decider.decide(command, state);
    // eslint-disable-next-line functional/no-let
    let newState = events.reduce(this.decider.evolve, state);

    if (typeof this.saga !== 'undefined') {
      const saga = this.saga;
      events
        .flatMap((it) => saga.react(it))
        .forEach((c) => (newState = this.calculateNewState(newState, c)));
    }
    return newState;
  }

  /**
   * Handles the command of type `C`, and returns new persisted state.
   *
   * @param command - Command of type `C` to be handled
   * @return state of type `S`
   */
  handle(command: C): S {
    const currentState = this.stateRepository.fetchState(command);
    return this.stateRepository.save(
      this.calculateNewState(
        currentState ? currentState : this.decider.initialState,
        command
      )
    );
  }
}

/**
 * State repository interface
 *
 * Used by [[StateStoredAggregate]]
 *
 * @param C - Command
 * @param S - State
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface StateRepository<C, S> {
  /**
   * Fetch state
   *
   * @param c - Command of type `C`
   *
   * @return current state of type `S`
   */
  readonly fetchState: (c: C) => S | null;

  /**
   * Save state
   *
   * @param s - State of type `S`
   * @return newly saved State of type `S`
   */
  readonly save: (s: S) => S;
}

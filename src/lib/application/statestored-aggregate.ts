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

export class StateStoredAggregate<C, S, E> {
  constructor(
    private readonly decider: Decider<C, S, E>,
    private readonly stateRepository: StateRepository<C, S>,
    private readonly saga?: Saga<E, C>
  ) {}

  private calculateNewState(state: S, command: C): S {
    const events = this.decider.decide(command, state);
    const newState = events.reduce(this.decider.evolve, state);

    if (typeof this.saga !== 'undefined') {
      const saga = this.saga;
      events
        .flatMap((it) => saga.react(it))
        .forEach((c) => this.calculateNewState(newState, c));
    }
    return newState;
  }

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
 * Used by `StateStoredAggregate`
 *
 * @param C Command
 * @param S State
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface StateRepository<C, S> {
  /**
   * Fetch state
   *
   * @param c Command of type `C`
   *
   * @return current state of type `S`
   */
  readonly fetchState: (c: C) => S | null;

  /**
   * Save state
   *
   * @param s State of type `S`
   * @return newly saved State of type `S`
   */
  readonly save: (s: S) => S;
}

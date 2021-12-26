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

import { IDecider } from '../domain/decider';
import { ISaga } from '../domain/saga';

/**
 * State stored aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 *
 * New state is then stored via `StateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IStateStoredAggregate<C, S, E>
  extends IDecider<C, S, E>,
    StateRepository<C, S> {
  readonly handle: (command: C) => Promise<S>;
}

/**
 * State stored aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 * If the `decider` is combined out of many deciders via `combine` function, an optional `saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * New state is then stored via `StateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IStateStoredOrchestratingAggregate<C, S, E>
  extends IStateStoredAggregate<C, S, E>,
    ISaga<E, C> {}

/**
 * State stored aggregate is using/delegating a `decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 *
 * New state is then stored via `StateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class StateStoredAggregate<C, S, E>
  implements IStateStoredAggregate<C, S, E>
{
  /**
   * @constructor Creates `StateStoredAggregate`
   * @param decider - A decider component of type `IDecider`<`C`, `S`, `E`>.
   * @param stateRepository  - Interface for `S`tate management/persistence
   */
  constructor(
    private readonly decider: IDecider<C, S, E>,
    private readonly stateRepository: StateRepository<C, S>
  ) {
    this.decide = this.decider.decide;
    this.evolve = this.decider.evolve;
    this.initialState = this.decider.initialState;
    this.fetchState = this.stateRepository.fetchState;
    this.save = this.stateRepository.save;
  }

  readonly decide: (c: C, s: S) => readonly E[];
  readonly evolve: (s: S, e: E) => S;
  readonly initialState: S;
  readonly fetchState: (c: C) => Promise<S | null>;
  readonly save: (s: S) => Promise<S>;

  /**
   * An algorithm to compute new state based on the old state and the command being handled.
   *
   * @param state
   * @param command
   */
  protected computeNewState(state: S, command: C): S {
    const events = this.decide(command, state);
    return events.reduce(this.evolve, state);
  }

  /**
   * Handles the command of type `C`, and returns new persisted state.
   *
   * @param command - Command of type `C` to be handled
   * @return state of type `S`
   */
  async handle(command: C): Promise<S> {
    const currentState = await this.fetchState(command);
    return this.save(
      this.computeNewState(
        currentState ? currentState : this.initialState,
        command
      )
    );
  }
}

/**
 * State stored aggregate is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 * If the `decider` is combined out of many deciders via `combine` function, an optional `saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * New state is then stored via `StateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class StateStoredOrchestratingAggregate<C, S, E>
  extends StateStoredAggregate<C, S, E>
  implements IStateStoredOrchestratingAggregate<C, S, E>
{
  /**
   * @constructor Creates `StateStoredAggregate`
   * @param decider - A decider component of type `IDecider`<`C`, `S`, `E`>.
   * @param stateRepository  - Interface for `S`tate management/persistence
   * @param saga - An optional saga component of type `ISaga`<`E`, `C`>
   */
  constructor(
    decider: IDecider<C, S, E>,
    stateRepository: StateRepository<C, S>,
    private readonly saga: ISaga<E, C>
  ) {
    super(decider, stateRepository);
    this.react = saga.react;
  }

  /**
   * Saga - react function
   */
  readonly react: (ar: E) => readonly C[];

  /**
   * An algorithm to compute new state based on the old state and the command being handled.
   *
   * @param state
   * @param command
   */
  protected computeNewState(state: S, command: C): S {
    const events = this.decide(command, state);
    // eslint-disable-next-line functional/no-let
    let newState = events.reduce(this.evolve, state);

    if (typeof this.saga !== 'undefined') {
      const saga = this.saga;
      events
        .flatMap((it) => saga.react(it))
        .forEach((c) => (newState = this.computeNewState(newState, c)));
    }
    return newState;
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
  readonly fetchState: (c: C) => Promise<S | null>;

  /**
   * Save state
   *
   * @param s - State of type `S`
   * @return newly saved State of type `S`
   */
  readonly save: (s: S) => Promise<S>;
}

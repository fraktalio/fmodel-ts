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

import { IDecider } from '../domain/decider';
import { ISaga } from '../domain/saga';

/**
 * State repository interface / fetching and storing the state from/to storage
 *
 * @typeParam C - Command
 * @typeParam S - State
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam SM - State Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IStateRepository<C, S, V, CM, SM> {
  /**
   * Fetch state, version and metadata
   *
   * @param command - Command payload of type C with metadata of type `CM`
   * @return current State/[S], Version/[V] and State Metadata/[SM]
   */
  readonly fetch: (command: C & CM) => Promise<(S & V & SM) | null>;

  /**
   * Save state (with optimistic locking)
   *
   * You can update/save the item/state, but only if the `version` number in the storage has not changed.
   *
   * @param state - State with Command Metadata of type `S & CM`
   * @param commandMetadata - Command Metadata of the command that initiated the `state`
   * @param version - The current version of the state
   * @return newly saved State of type `S & V & SM`
   */
  readonly save: (
    state: S,
    commandMetadata: CM,
    version: V | null
  ) => Promise<S & V & SM>;
}

/**
 * State stored aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `IStateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 *
 * New state is then stored via `IStateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - The Version of the stored State
 * @typeParam CM - Command Metadata
 * @typeParam SM - State Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IStateStoredAggregate<C, S, E, V, CM, SM>
  extends IDecider<C, S, E>,
    IStateRepository<C, S, V, CM, SM> {
  readonly handle: (command: C & CM) => Promise<S & V & SM>;
}

/**
 * State stored and orchestrating aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `IStateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 * If the `decider` is combined out of many deciders via `combine` function, an optional `saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * New state is then stored via `IStateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - The Version of the stored State
 * @typeParam CM - Command Metadata
 * @typeParam SM - State Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IStateStoredOrchestratingAggregate<C, S, E, V, CM, SM>
  extends IStateStoredAggregate<C, S, E, V, CM, SM>,
    ISaga<E, C> {}

/**
 * `StateComputation` abstracts the `State Computation` algorithm by using a `decider` of type `IDecider`<`C`, `S,` `E`> to handle commands based on the current state, and produce new state.
 *
 * @typeParam C - Commands of type `C`
 * @typeParam S - State of type `S`
 * @typeParam E - Events of type `E`
 */
export abstract class StateComputation<C, S, E> implements IDecider<C, S, E> {
  protected constructor(protected readonly decider: IDecider<C, S, E>) {
    this.initialState = decider.initialState;
  }
  decide(command: C, state: S): readonly E[] {
    return this.decider.decide(command, state);
  }
  evolve(state: S, event: E): S {
    return this.decider.evolve(state, event);
  }

  readonly initialState: S;
  protected computeNewState(state: S, command: C): S {
    const events = this.decider.decide(command, state);
    return events.reduce(this.decider.evolve, state);
  }
}

/**
 * `StateOrchestratingComputation` abstracts the `Orchestrating State Computation` algorithm by using a `decider` of type `IDecider`<`C`, `S,` `E`> and `saga` of type `ISaga`<`E`, `C`> to handle commands based on the current state, and produce new state.
 * If the `decider` is combined out of many deciders via `combine` function, a `saga` could be used to react on new events and send new commands to the `decider` recursively, in single transaction.
 *
 * @typeParam C - Commands of type `C`
 * @typeParam S - State of type `S`
 * @typeParam E - Events of type `E`
 */
export abstract class StateOrchestratingComputation<C, S, E>
  extends StateComputation<C, S, E>
  implements IDecider<C, S, E>, ISaga<E, C>
{
  protected constructor(
    decider: IDecider<C, S, E>,
    protected readonly saga: ISaga<E, C>
  ) {
    super(decider);
  }
  react(event: E): readonly C[] {
    return this.saga.react(event);
  }
  protected override computeNewState(state: S, command: C): S {
    const events = this.decider.decide(command, state);
    // eslint-disable-next-line functional/no-let
    let newState = events.reduce(this.decider.evolve, state);
    events
      .flatMap((evt) => this.saga.react(evt))
      .forEach((cmd) => (newState = this.computeNewState(newState, cmd)));
    return newState;
  }
}

/**
 * State stored aggregate is using/delegating a `decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `IStateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 *
 * New state is then stored via `IStateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - The Version of the stored State
 * @typeParam CM - Command Metadata
 * @typeParam SM - State Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class StateStoredAggregate<C, S, E, V, CM, SM>
  extends StateComputation<C, S, E>
  implements IStateStoredAggregate<C, S, E, V, CM, SM>
{
  constructor(
    decider: IDecider<C, S, E>,
    protected readonly stateRepository: IStateRepository<C, S, V, CM, SM>
  ) {
    super(decider);
  }
  async fetch(command: C & CM): Promise<(S & V & SM) | null> {
    return this.stateRepository.fetch(command);
  }

  async save(
    state: S,
    commandMetadata: CM,
    version: V | null
  ): Promise<S & V & SM> {
    return this.stateRepository.save(state, commandMetadata, version);
  }

  async handle(command: C & CM): Promise<S & V & SM> {
    const currentState = await this.stateRepository.fetch(command);
    const newState = this.computeNewState(
      currentState ? currentState : this.decider.initialState,
      command
    );
    return this.stateRepository.save(
      newState,
      command as CM,
      currentState as V
    );
  }
}

/**
 * State stored orchestrating aggregate is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce new state.
 * In order to handle the command, aggregate needs to fetch the current state via `IStateRepository.fetchState` function first, and then delegate the command to the `decider` which can produce new state as a result.
 * If the `decider` is combined out of many deciders via `combine` function, an optional `saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * New state is then stored via `IStateRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - The Version of the stored State
 * @typeParam CM - Command Metadata
 * @typeParam SM - State Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class StateStoredOrchestratingAggregate<C, S, E, V, CM, SM>
  extends StateOrchestratingComputation<C, S, E>
  implements IStateStoredOrchestratingAggregate<C, S, E, V, CM, SM>
{
  constructor(
    decider: IDecider<C, S, E>,
    protected readonly stateRepository: IStateRepository<C, S, V, CM, SM>,
    saga: ISaga<E, C>
  ) {
    super(decider, saga);
  }

  async fetch(command: C & CM): Promise<(S & V & SM) | null> {
    return this.stateRepository.fetch(command);
  }

  async save(
    state: S,
    commandMetadata: CM,
    version: V | null
  ): Promise<S & V & SM> {
    return this.stateRepository.save(state, commandMetadata, version);
  }

  async handle(command: C & CM): Promise<S & V & SM> {
    const currentState = await this.stateRepository.fetch(command);
    const newState = this.computeNewState(
      currentState ? currentState : this.decider.initialState,
      command
    );
    return this.stateRepository.save(
      newState,
      command as CM,
      currentState as V
    );
  }
}

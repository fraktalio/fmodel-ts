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

/* eslint-disable functional/no-classes,@typescript-eslint/no-explicit-any,functional/no-loop-statements */

import { Identifier } from '../..';
import { IDecider } from '../domain/decider';
import { ISaga } from '../domain/saga';

/**
 * Event repository interface
 *
 * @typeParam C - Command
 * @typeParam E - Event
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventRepository<C, E, V, CM, EM> {
  /**
   * Fetch events
   *
   * @param command - Command of type `C`
   *
   * @return list of Events with Version and Event Metadata
   */
  readonly fetch: (command: C) => Promise<readonly (E & V & EM)[]>;

  /**
   * Save events
   *
   * @param events - list of Events
   * @param commandMetadata - Command Metadata of the command that initiated `events`
   * @param historyEvents - History Events that are already stored - used for versioning
   * @return  a list of newly saved Event(s) of type `E` with Version of type `V` and with Event Metadata of type `EM`
   */
  readonly save: (
    newEvents: readonly E[],
    commandMetadata: CM,
    historyEvents: readonly (E & V & EM)[],
  ) => Promise<readonly (E & V & EM)[]>;
}

/**
 * Event sourcing aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `IEventRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * Produced events are then stored via `IEventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingAggregate<C, S, E, V, CM, EM>
  extends IDecider<C, S, E>,
    IEventRepository<C, E, V, CM, EM> {
  /**
   * Handles the command of type `C`, and returns new persisted list of pairs of event and its version.
   *
   * @param command - Command of type `C` with Command Metadata
   * @return list of persisted events with Version and Event Metadata
   */
  readonly handle: (command: C & CM) => Promise<readonly (E & V & EM)[]>;
}

/**
 * Event sourcing orchestrating aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `IEventRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * If the `decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingAggregate.saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * Produced events are then stored via `IEventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingOrchestratingAggregate<
  C extends Identifier,
  S,
  E extends Identifier,
  V,
  CM,
  EM,
> extends IEventSourcingAggregate<C, S, E, V, CM, EM>,
    ISaga<E, C> {}

/**
 * An abstract algorithm to compute new events based on the old events and the command being handled.
 */
export abstract class EventComputation<C, S, E> implements IDecider<C, S, E> {
  protected constructor(protected readonly decider: IDecider<C, S, E>) {
    this.initialState = decider.initialState;
  }

  readonly initialState: S;

  decide(command: C, state: S): readonly E[] {
    return this.decider.decide(command, state);
  }

  evolve(state: S, event: E): S {
    return this.decider.evolve(state, event);
  }

  protected computeNewEvents(events: readonly E[], command: C): readonly E[] {
    const currentState = events.reduce(
      this.decider.evolve,
      this.decider.initialState,
    );
    return this.decider.decide(command, currentState);
  }
}

/**
 * An abstract algorithm to compute new events based on the old events and the command being handled.
 * It returns all the events, including the events created by handling commands which are triggered by Saga - orchestration included.
 */
export abstract class EventOrchestratingComputation<
    C extends Identifier,
    S,
    E extends Identifier,
  >
  implements IDecider<C, S, E>, ISaga<E, C>
{
  protected constructor(
    protected readonly decider: IDecider<C, S, E>,
    protected readonly saga: ISaga<E, C>,
  ) {
    this.initialState = decider.initialState;
  }

  readonly initialState: S;

  decide(command: C, state: S): readonly E[] {
    return this.decider.decide(command, state);
  }

  evolve(state: S, event: E): S {
    return this.decider.evolve(state, event);
  }

  react(event: E): readonly C[] {
    return this.saga.react(event);
  }

  private computeNewEventsInternally(
    events: readonly E[],
    command: C,
  ): readonly E[] {
    const currentState = events.reduce(
      this.decider.evolve,
      this.decider.initialState,
    );
    return this.decider.decide(command, currentState);
  }

  protected async computeNewEvents<V, EM>(
    events: readonly (E & V & EM)[],
    command: C,
    fetch: (c: C) => Promise<readonly (E & V & EM)[]>,
  ): Promise<{
    newEvents: readonly E[];
    allFetchedEvents: readonly (E & V & EM)[];
  }> {
    // eslint-disable-next-line functional/no-let
    let resultingEvents = this.computeNewEventsInternally(
      events as readonly E[],
      command,
    );
    // eslint-disable-next-line functional/no-let
    let allFetchedEvents = [...events];

    await asyncForEach(
      resultingEvents.flatMap((evt) => this.saga.react(evt)),
      async (cmd: C) => {
        const fetchedEvents = await fetch(cmd);

        // Add newly fetched events to our complete history (avoiding duplicates by ID if possible)
        const newFetchedEvents = fetchedEvents.filter(
          (fetchedEvt) =>
            !allFetchedEvents.some(
              (existingEvt) =>
                existingEvt.id === fetchedEvt.id &&
                JSON.stringify(existingEvt) === JSON.stringify(fetchedEvt),
            ),
        );
        allFetchedEvents = allFetchedEvents.concat(newFetchedEvents);

        const filteredResultingEvents = resultingEvents.filter(
          (evt) => evt.id === cmd.id,
        );
        const combinedEvents = fetchedEvents.concat(
          filteredResultingEvents as unknown as readonly (E & V & EM)[],
        );

        const orchestrationResult = await this.computeNewEvents(
          combinedEvents,
          cmd,
          fetch,
        );

        resultingEvents = resultingEvents.concat(orchestrationResult.newEvents);

        // Add any new fetched events from recursive calls
        const newRecursiveFetchedEvents =
          orchestrationResult.allFetchedEvents.filter(
            (fetchedEvt) =>
              !allFetchedEvents.some(
                (existingEvt) =>
                  existingEvt.id === fetchedEvt.id &&
                  JSON.stringify(existingEvt) === JSON.stringify(fetchedEvt),
              ),
          ) as unknown as readonly (E & V & EM)[];
        allFetchedEvents = allFetchedEvents.concat(newRecursiveFetchedEvents);
      },
    );

    return {
      newEvents: resultingEvents,
      allFetchedEvents,
    };
  }
}

/**
 * Event sourcing aggregate is using/delegating a `EventSourcingAggregate.decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `IEventRepository.fetchEvents` function, and then delegate the command to the `EventSourcingAggregate.decider` which can produce new event(s) as a result.
 *
 *
 * Produced events are then stored via `IEventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam E - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingAggregate<C, S, E, V, CM, EM>
  extends EventComputation<C, S, E>
  implements IEventSourcingAggregate<C, S, E, V, CM, EM>
{
  constructor(
    decider: IDecider<C, S, E>,
    protected readonly eventRepository: IEventRepository<C, E, V, CM, EM>,
  ) {
    super(decider);
  }

  async fetch(command: C): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.fetch(command);
  }

  async save(
    newEvents: readonly E[],
    commandMetadata: CM,
    historyEvents: readonly (E & V & EM)[],
  ): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.save(newEvents, commandMetadata, historyEvents);
  }

  async handle(command: C & CM): Promise<readonly (E & V & EM)[]> {
    const currentEvents = await this.eventRepository.fetch(command);

    return this.eventRepository.save(
      this.computeNewEvents(currentEvents, command),
      command,
      currentEvents,
    );
  }
}

/**
 * Event sourcing orchestrating aggregate is using/delegating a `EventSourcingOrchestratingAggregate.decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `IEventRepository.fetchEvents` function, and then delegate the command to the `EventSourcingOrchestratingAggregate.decider` which can produce new event(s) as a result.
 *
 * If the `EventSourcingOrchestratingAggregate.decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingAggregate.saga` could be used to react on new events and send new commands to the `EventSourcingOrchestratingAggregate.decider` recursively, in one transaction.
 *
 * Produced events are then stored via `IEventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingOrchestratingAggregate<
    C extends Identifier,
    S,
    E extends Identifier,
    V,
    CM,
    EM,
  >
  extends EventOrchestratingComputation<C, S, E>
  implements IEventSourcingOrchestratingAggregate<C, S, E, V, CM, EM>
{
  constructor(
    decider: IDecider<C, S, E>,
    protected readonly eventRepository: IEventRepository<C, E, V, CM, EM>,
    saga: ISaga<E, C>,
  ) {
    super(decider, saga);
  }

  async fetch(command: C): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.fetch(command);
  }

  async save(
    newEvents: readonly E[],
    commandMetadata: CM,
    historyEvents: readonly (E & V & EM)[],
  ): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.save(newEvents, commandMetadata, historyEvents);
  }

  async handle(command: Readonly<C & CM>): Promise<readonly (E & V & EM)[]> {
    const currentEvents = await this.eventRepository.fetch(command);
    const orchestrationResult = await this.computeNewEvents<V, EM>(
      currentEvents,
      command,
      async (cmd: C) => await this.eventRepository.fetch(cmd),
    );

    return this.eventRepository.save(
      orchestrationResult.newEvents,
      command,
      orchestrationResult.allFetchedEvents,
    );
  }
}

async function asyncForEach(
  array: readonly any[],
  callback: (arg0: any, arg1: number, arg2: any) => any,
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

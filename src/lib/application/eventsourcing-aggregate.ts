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

/* eslint-disable functional/no-class,functional/no-this-expression */

/* eslint-disable functional/prefer-type-literal */

import { IDecider } from '../domain/decider';
import { ISaga } from '../domain/saga';

/**
 * Event sourcing aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * Produced events are then stored via `EventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingAggregate<C, S, E>
  extends IDecider<C, S, E>,
    EventRepository<C, E> {
  /**
   * Handles the command of type `C`, and returns new persisted events.
   *
   * @param command - Command of type `C`
   * @return list of persisted events ot type `E`
   */
  readonly handle: (command: C) => Promise<readonly E[]>;
}

/**
 * Event sourcing locking aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventLockingRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * Produced events are then stored via `EventLockingRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingLockingAggregate<C, S, E, V>
  extends IDecider<C, S, E>,
    EventLockingRepository<C, E, V> {
  /**
   * Handles the command of type `C`, and returns new persisted list of pairs of event and its version.
   *
   * @param command - Command of type `C`
   * @return list of persisted events ot type [`E, `V`]
   */
  readonly handle: (command: C) => Promise<readonly (readonly [E, V])[]>;
}

/**
 * Event sourcing orchestrating aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * If the `decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingAggregate.saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * Produced events are then stored via `EventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingOrchestratingAggregate<C, S, E>
  extends IEventSourcingAggregate<C, S, E>,
    ISaga<E, C> {}

/**
 * Event sourcing orchestrating locking aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventLockingRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * If the `decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingLockingAggregate.saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * Produced events are then stored via `EventLockingRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingOrchestratingLockingAggregate<C, S, E, V>
  extends IEventSourcingLockingAggregate<C, S, E, V>,
    ISaga<E, C> {}

/**
 * An abstract algorithm to compute new events based on the old events and the command being handled.
 */
export abstract class EventComputation<C, S, E> implements IDecider<C, S, E> {
  protected constructor(decider: IDecider<C, S, E>) {
    this.decide = decider.decide;
    this.evolve = decider.evolve;
    this.initialState = decider.initialState;
  }
  readonly decide: (c: C, s: S) => readonly E[];
  readonly evolve: (s: S, e: E) => S;
  readonly initialState: S;

  protected computeNewEvents(events: readonly E[], command: C): readonly E[] {
    const currentState = events.reduce(this.evolve, this.initialState);
    return this.decide(command, currentState);
  }
}

/**
 * An abstract algorithm to compute new events based on the old events and the command being handled.
 * It returns all the events, including the events created by handling commands which are triggered by Saga - orchestration included.
 */
export abstract class EventOrchestratingComputation<C, S, E>
  extends EventComputation<C, S, E>
  implements IDecider<C, S, E>, ISaga<E, C>
{
  protected constructor(decider: IDecider<C, S, E>, saga: ISaga<E, C>) {
    super(decider);
    this.react = saga.react;
  }
  readonly react: (ar: E) => readonly C[];

  protected async computeNewEventsByOrchestrating(
    events: readonly E[],
    command: C,
    fetchEvents: (c: C) => Promise<readonly E[]>
  ): Promise<readonly E[]> {
    // eslint-disable-next-line functional/no-let
    let resultingEvents = super.computeNewEvents(events, command);
    await asyncForEach(
      resultingEvents.flatMap((it) => this.react(it)),
      async (c) => {
        const newEvents = this.computeNewEventsByOrchestrating(
          (await fetchEvents(c)).concat(resultingEvents),
          c,
          fetchEvents
        );
        resultingEvents = resultingEvents.concat(await newEvents);
      }
    );
    return resultingEvents;
  }
}

/**
 * Event sourcing aggregate is using/delegating a `EventSourcingAggregate.decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventRepository.fetchEvents` function, and then delegate the command to the `EventSourcingAggregate.decider` which can produce new event(s) as a result.
 *
 *
 * Produced events are then stored via `EventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingAggregate<C, S, E>
  extends EventComputation<C, S, E>
  implements IEventSourcingAggregate<C, S, E>
{
  constructor(
    decider: IDecider<C, S, E>,
    eventRepository: EventRepository<C, E>
  ) {
    super(decider);
    this.fetchEvents = eventRepository.fetchEvents;
    this.save = eventRepository.save;
    this.saveAll = eventRepository.saveAll;
  }

  readonly fetchEvents: (c: C) => Promise<readonly E[]>;
  readonly save: (e: E) => Promise<E>;
  readonly saveAll: (eList: readonly E[]) => Promise<readonly E[]>;

  async handle(command: C): Promise<readonly E[]> {
    const currentEvents = await this.fetchEvents(command);
    return this.saveAll(this.computeNewEvents(currentEvents, command));
  }
}

/**
 * Event sourcing locking aggregate is using/delegating a `EventSourcingLockingAggregate.decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventLockingRepository.fetchEvents` function, and then delegate the command to the `EventSourcingLockingAggregate.decider` which can produce new event(s) as a result.
 *
 *
 * Produced events are then stored via `EventLockingRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam E - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingLockingAggregate<C, S, E, V>
  extends EventComputation<C, S, E>
  implements IEventSourcingLockingAggregate<C, S, E, V>
{
  constructor(
    decider: IDecider<C, S, E>,
    eventRepository: EventLockingRepository<C, E, V>
  ) {
    super(decider);
    this.fetchEvents = eventRepository.fetchEvents;
    this.save = eventRepository.save;
    this.saveAll = eventRepository.saveAll;
    this.latestVersionProvider = eventRepository.latestVersionProvider;
    this.saveByLatestVersionProvided =
      eventRepository.saveByLatestVersionProvided;
    this.saveAllByLatestVersionProvided =
      eventRepository.saveAllByLatestVersionProvided;
  }

  readonly fetchEvents: (c: C) => Promise<readonly (readonly [E, V])[]>;
  readonly save: (
    e: E,
    latestVersion: readonly [E, V] | null
  ) => Promise<readonly [E, V]>;
  readonly saveAll: (
    eList: readonly E[],
    latestVersion: readonly [E, V] | null
  ) => Promise<readonly (readonly [E, V])[]>;
  readonly saveByLatestVersionProvided: (
    e: E,
    latestVersionProvider: LatestVersionProvider<E, V>
  ) => Promise<readonly [E, V]>;
  readonly saveAllByLatestVersionProvided: (
    eList: readonly E[],
    latestVersionProvider: LatestVersionProvider<E, V>
  ) => Promise<readonly (readonly [E, V])[]>;
  readonly latestVersionProvider: LatestVersionProvider<E, V>;

  async handle(command: C): Promise<readonly (readonly [E, V])[]> {
    const currentEvents = await this.fetchEvents(command);

    return this.saveAll(
      this.computeNewEvents(
        currentEvents.map((a) => a[0]),
        command
      ),
      currentEvents[currentEvents.length - 1]
    );
  }
}

/**
 * Event sourcing orchestrating aggregate is using/delegating a `EventSourcingOrchestratingAggregate.decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventRepository.fetchEvents` function, and then delegate the command to the `EventSourcingOrchestratingAggregate.decider` which can produce new event(s) as a result.
 *
 * If the `EventSourcingOrchestratingAggregate.decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingAggregate.saga` could be used to react on new events and send new commands to the `EventSourcingOrchestratingAggregate.decider` recursively, in one transaction.
 *
 * Produced events are then stored via `EventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingOrchestratingAggregate<C, S, E>
  extends EventOrchestratingComputation<C, S, E>
  implements IEventSourcingOrchestratingAggregate<C, S, E>
{
  constructor(
    decider: IDecider<C, S, E>,
    eventRepository: EventRepository<C, E>,
    saga: ISaga<E, C>
  ) {
    super(decider, saga);
    this.fetchEvents = eventRepository.fetchEvents;
    this.save = eventRepository.save;
    this.saveAll = eventRepository.saveAll;
  }

  readonly fetchEvents: (c: C) => Promise<readonly E[]>;
  readonly save: (e: E) => Promise<E>;
  readonly saveAll: (eList: readonly E[]) => Promise<readonly E[]>;

  async handle(command: C): Promise<readonly E[]> {
    const currentEvents = await this.fetchEvents(command);
    return this.saveAll(
      await this.computeNewEventsByOrchestrating(
        currentEvents,
        command,
        this.fetchEvents
      )
    );
  }
}

/**
 * Event sourcing orchestrating locking aggregate is using/delegating a `EventSourcingOrchestratingLockingAggregate.decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `EventLockingRepository.fetchEvents` function, and then delegate the command to the `EventSourcingOrchestratingLockingAggregate.decider` which can produce new event(s) as a result.
 *
 * If the `EventSourcingOrchestratingLockingAggregate.decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingLockingAggregate.saga` could be used to react on new events and send new commands to the `EventSourcingOrchestratingLockingAggregate.decider` recursively, in one transaction.
 *
 * Produced events are then stored via `EventLockingRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingOrchestratingLockingAggregate<C, S, E, V>
  extends EventOrchestratingComputation<C, S, E>
  implements IEventSourcingOrchestratingLockingAggregate<C, S, E, V>
{
  constructor(
    decider: IDecider<C, S, E>,
    eventRepository: EventLockingRepository<C, E, V>,
    saga: ISaga<E, C>
  ) {
    super(decider, saga);
    this.fetchEvents = eventRepository.fetchEvents;
    this.save = eventRepository.save;
    this.saveAll = eventRepository.saveAll;
    this.latestVersionProvider = eventRepository.latestVersionProvider;
    this.saveByLatestVersionProvided =
      eventRepository.saveByLatestVersionProvided;
    this.saveAllByLatestVersionProvided =
      eventRepository.saveAllByLatestVersionProvided;
  }

  readonly fetchEvents: (c: C) => Promise<readonly (readonly [E, V])[]>;
  readonly save: (
    e: E,
    latestVersion: readonly [E, V] | null
  ) => Promise<readonly [E, V]>;
  readonly saveAll: (
    eList: readonly E[],
    latestVersion: readonly [E, V] | null
  ) => Promise<readonly (readonly [E, V])[]>;
  readonly saveByLatestVersionProvided: (
    e: E,
    latestVersionProvider: LatestVersionProvider<E, V>
  ) => Promise<readonly [E, V]>;
  readonly saveAllByLatestVersionProvided: (
    eList: readonly E[],
    latestVersionProvider: LatestVersionProvider<E, V>
  ) => Promise<readonly (readonly [E, V])[]>;
  readonly latestVersionProvider: LatestVersionProvider<E, V>;

  async handle(command: C): Promise<readonly (readonly [E, V])[]> {
    const currentEvents = await this.fetchEvents(command);
    return this.saveAllByLatestVersionProvided(
      await this.computeNewEventsByOrchestrating(
        currentEvents.map((a) => a[0]),
        command,
        async (c: C) => (await this.fetchEvents(c)).map((it) => it[0])
      ),
      this.latestVersionProvider
    );
  }
}

/**
 * Event repository interface
 *
 * @param C - Command
 * @param E - Event
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface EventRepository<C, E> {
  /**
   * Fetch events
   *
   * @param c - Command of type `C`
   *
   * @return list of Events of type `E`
   */
  readonly fetchEvents: (c: C) => Promise<readonly E[]>;

  /**
   * Save event
   *
   * @param e - Event of type `E`
   * @return newly saved Event of type `E`
   */
  readonly save: (e: E) => Promise<E>;

  /**
   * Save events
   *
   * @param eList - list of Events of type `E`
   * @return newly saved list of Events of type `E`
   */
  readonly saveAll: (eList: readonly E[]) => Promise<readonly E[]>;
}

export type LatestVersionProvider<E, V> = (e: E) => readonly [E, V];

/**
 * Event Locking repository interface
 *
 * @param C - Command
 * @param E - Event
 * @param V - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface EventLockingRepository<C, E, V> {
  /**
   * Fetch events
   *
   * @param c - Command of type `C`
   *
   * @return list of pairs of Event and Version
   */
  readonly fetchEvents: (c: C) => Promise<readonly (readonly [E, V])[]>;
  /**
   * Save event
   *
   * @param e - Event of type `E`
   * @param latestVersion - Latest Event in this stream and its Version
   * @return  a pair of newly saved Event of type `E` and its Version of type `V`
   */
  readonly save: (
    e: E,
    latestVersion: readonly [E, V] | null
  ) => Promise<readonly [E, V]>;

  /**
   * Save events
   *
   * @param eList - list of Events of type `E`
   * @param latestVersion - Latest Event in this stream and its Version
   * @return  a list of pairs of newly saved Event of type `E` and its Version of type `V`
   */
  readonly saveAll: (
    eList: readonly E[],
    latestVersion: readonly [E, V] | null
  ) => Promise<readonly (readonly [E, V])[]>;

  /**
   * The latest event stream version provider
   */
  readonly latestVersionProvider: LatestVersionProvider<E, V>;

  /**
   * Save event
   *
   * @param e - Event of type `E`
   * @param latestVersionProvider - A provider for the Latest Event in this stream and its Version
   * @return  a pair of newly saved Event of type `E` and its Version of type `V`
   */
  readonly saveByLatestVersionProvided: (
    e: E,
    latestVersionProvider: LatestVersionProvider<E, V>
  ) => Promise<readonly [E, V]>;

  /**
   * Save events
   *
   * @param eList - list of Events of type `E`
   * @param latestVersionProvider - A provider for the Latest Event in this stream and its Version
   * @return  a list of pairs of newly saved Event of type `E` and its Version of type `V`
   */
  readonly saveAllByLatestVersionProvided: (
    eList: readonly E[],
    latestVersionProvider: LatestVersionProvider<E, V>
  ) => Promise<readonly (readonly [E, V])[]>;
}

async function asyncForEach(
  array: readonly any[],
  callback: (arg0: any, arg1: number, arg2: any) => any
) {
  // eslint-disable-next-line functional/no-loop-statement,functional/no-let
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

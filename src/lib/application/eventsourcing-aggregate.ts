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

import { IDecider } from '../domain/decider';
import { ISaga } from '../domain/saga';

/**
 * Event repository interface
 *
 * @param C - Command
 * @param E - Event
 * @param V - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventRepository<C, E, V, CM, EM> {
  /**
   * Fetch events
   *
   * @param c - Command of type `C`
   *
   * @return list of pairs of Event and Version
   */
  readonly fetch: (c: C) => Promise<readonly (E & V & EM)[]>;

  /**
   * The latest event stream version provider
   */
  readonly versionProvider: (e: E) => Promise<V | null>;

  /**
   * Save events
   *
   * @param eList - list of Events of type `E`
   * @param latestVersionProvider - A provider for the Latest Event in this stream and its Version
   * @return  a list of pairs of newly saved Event of type `E` and its Version of type `V`
   */
  readonly save: (
    eList: readonly (E & CM)[],
    versionProvider: (e: E) => Promise<V | null>
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
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingAggregate<C, S, E, V, CM, EM>
  extends IDecider<C, S, E>,
    IEventRepository<C, E, V, CM, EM> {
  /**
   * Handles the command of type `C`, and returns new persisted list of pairs of event and its version.
   *
   * @param command - Command of type `C`
   * @return list of persisted events ot type (`E` & `V` & `EM`)
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
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export interface IEventSourcingOrchestratingAggregate<C, S, E, V, CM, EM>
  extends IEventSourcingAggregate<C, S, E, V, CM, EM>,
    ISaga<E, C> {}

/**
 * An abstract algorithm to compute new events based on the old events and the command being handled.
 */
export abstract class EventComputation<C, S, E> implements IDecider<C, S, E> {
  protected constructor(protected readonly decider: IDecider<C, S, E>) {
    this.initialState = decider.initialState;
  }

  readonly initialState: S;

  decide(c: C, s: S): readonly E[] {
    return this.decider.decide(c, s);
  }

  evolve(s: S, e: E): S {
    return this.decider.evolve(s, e);
  }

  protected computeNewEvents(events: readonly E[], command: C): readonly E[] {
    const currentState = events.reduce(
      this.decider.evolve,
      this.decider.initialState
    );
    return this.decider.decide(command, currentState);
  }
}

/**
 * An abstract algorithm to compute new events based on the old events and the command being handled.
 * It returns all the events, including the events created by handling commands which are triggered by Saga - orchestration included.
 */
export abstract class EventOrchestratingComputation<C, S, E>
  implements IDecider<C, S, E>, ISaga<E, C>
{
  protected constructor(
    protected readonly decider: IDecider<C, S, E>,
    protected readonly saga: ISaga<E, C>
  ) {
    this.initialState = decider.initialState;
  }

  readonly initialState: S;

  decide(c: C, s: S): readonly E[] {
    return this.decider.decide(c, s);
  }

  evolve(s: S, e: E): S {
    return this.decider.evolve(s, e);
  }

  react(ar: E): readonly C[] {
    return this.saga.react(ar);
  }

  private computeNewEventsInternal(
    events: readonly E[],
    command: C
  ): readonly E[] {
    const currentState = events.reduce(
      this.decider.evolve,
      this.decider.initialState
    );
    return this.decider.decide(command, currentState);
  }

  protected async computeNewEvents(
    events: readonly E[],
    command: C,
    fetch: (c: C) => Promise<readonly E[]>
  ): Promise<readonly E[]> {
    // eslint-disable-next-line functional/no-let
    let resultingEvents = this.computeNewEventsInternal(events, command);
    await asyncForEach(
      resultingEvents.flatMap((it) => this.saga.react(it)),
      async (c) => {
        const newEvents = this.computeNewEvents(
          (await fetch(c)).map((e) => e as E).concat(resultingEvents),
          c,
          fetch
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
 * @typeParam E - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingAggregate<C, S, E, V, CM, EM>
  extends EventComputation<C, S, E>
  implements IEventSourcingAggregate<C, S, E, V, CM, EM>
{
  constructor(
    decider: IDecider<C, S, E>,
    protected readonly eventRepository: IEventRepository<C, E, V, CM, EM>
  ) {
    super(decider);
  }

  async fetch(c: C): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.fetch(c);
  }

  async versionProvider(e: E): Promise<V | null> {
    return this.eventRepository.versionProvider(e);
  }

  async save(
    eList: readonly (E & CM)[],
    versionProvider: (e: E) => Promise<V | null>
  ): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.save(eList, versionProvider);
  }

  async handle(command: C & CM): Promise<readonly (E & V & EM)[]> {
    const currentEvents = await this.eventRepository.fetch(command);

    return this.eventRepository.save(
      this.computeNewEvents(currentEvents, command).map((evt) => ({
        ...evt,
        ...command,
      })),
      async () => currentEvents[currentEvents.length - 1]
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
 * @typeParam V - Version
 *
 * @author Иван Дугалић / Ivan Dugalic / @idugalic
 */
export class EventSourcingOrchestratingAggregate<C, S, E, V, CM, EM>
  extends EventOrchestratingComputation<C, S, E>
  implements IEventSourcingOrchestratingAggregate<C, S, E, V, CM, EM>
{
  constructor(
    decider: IDecider<C, S, E>,
    protected readonly eventRepository: IEventRepository<C, E, V, CM, EM>,
    saga: ISaga<E, C>
  ) {
    super(decider, saga);
  }

  async fetch(c: C): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.fetch(c);
  }

  async versionProvider(e: E): Promise<V | null> {
    return this.eventRepository.versionProvider(e);
  }

  async save(
    eList: readonly (E & CM)[],
    versionProvider: (e: E) => Promise<V | null>
  ): Promise<readonly (E & V & EM)[]> {
    return this.eventRepository.save(eList, versionProvider);
  }

  async handle(command: C & CM): Promise<readonly (E & V & EM)[]> {
    const currentEvents = await this.eventRepository.fetch(command);
    return this.eventRepository.save(
      (
        await this.computeNewEvents(
          currentEvents,
          command,
          async (c: C) => await this.eventRepository.fetch(c)
        )
      ).map((event) => ({
        ...event,
        ...command,
      })),
      this.versionProvider.bind(this)
    );
  }
}

async function asyncForEach(
  array: readonly any[],
  callback: (arg0: any, arg1: number, arg2: any) => any
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

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
 * Event sourcing aggregate is using/delegating a `decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce events.
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
  handle(command: C): Promise<readonly E[]>;
}

/**
 * Event sourcing orchestrating aggregate is using/delegating a `decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce events.
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
 * Event sourcing aggregate is using/delegating a `EventSourcingAggregate.decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce events.
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
  implements IEventSourcingAggregate<C, S, E>
{
  /**
   * @constructor Creates `EventSourcingAggregate`
   *
   * @param decider - A decider component of type `Decider`<`C`, `S`, `E`>.
   * @param eventRepository - Interface for `E`vent management/persistence
   */
  constructor(
    private readonly decider: IDecider<C, S, E>,
    private readonly eventRepository: EventRepository<C, E>
  ) {
    this.decide = this.decider.decide;
    this.evolve = this.decider.evolve;
    this.initialState = this.decider.initialState;
    this.fetchEvents = this.eventRepository.fetchEvents;
    this.save = this.eventRepository.save;
    this.saveAll = this.eventRepository.saveAll;
  }
  readonly decide: (c: C, s: S) => readonly E[];
  readonly evolve: (s: S, e: E) => S;
  readonly initialState: S;
  readonly fetchEvents: (c: C) => Promise<readonly E[]>;
  readonly save: (e: E) => Promise<E>;
  readonly saveAll: (eList: readonly E[]) => Promise<readonly E[]>;

  /**
   * An algorithm to compute new events based on the old events and the command being handled.
   *
   * @param events
   * @param command
   */
  protected computeNewEvents(events: readonly E[], command: C): readonly E[] {
    const currentState = events.reduce(this.evolve, this.initialState);
    return this.decide(command, currentState);
  }

  /**
   * Handles the command of type `C`, and returns new persisted events.
   *
   * @param command - Command of type `C`
   * @return list of persisted events ot type `E`
   */
  async handle(command: C): Promise<readonly E[]> {
    const currentEvents = await this.fetchEvents(command);
    return this.saveAll(this.computeNewEvents(currentEvents, command));
  }
}

/**
 * Event sourcing orchestrating aggregate is using/delegating a `EventSourcingOrchestratingAggregate.decider` of type `Decider`<`C`, `S`, `E`> to handle commands and produce events.
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
  extends EventSourcingAggregate<C, S, E>
  implements IEventSourcingOrchestratingAggregate<C, S, E>
{
  /**
   * @constructor Creates `EventSourcingOrchestratingAggregate`
   *
   * @param decider - A decider component of type `Decider`<`C`, `S`, `E`>.
   * @param eventRepository - Interface for `E`vent management/persistence
   * @param saga - A saga component of type `Saga`<`E`, `C`>
   */
  constructor(
    decider: IDecider<C, S, E>,
    eventRepository: EventRepository<C, E>,
    private readonly saga: ISaga<E, C>
  ) {
    super(decider, eventRepository);
    this.react = this.saga.react;
  }

  readonly react: (ar: E) => readonly C[];

  /**
   * An algorithm to compute new events based on the old events and the command being handled.
   *
   * @param events
   * @param command
   */
  protected computeNewEvents(events: readonly E[], command: C): readonly E[] {
    // eslint-disable-next-line functional/no-let
    let resultingEvents = super.computeNewEvents(events, command);

    resultingEvents
      .flatMap((it) => this.react(it))
      .forEach(
        (c) =>
          (resultingEvents = resultingEvents.concat(
            this.computeNewEvents(events.concat(resultingEvents), c)
          ))
      );

    return resultingEvents;
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

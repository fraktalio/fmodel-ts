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

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable functional/no-class */

import test from 'ava';

import { Decider } from '../domain/decider';
import { Saga } from '../domain/saga';

import {
  EventLockingRepository,
  EventRepository,
  EventSourcingAggregate,
  EventSourcingLockingAggregate,
  EventSourcingOrchestratingAggregate,
  IEventSourcingAggregate,
  IEventSourcingLockingAggregate,
  IEventSourcingOrchestratingAggregate,
  LatestVersionProvider,
} from './eventsourcing-aggregate';

// ################################
// ###### Domain - Commands #######
// ################################

class AddOddNumberCmd {
  constructor(readonly value: number) {}
}

class MultiplyOddNumberCmd {
  constructor(readonly value: number) {}
}

class AddEvenNumberCmd {
  constructor(readonly value: number) {}
}

class MultiplyEvenNumberCmd {
  constructor(readonly value: number) {}
}

type OddNumberCmd = AddOddNumberCmd | MultiplyOddNumberCmd;

type EvenNumberCmd = AddEvenNumberCmd | MultiplyEvenNumberCmd;

// ################################
// ###### Domain - Events #########
// ################################

class OddNumberAddedEvt {
  constructor(readonly value: number) {}
}

class OddNumberMultipliedEvt {
  constructor(readonly value: number) {}
}

type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;

class EvenNumberAddedEvt {
  constructor(readonly value: number) {}
}

class EvenNumberMultipliedEvt {
  constructor(readonly value: number) {}
}

type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

// ################################
// ###### Domain - Deciders #######
// ################################

const decider: Decider<OddNumberCmd, number, OddNumberEvt> = new Decider<
  OddNumberCmd,
  number,
  OddNumberEvt
>(
  (c, _) => {
    if (c instanceof AddOddNumberCmd) {
      return [new OddNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyOddNumberCmd) {
      return [new OddNumberMultipliedEvt(c.value)];
    } else {
      // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      // When narrowing, you can reduce the options of a union to a point where you have removed all possibilities and have nothing left. In those cases, TypeScript will use a never type to represent a state which shouldn’t exist.
      // The `never` type is assignable to every type; however, no type is assignable to `never` (except `never` itself).
      const _: never = c;
      console.log('Never just happened: ' + _);
      return [];
    }
  },
  (s, e) => {
    if (e instanceof OddNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof OddNumberMultipliedEvt) {
      return s * e.value;
    } else {
      const _: never = e;
      console.log('Never just happened: ' + _);
      return s;
    }
  },
  0
);

const decider2: Decider<EvenNumberCmd, number, EvenNumberEvt> = new Decider<
  EvenNumberCmd,
  number,
  EvenNumberEvt
>(
  (c, _) => {
    if (c instanceof AddEvenNumberCmd) {
      return [new EvenNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyEvenNumberCmd) {
      return [new EvenNumberMultipliedEvt(c.value)];
    } else {
      const _: never = c;
      console.log('Never just happened: ' + _);
      return [];
    }
  },
  (s, e) => {
    if (e instanceof EvenNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof EvenNumberMultipliedEvt) {
      return s * e.value;
    } else {
      const _: never = e;
      console.log('Never just happened in evolve function: ' + _);
      return s;
    }
  },
  0
);

// ################################
// ####### Domain - Sagas #########
// ################################

const saga: Saga<OddNumberEvt, EvenNumberCmd> = new Saga<
  OddNumberEvt,
  EvenNumberCmd
>((ar) => {
  if (ar instanceof OddNumberAddedEvt) {
    return [new AddEvenNumberCmd(ar.value + 1)];
  } else if (ar instanceof OddNumberMultipliedEvt) {
    return [new MultiplyEvenNumberCmd(ar.value + 1)];
  } else {
    // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
    // When narrowing, you can reduce the options of a union to a point where you have removed all possibilities and have nothing left. In those cases, TypeScript will use a never type to represent a state which shouldn’t exist.
    // The `never` type is assignable to every type; however, no type is assignable to `never` (except `never` itself).
    const _: never = ar;
    console.log('Never just happened: ' + _);
    return [];
  }
});

// ################################
// ###### Application - Repo ######
// ################################

const storage: readonly OddNumberEvt[] = [];
const storage2: readonly EvenNumberEvt[] = [];
const lockingStorage2: readonly (readonly [EvenNumberEvt, number])[] = [];
const storage3: readonly (OddNumberEvt | EvenNumberEvt)[] = [];

class EventRepositoryImpl
  implements EventRepository<OddNumberCmd, OddNumberEvt>
{
  async fetchEvents(_c: OddNumberCmd): Promise<readonly OddNumberEvt[]> {
    return storage;
  }

  async save(e: OddNumberEvt): Promise<OddNumberEvt> {
    storage.concat(e);
    return e;
  }

  async saveAll(
    eList: readonly OddNumberEvt[]
  ): Promise<readonly OddNumberEvt[]> {
    storage.concat(eList);
    return eList;
  }
}

class EventRepositoryImpl2
  implements EventRepository<EvenNumberCmd, EvenNumberEvt>
{
  async fetchEvents(_c: EvenNumberCmd): Promise<readonly EvenNumberEvt[]> {
    return storage2;
  }

  async save(e: EvenNumberEvt): Promise<EvenNumberEvt> {
    storage2.concat(e);
    return e;
  }

  async saveAll(
    eList: readonly EvenNumberEvt[]
  ): Promise<readonly EvenNumberEvt[]> {
    storage2.concat(eList);
    return eList;
  }
}

class EventRepositoryLockingImpl2
  implements EventLockingRepository<EvenNumberCmd, EvenNumberEvt, number>
{
  async fetchEvents(
    _c: EvenNumberCmd
  ): Promise<readonly (readonly [EvenNumberEvt, number])[]> {
    return lockingStorage2;
  }

  async save(
    e: EvenNumberEvt,
    latestVersion: readonly [EvenNumberEvt, number] | null
  ): Promise<readonly [EvenNumberEvt, number]> {
    // eslint-disable-next-line functional/no-let
    let version;
    if (latestVersion) {
      version = latestVersion[1];
    } else version = 0;

    lockingStorage2.concat([e, version + 1]);
    return [e, version + 1];
  }

  async saveAll(
    eList: readonly EvenNumberEvt[],
    latestVersion: readonly [EvenNumberEvt, number] | null
  ): Promise<readonly (readonly [EvenNumberEvt, number])[]> {
    // eslint-disable-next-line functional/no-let
    let version: number;
    if (latestVersion) {
      version = latestVersion[1];
    } else version = 0;

    const savedEvents: readonly (readonly [EvenNumberEvt, number])[] =
      eList.map((e, index) => [e, version + index + 1]);
    lockingStorage2.concat(savedEvents);
    return savedEvents;
  }

  readonly latestVersionProvider: LatestVersionProvider<EvenNumberEvt, number> =
    (_: EvenNumberEvt) => lockingStorage2[lockingStorage2.length - 1];

  async saveByLatestVersionProvided(
    e: EvenNumberEvt,
    latestVersionProvider: LatestVersionProvider<EvenNumberEvt, number>
  ): Promise<readonly [EvenNumberEvt, number]> {
    const latestVersion = latestVersionProvider(e);
    // eslint-disable-next-line functional/no-let
    let version;
    if (latestVersion) {
      version = latestVersion[1];
    } else version = 0;

    lockingStorage2.concat([e, version + 1]);
    return [e, version + 1];
  }

  async saveAllByLatestVersionProvided(
    eList: readonly EvenNumberEvt[],
    latestVersionProvider: LatestVersionProvider<EvenNumberEvt, number>
  ): Promise<readonly (readonly [EvenNumberEvt, number])[]> {
    const savedEvents: readonly (readonly [EvenNumberEvt, number])[] =
      eList.map((e, index) => [e, latestVersionProvider(e)[1] + index + 1]);
    lockingStorage2.concat(savedEvents);
    return savedEvents;
  }
}

class EventRepositoryImpl3
  implements
    EventRepository<EvenNumberCmd | OddNumberCmd, OddNumberEvt | EvenNumberEvt>
{
  async fetchEvents(
    _c: EvenNumberCmd | OddNumberCmd
  ): Promise<readonly (OddNumberEvt | EvenNumberEvt)[]> {
    return storage3;
  }

  async save(
    e: OddNumberEvt | EvenNumberEvt
  ): Promise<OddNumberEvt | EvenNumberEvt> {
    storage3.concat(e);
    return e;
  }

  async saveAll(
    eList: readonly (OddNumberEvt | EvenNumberEvt)[]
  ): Promise<readonly (OddNumberEvt | EvenNumberEvt)[]> {
    storage3.concat(eList);
    return eList;
  }
}

const repository: EventRepository<OddNumberCmd, OddNumberEvt> =
  new EventRepositoryImpl();

const repository2: EventRepository<EvenNumberCmd, EvenNumberEvt> =
  new EventRepositoryImpl2();

const repositoryLocking2: EventLockingRepository<
  EvenNumberCmd,
  EvenNumberEvt,
  number
> = new EventRepositoryLockingImpl2();

const repository3: EventRepository<
  EvenNumberCmd | OddNumberCmd,
  OddNumberEvt | EvenNumberEvt
> = new EventRepositoryImpl3();

// ################################
// ### Application - Aggregates ###
// ################################

const aggregate: IEventSourcingAggregate<OddNumberCmd, number, OddNumberEvt> =
  new EventSourcingAggregate<OddNumberCmd, number, OddNumberEvt>(
    decider,
    repository
  );

const aggregate2: IEventSourcingAggregate<
  EvenNumberCmd,
  number,
  EvenNumberEvt
> = new EventSourcingAggregate<EvenNumberCmd, number, EvenNumberEvt>(
  decider2,
  repository2
);

const aggregateLocking2: IEventSourcingLockingAggregate<
  EvenNumberCmd,
  number,
  EvenNumberEvt,
  number
> = new EventSourcingLockingAggregate<
  EvenNumberCmd,
  number,
  EvenNumberEvt,
  number
>(decider2, repositoryLocking2);

const aggregate3: IEventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
> = new EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
>(decider.combine(decider2), repository3);

const aggregate4: IEventSourcingOrchestratingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
> = new EventSourcingOrchestratingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
>(decider.combine(decider2), repository3, saga);

// ################################
// ############ Tests #############
// ################################

test('aggregate-handle', async (t) => {
  t.deepEqual(await aggregate.handle(new AddOddNumberCmd(1)), [
    new OddNumberAddedEvt(1),
  ]);
});

test('aggregate-handle2', async (t) => {
  t.deepEqual(await aggregate2.handle(new AddEvenNumberCmd(2)), [
    new EvenNumberAddedEvt(2),
  ]);
});

test('aggregate-locking-handle2', async (t) => {
  t.deepEqual(await aggregateLocking2.handle(new AddEvenNumberCmd(2)), [
    [new EvenNumberAddedEvt(2), 1],
  ]);
});

test('aggregate-handle3', async (t) => {
  t.deepEqual(await aggregate3.handle(new AddOddNumberCmd(1)), [
    new OddNumberAddedEvt(1),
  ]);
});

test('aggregate-handle4', async (t) => {
  t.deepEqual(await aggregate3.handle(new AddEvenNumberCmd(2)), [
    new EvenNumberAddedEvt(2),
  ]);
});

test('aggregate-handle5', async (t) => {
  t.deepEqual(await aggregate4.handle(new AddEvenNumberCmd(6)), [
    new EvenNumberAddedEvt(6),
  ]);
});

test('aggregate-handle6', async (t) => {
  t.deepEqual(await aggregate4.handle(new AddOddNumberCmd(7)), [
    new OddNumberAddedEvt(7),
    new EvenNumberAddedEvt(8),
  ]);
});

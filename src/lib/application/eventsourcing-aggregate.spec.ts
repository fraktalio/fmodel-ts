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

/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */

/* eslint-disable functional/no-class */

import test from 'ava';

import { Decider } from '../domain/decider';
import { Saga } from '../domain/saga';

import {
  EventRepository,
  EventSourcingAggregate,
} from './eventsourcing-aggregate';

// ########### Commands ###########
class AddOddNumberCmd {
  constructor(readonly value: number) {}
}

class MultiplyOddNumberCmd {
  constructor(readonly value: number) {}
}

class AddEvenNumberCmd {
  constructor(readonly valueEven: number) {}
}

class MultiplyEvenNumberCmd {
  constructor(readonly valueEven: number) {}
}

type OddNumberCmd = AddOddNumberCmd | MultiplyOddNumberCmd;

type EvenNumberCmd = AddEvenNumberCmd | MultiplyEvenNumberCmd;

function isNumber(x: any): x is number {
  return typeof x === 'number';
}

const decider: Decider<OddNumberCmd, number, number> = new Decider<
  OddNumberCmd,
  number,
  number
>(
  (c, _) => {
    if (c instanceof AddOddNumberCmd) {
      return [c.value];
    } else if (c instanceof MultiplyOddNumberCmd) {
      return [c.value];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (isNumber(e)) {
      return s + e;
    } else {
      return s;
    }
  },
  0
);

const decider2: Decider<EvenNumberCmd, number, number> = new Decider<
  EvenNumberCmd,
  number,
  number
>(
  (c, _) => {
    if (c instanceof AddEvenNumberCmd) {
      return [c.valueEven];
    } else if (c instanceof MultiplyEvenNumberCmd) {
      return [c.valueEven];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (isNumber(e)) {
      return s + e;
    } else {
      return s;
    }
  },
  0
);

const storage: readonly number[] = [];
const storage2: readonly number[] = [];
const storage3: readonly number[] = [];

class EventRepositoryImpl implements EventRepository<OddNumberCmd, number> {
  fetchEvents(_c: OddNumberCmd): readonly number[] {
    return storage;
  }

  save(e: number): number {
    storage.concat(e);
    return e;
  }
  saveAll(eList: readonly number[]): readonly number[] {
    storage.concat(eList);
    return eList;
  }
}

class EventRepositoryImpl2 implements EventRepository<EvenNumberCmd, number> {
  fetchEvents(_c: EvenNumberCmd): readonly number[] {
    return storage2;
  }

  save(e: number): number {
    storage2.concat(e);
    return e;
  }
  saveAll(eList: readonly number[]): readonly number[] {
    storage2.concat(eList);
    return eList;
  }
}

class EventRepositoryImpl3
  implements EventRepository<EvenNumberCmd | OddNumberCmd, number>
{
  fetchEvents(_c: EvenNumberCmd | OddNumberCmd): readonly number[] {
    return storage3;
  }
  save(e: number): number {
    storage3.concat(e);
    return e;
  }
  saveAll(eList: readonly number[]): readonly number[] {
    storage3.concat(eList);
    return eList;
  }
}

const repository: EventRepository<OddNumberCmd, number> =
  new EventRepositoryImpl();

const repository2: EventRepository<EvenNumberCmd, number> =
  new EventRepositoryImpl2();

const repository3: EventRepository<EvenNumberCmd | OddNumberCmd, number> =
  new EventRepositoryImpl3();

const aggregate: EventSourcingAggregate<OddNumberCmd, number, number> =
  new EventSourcingAggregate<OddNumberCmd, number, number>(
    decider,
    repository,
    undefined
  );

const aggregate2: EventSourcingAggregate<EvenNumberCmd, number, number> =
  new EventSourcingAggregate<EvenNumberCmd, number, number>(
    decider2,
    repository2,
    undefined
  );

const aggregate3: EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
> = new EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
>(decider.combine(decider2), repository3, undefined);

const saga: Saga<number, EvenNumberCmd | OddNumberCmd> = new Saga<
  number,
  EvenNumberCmd | OddNumberCmd
>((ar) => {
  if (isNumber(ar)) {
    if (ar == 6) {
      return [new AddOddNumberCmd(5)];
    } else if (ar == 7) {
      return [new AddEvenNumberCmd(6)];
    } else {
      return [];
    }
  } else {
    return [];
  }
});

const aggregate4: EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
> = new EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
>(decider.combine(decider2), repository3, saga);

test('aggregate-handle', (t) => {
  t.deepEqual(aggregate.handle(new AddOddNumberCmd(1)), [1]);
});

test('aggregate-handle2', (t) => {
  t.deepEqual(aggregate2.handle(new AddEvenNumberCmd(2)), [2]);
});

test('aggregate-handle3', (t) => {
  t.deepEqual(aggregate3.handle(new AddOddNumberCmd(1)), [1]);
});

test('aggregate-handle4', (t) => {
  t.deepEqual(aggregate3.handle(new AddEvenNumberCmd(2)), [2]);
});

test('aggregate-handle5', (t) => {
  t.deepEqual(aggregate4.handle(new AddEvenNumberCmd(6)), [6, 5]);
});

test('aggregate-handle6', (t) => {
  t.deepEqual(aggregate4.handle(new AddOddNumberCmd(7)), [7, 6, 5]);
});

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

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable functional/no-class */

import test from 'ava';

import { Decider } from '../domain/decider';

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

function isString(x: any): x is string {
  return typeof x === 'string';
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
    if (isString(e)) {
      return s + e;
    } else {
      return s;
    }
  },
  0
);

const storage: readonly number[] = [];
const storage2: readonly number[] = [];

class EventRepositoryImpl implements EventRepository<OddNumberCmd, number> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const repository: EventRepository<OddNumberCmd, number> =
  new EventRepositoryImpl();

const repository2: EventRepository<EvenNumberCmd, number> =
  new EventRepositoryImpl2();

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

test('aggregate-handle', (t) => {
  t.deepEqual(aggregate.handle(new AddOddNumberCmd(1)), [1]);
});

test('aggregate-handle2', (t) => {
  t.deepEqual(aggregate2.handle(new AddEvenNumberCmd(2)), [2]);
});

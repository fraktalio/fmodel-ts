/*
 * Copyright 2022 Fraktalio D.O.O. All rights reserved.
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
  IStateStoredAggregate,
  IStateStoredLockingAggregate,
  IStateStoredOrchestratingAggregate,
  StateLockingRepository,
  StateRepository,
  StateStoredAggregate,
  StateStoredLockingAggregate,
  StateStoredOrchestratingAggregate,
} from './statestored-aggregate';

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

// ################################
// ###### Domain - Deciders #######
// ################################

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
      // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      // When narrowing, you can reduce the options of a union to a point where you have removed all possibilities and have nothing left. In those cases, TypeScript will use a never type to represent a state which shouldn’t exist.
      // The `never` type is assignable to every type; however, no type is assignable to `never` (except `never` itself).
      const _: never = c;
      console.log('Never just happened: ' + _);
      return [];
    }
  },
  (s, e) => {
    if (isNumber(e)) {
      return s + e;
    } else {
      const _: never = e;
      console.log('Never just happened: ' + _);
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
      const _: never = c;
      console.log('Never just happened: ' + _);
      return [];
    }
  },
  (s, e) => {
    if (isNumber(e)) {
      return s + e;
    } else {
      const _: never = e;
      console.log('Never just happened: ' + _);
      return s;
    }
  },
  0
);

// ################################
// ####### Domain - Sagas #########
// ################################

const saga: Saga<number, EvenNumberCmd | OddNumberCmd> = new Saga<
  number,
  EvenNumberCmd | OddNumberCmd
>((ar) => {
  if (isNumber(ar)) {
    if (ar === 6) {
      return [new AddOddNumberCmd(5)];
    } else if (ar === 7) {
      return [new AddEvenNumberCmd(6)];
    } else {
      return [];
    }
  } else {
    return [];
  }
});

// ################################
// ###### Application - Repo ######
// ################################

// eslint-disable-next-line functional/no-let
let storage: number | null = null;
// eslint-disable-next-line functional/no-let
let storage2: number | null = null;
// eslint-disable-next-line functional/no-let
let lockingStorage2: readonly [number | null, number | null] = [null, null];
// eslint-disable-next-line functional/no-let
let storage3: readonly [number, number] | null = null;

class StateRepositoryImpl implements StateRepository<OddNumberCmd, number> {
  async fetchState(_c: OddNumberCmd): Promise<number | null> {
    return storage;
  }
  async save(s: number): Promise<number> {
    storage = s;
    return s;
  }
}

class StateRepositoryImpl2 implements StateRepository<EvenNumberCmd, number> {
  async fetchState(_c: EvenNumberCmd): Promise<number | null> {
    return storage2;
  }

  async save(s: number): Promise<number> {
    storage2 = s;
    return s;
  }
}

class StateLockingRepositoryImpl2
  implements StateLockingRepository<EvenNumberCmd, number, number>
{
  async fetchState(
    _c: EvenNumberCmd
  ): Promise<readonly [number | null, number | null]> {
    return lockingStorage2;
  }

  async save(s: number, v: number | null): Promise<readonly [number, number]> {
    lockingStorage2 = [s, v];
    if (v == null) return [s, 1];
    else return [s, v + 1];
  }
}

class StateRepositoryImpl3
  implements
    StateRepository<EvenNumberCmd | OddNumberCmd, readonly [number, number]>
{
  async fetchState(
    _c: EvenNumberCmd | OddNumberCmd
  ): Promise<readonly [number, number] | null> {
    return storage3;
  }

  async save(s: readonly [number, number]): Promise<readonly [number, number]> {
    storage3 = s;
    return s;
  }
}

const repository: StateRepository<OddNumberCmd, number> =
  new StateRepositoryImpl();

const repository2: StateRepository<EvenNumberCmd, number> =
  new StateRepositoryImpl2();

const lockingRepository2: StateLockingRepository<
  EvenNumberCmd,
  number,
  number
> = new StateLockingRepositoryImpl2();

const repository3: StateRepository<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number]
> = new StateRepositoryImpl3();

// ################################
// #### Application - Aggregate ###
// ################################

const aggregate: IStateStoredAggregate<OddNumberCmd, number, number> =
  new StateStoredAggregate<OddNumberCmd, number, number>(decider, repository);

const aggregate2: IStateStoredAggregate<EvenNumberCmd, number, number> =
  new StateStoredAggregate<EvenNumberCmd, number, number>(
    decider2,
    repository2
  );

const lockingAggregate2: IStateStoredLockingAggregate<
  EvenNumberCmd,
  number,
  number,
  number
> = new StateStoredLockingAggregate<EvenNumberCmd, number, number, number>(
  decider2,
  lockingRepository2
);

const aggregate3: IStateStoredOrchestratingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
> = new StateStoredOrchestratingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
>(decider.combine(decider2), repository3, saga);

test('aggregate-handle', async (t) => {
  t.deepEqual(await aggregate.handle(new AddOddNumberCmd(1)), 1);
});

test('aggregate-handle2', async (t) => {
  t.deepEqual(await aggregate2.handle(new AddEvenNumberCmd(2)), 2);
});

test('aggregate-handle2-locking', async (t) => {
  t.deepEqual(await lockingAggregate2.handle(new AddEvenNumberCmd(2)), [2, 1]);
});

test('aggregate-handle4', async (t) => {
  t.deepEqual(await aggregate3.handle(new AddEvenNumberCmd(7)), [18, 18]);
});

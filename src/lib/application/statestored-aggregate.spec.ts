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

import { StateRepository, StateStoredAggregate } from './statestored-aggregate';

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
      console.log('decide' + c);
      return [c.value];
    } else if (c instanceof MultiplyOddNumberCmd) {
      return [c.value];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (isNumber(e)) {
      console.log('evolve' + e);
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
      console.log('decide2' + c);
      return [c.valueEven];
    } else if (c instanceof MultiplyEvenNumberCmd) {
      return [c.valueEven];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (isNumber(e)) {
      console.log('evolve2' + e);
      return s + e;
    } else {
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
let storage3: readonly [number, number] | null = null;

class StateRepositoryImpl implements StateRepository<OddNumberCmd, number> {
  fetchState(_c: OddNumberCmd): number | null {
    return storage;
  }
  save(s: number): number {
    storage = s;
    return s;
  }
}

class StateRepositoryImpl2 implements StateRepository<EvenNumberCmd, number> {
  fetchState(_c: EvenNumberCmd): number | null {
    return storage2;
  }

  save(s: number): number {
    storage2 = s;
    return s;
  }
}

class StateRepositoryImpl3
  implements
    StateRepository<EvenNumberCmd | OddNumberCmd, readonly [number, number]>
{
  fetchState(
    _c: EvenNumberCmd | OddNumberCmd
  ): readonly [number, number] | null {
    return storage3;
  }

  save(s: readonly [number, number]): readonly [number, number] {
    console.log('Saving' + s);
    storage3 = s;
    return s;
  }
}

const repository: StateRepository<OddNumberCmd, number> =
  new StateRepositoryImpl();

const repository2: StateRepository<EvenNumberCmd, number> =
  new StateRepositoryImpl2();

const repository3: StateRepository<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number]
> = new StateRepositoryImpl3();

// ################################
// #### Application - Aggregate ###
// ################################

const aggregate: StateStoredAggregate<OddNumberCmd, number, number> =
  new StateStoredAggregate<OddNumberCmd, number, number>(
    decider,
    repository,
    undefined
  );

const aggregate2: StateStoredAggregate<EvenNumberCmd, number, number> =
  new StateStoredAggregate<EvenNumberCmd, number, number>(
    decider2,
    repository2,
    undefined
  );

const aggregate3: StateStoredAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
> = new StateStoredAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  number
>(decider.combine(decider2), repository3, saga);

test('aggregate-handle', (t) => {
  t.deepEqual(aggregate.handle(new AddOddNumberCmd(1)), 1);
});

test('aggregate-handle2', (t) => {
  t.deepEqual(aggregate2.handle(new AddEvenNumberCmd(2)), 2);
});

test('aggregate-handle4', (t) => {
  t.deepEqual(aggregate3.handle(new AddEvenNumberCmd(7)), [18, 18]);
});

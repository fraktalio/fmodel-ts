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

import { Decider } from './decider';

// ########### Commands ###########
class AddOddNumberCmd {
  constructor(readonly value: number) {}
}

class MultiplyOddNumberCmd {
  constructor(readonly value: number) {}
}

class AddEvenNumberCmd {
  constructor(readonly valueEven: string) {}
}

class MultiplyEvenNumberCmd {
  constructor(readonly valueEven: string) {}
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

const decider2: Decider<EvenNumberCmd, string, string> = new Decider<
  EvenNumberCmd,
  string,
  string
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
      return s.concat(e);
    } else {
      return s;
    }
  },
  '0'
);

test('decider-evolve', (t) => {
  t.is(decider.evolve(1, 1), 2);
});

test('decider2-evolve', (t) => {
  t.is(decider2.evolve('Yin', 'Yang'), 'YinYang');
});

test('decider-combined-evolve', (t) => {
  t.deepEqual(decider.combine(decider2).evolve([0, 'Yin'], 'Yang'), [
    0,
    'YinYang',
  ]);
});

test('decider-combined-evolve2', (t) => {
  t.deepEqual(decider.combine(decider2).evolve([0, 'Yin'], 1), [1, 'Yin']);
});

test('decider-decide', (t) => {
  t.deepEqual(decider.decide(new AddOddNumberCmd(1), 1), [1]);
});

test('decider-decide2', (t) => {
  t.deepEqual(
    decider
      .mapLeftOnCommand<OddNumberCmd | EvenNumberCmd>(
        (cn) => cn as OddNumberCmd
      )
      .decide(new AddEvenNumberCmd('test'), 1),
    []
  );
});

test('decider-decide3', (t) => {
  t.deepEqual(
    decider
      .mapLeftOnCommand<OddNumberCmd | EvenNumberCmd>(
        (cn) => cn as OddNumberCmd
      )
      .decide(new AddOddNumberCmd(1), 1),
    [1]
  );
});

test('decider2-decide', (t) => {
  t.deepEqual(decider2.decide(new AddEvenNumberCmd('2'), 'Yang'), ['2']);
});

test('decider-combined-decide', (t) => {
  t.deepEqual(
    decider.combine(decider2).decide(new AddOddNumberCmd(1), [0, 'Yin']),
    [1]
  );
});

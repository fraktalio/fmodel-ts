/* eslint-disable @typescript-eslint/no-explicit-any */

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
  constructor(readonly value: number) {}
}

class MultiplyEvenNumberCmd {
  constructor(readonly value: number) {}
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
      return [c.value.toString()];
    } else if (c instanceof MultiplyEvenNumberCmd) {
      return [c.value.toString()];
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

test('decider2-decide', (t) => {
  t.deepEqual(decider2.decide(new AddEvenNumberCmd(2), 'Yang'), ['2']);
});

test('decider-combined-decide', (t) => {
  t.deepEqual(
    decider.combine(decider2).decide(new AddOddNumberCmd(1), [0, 'Yin']),
    [1]
  );
});

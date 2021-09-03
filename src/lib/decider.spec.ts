/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'ava';

import { Decider } from './decider';

function isNumber(x: any): x is number {
  return typeof x === 'number';
}

function isString(x: any): x is string {
  return typeof x === 'string';
}

const decider: Decider<number, number, number> = new Decider<
  number,
  number,
  number
>(
  (c, _) => {
    if (isNumber(c)) {
      return [c];
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

const decider2: Decider<string, string, string> = new Decider<
  string,
  string,
  string
>(
  (c, _) => {
    // Do some pattern matching here ;)
    if (isString(c)) {
      return [c];
    } else {
      return [];
    }
  },
  (s, e) => {
    // Do some pattern matching here ;)
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
  t.deepEqual(decider.decide(1, 1), [1]);
});

test('decider2-decide', (t) => {
  t.deepEqual(decider2.decide('Yin', 'Yang'), ['Yin']);
});

test('decider-combined-decide', (t) => {
  t.deepEqual(decider.combine(decider2).decide('Yang', [0, 'Yin']), ['Yang']);
});

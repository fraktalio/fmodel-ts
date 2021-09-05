/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'ava';

import { View } from './view';

function isNumber(x: any): x is number {
  return typeof x === 'number';
}

function isString(x: any): x is string {
  return typeof x === 'string';
}

const view: View<number, number> = new View<number, number>((s, e) => {
  if (isNumber(e)) {
    return s + e;
  } else {
    return s;
  }
}, 0);

const view2: View<string, string> = new View<string, string>((s, e) => {
  if (isString(e)) {
    return s.concat(e);
  } else {
    return s;
  }
}, '');

test('view-evolve', (t) => {
  t.is(view.evolve(1, 1), 2);
});

test('view2-evolve', (t) => {
  t.is(view2.evolve('Yin', 'Yang'), 'YinYang');
});

test('view-combined-evolve', (t) => {
  t.deepEqual(view.combine(view2).evolve([0, 'Yin'], 'Yang'), [0, 'YinYang']);
});

test('view-combined-evolve2', (t) => {
  t.deepEqual(view.combine(view2).evolve([0, 'Yin'], 1), [1, 'Yin']);
});

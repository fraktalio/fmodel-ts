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

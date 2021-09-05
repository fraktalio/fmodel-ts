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

import { Saga } from './saga';

function isNumber(x: any): x is number {
  return typeof x === 'number';
}

function isString(x: any): x is string {
  return typeof x === 'string';
}

const saga: Saga<number, number> = new Saga<number, number>((ar) => {
  if (isNumber(ar)) {
    return [ar];
  } else {
    return [];
  }
});

const saga2: Saga<string, string> = new Saga<string, string>((ar) => {
  if (isString(ar)) {
    return [ar];
  } else {
    return [];
  }
});

test('saga-react', (t) => {
  t.deepEqual(saga.react(1), [1]);
});

test('saga2-react', (t) => {
  t.deepEqual(saga2.react('Yin'), ['Yin']);
});

test('saga-combined-react', (t) => {
  t.deepEqual(saga.combine(saga2).react('Yang'), ['Yang']);
});

test('saga-combined-react2', (t) => {
  t.deepEqual(saga.combine(saga2).react(0), [0]);
});

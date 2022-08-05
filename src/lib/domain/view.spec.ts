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

/* eslint-disable functional/no-class */
import test from 'ava';

import { View } from './view';

// ### Events
class OddNumberAddedEvt {
  constructor(readonly value: number) {}
}

class OddNumberMultiplied {
  constructor(readonly value: number) {}
}

type OddNumberEvt = OddNumberAddedEvt | OddNumberMultiplied;

class EvenNumberAddedEvt {
  constructor(readonly value: number) {}
}

class EvenNumberMultiplied {
  constructor(readonly value: number) {}
}

type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultiplied;

const view: View<number, OddNumberEvt> = new View<number, OddNumberEvt>(
  (s, e) => {
    if (e instanceof OddNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof OddNumberMultiplied) {
      return s * e.value;
    } else {
      const _: never = e;
      console.log('Never just happened in evolve function: ' + _);
      return s;
    }
  },
  0
);

const view2: View<number, EvenNumberEvt> = new View<number, EvenNumberEvt>(
  (s, e) => {
    if (e instanceof EvenNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof EvenNumberMultiplied) {
      return s * e.value;
    } else {
      const _: never = e;
      console.log('Never just happened in evolve function: ' + _);
      return s;
    }
  },
  0
);

test('view-evolve', (t) => {
  t.is(view.evolve(1, new OddNumberAddedEvt(1)), 2);
});

test('view-evolve2', (t) => {
  t.is(view.evolve(2, new OddNumberMultiplied(5)), 10);
});

test('view2-evolve', (t) => {
  t.is(view2.evolve(1, new EvenNumberAddedEvt(2)), 3);
});

test('view2-evolve2', (t) => {
  t.is(view2.evolve(2, new EvenNumberMultiplied(6)), 12);
});

test('view-combined-evolve', (t) => {
  t.deepEqual(
    view.combine(view2).evolve([0, 0], new OddNumberAddedEvt(1)),
    [1, 0]
  );
});

test('view-combined-evolve2', (t) => {
  t.deepEqual(
    view.combine(view2).evolve([0, 0], new EvenNumberAddedEvt(2)),
    [0, 2]
  );
});

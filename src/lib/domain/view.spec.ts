/*
 * Copyright 2023 Fraktalio D.O.O. All rights reserved.
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
/* eslint-disable functional/no-return-void */

import test from 'ava';

import { View } from './view';

// ################################
// ###### Domain - Events #########
// ################################

type OddNumberAddedEvt = {
  readonly value: number;
  readonly kind: 'OddNumberAddedEvt';
};

type OddNumberMultipliedEvt = {
  readonly value: number;
  readonly kind: 'OddNumberMultipliedEvt';
};

// A type representing the events for the Odd numbers
type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;

type EvenNumberAddedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberAddedEvt';
};

type EvenNumberMultipliedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberMultipliedEvt';
};

// A type representing the events for the Even numbers
type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

// A type representing the state of the view for Even numbers
type EvenViewState = {
  readonly evenState: number;
};

// A type representing the state of the view for Odd numbers
type OddViewState = {
  readonly oddState: number;
};

// A dedicated View for the Even numbers only
const evenView: View<EvenViewState, EvenNumberEvt> = new View<
  EvenViewState,
  EvenNumberEvt
>(
  (s, e) => {
    switch (e.kind) {
      case 'EvenNumberAddedEvt': {
        return { evenState: s.evenState + e.value };
      }
      case 'EvenNumberMultipliedEvt':
        return { evenState: s.evenState * e.value };
      default:
        // Exhaustive matching of the event type
        // eslint-disable-next-line no-case-declarations
        const _: never = e;
        console.log('Never just happened in evolve function: ' + _);
        return { evenState: s.evenState };
    }
  },
  { evenState: 0 },
);

// A dedicated View for the Odd numbers only
const oddView: View<OddViewState, OddNumberEvt> = new View<
  OddViewState,
  OddNumberEvt
>(
  (s, e) => {
    switch (e.kind) {
      case 'OddNumberAddedEvt':
        return { oddState: s.oddState + e.value };
      case 'OddNumberMultipliedEvt':
        return { oddState: s.oddState * e.value };
      default:
        // Exhaustive matching of the event type
        // eslint-disable-next-line no-case-declarations
        const _: never = e;
        console.log('Never just happened in evolve function: ' + _);
        return { oddState: s.oddState };
    }
  },
  { oddState: 0 },
);

test('odd-view-evolve', (t) => {
  t.deepEqual(
    oddView.evolve({ oddState: 1 }, { kind: 'OddNumberAddedEvt', value: 1 }),
    { oddState: 2 },
  );
});

test('odd-view-evolve2', (t) => {
  t.deepEqual(
    oddView.evolve(
      { oddState: 2 },
      { kind: 'OddNumberMultipliedEvt', value: 5 },
    ),
    { oddState: 10 },
  );
});

test('even-view-evolve', (t) => {
  t.deepEqual(
    evenView.evolve({ evenState: 1 }, { kind: 'EvenNumberAddedEvt', value: 2 }),
    { evenState: 3 },
  );
});

test('even-view-evolve2', (t) => {
  t.deepEqual(
    evenView.evolve(
      { evenState: 2 },
      { kind: 'EvenNumberMultipliedEvt', value: 6 },
    ),
    { evenState: 12 },
  );
});

test('combined-view-evolve', (t) => {
  t.deepEqual(
    oddView
      .combine(evenView)
      .evolve(
        { oddState: 0, evenState: 0 },
        { kind: 'OddNumberAddedEvt', value: 1 },
      ),
    { oddState: 1, evenState: 0 },
  );
});

test('combined-via-tuples-view-evolve', (t) => {
  t.deepEqual(
    oddView
      .combineViaTuples(evenView)
      .evolve([{ oddState: 0 }, { evenState: 0 }], {
        kind: 'OddNumberAddedEvt',
        value: 1,
      }),
    [{ oddState: 1 }, { evenState: 0 }],
  );
});

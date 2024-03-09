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

/* eslint-disable @typescript-eslint/no-unused-vars,functional/no-return-void */
import test from 'ava';

import { Saga } from './saga';

// ################################
// ###### Domain - Commands #######
// ################################

type AddOddNumberCmd = {
  readonly kindOfCommand: 'AddOddNumberCmd';
  readonly valueOfCommand: number;
};

type MultiplyOddNumberCmd = {
  readonly kindOfCommand: 'MultiplyOddNumberCmd';
  readonly valueOfCommand: number;
};

type AddEvenNumberCmd = {
  readonly kindOfCommand: 'AddEvenNumberCmd';
  readonly valueOfCommand: number;
};

type MultiplyEvenNumberCmd = {
  readonly kindOfCommand: 'MultiplyEvenNumberCmd';
  readonly valueOfCommand: number;
};

// Type that represents all the Odd numbers commands
type OddNumberCmd = AddOddNumberCmd | MultiplyOddNumberCmd;
// Type that represents all the Even numbers commands
type EvenNumberCmd = AddEvenNumberCmd | MultiplyEvenNumberCmd;

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

type EvenNumberAddedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberAddedEvt';
};

type EvenNumberMultipliedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberMultipliedEvt';
};

// Type that represents all the Odd numbers events
type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;
// Type that represents all the Even numbers events
type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

// Saga for Even numbers only
const evenSaga: Saga<OddNumberEvt, EvenNumberCmd> = new Saga<
  OddNumberEvt,
  EvenNumberCmd
>((ar) => {
  switch (ar.kind) {
    case 'OddNumberAddedEvt':
      return [
        { kindOfCommand: 'AddEvenNumberCmd', valueOfCommand: ar.value + 1 },
      ];
    case 'OddNumberMultipliedEvt':
      return [
        {
          kindOfCommand: 'MultiplyEvenNumberCmd',
          valueOfCommand: ar.value + 1,
        },
      ];
    default: {
      // Exhaustive matching of the Action Result type
      const _: never = ar;
      console.log('Never just happened in react function: ' + _);
      return [];
    }
  }
});

// Saga for Odd numbers only
const oddSaga: Saga<EvenNumberEvt, OddNumberCmd> = new Saga<
  EvenNumberEvt,
  OddNumberCmd
>((_) => {
  //This Saga is not doing much ;)
  return [];
});

test('even-saga-react', (t) => {
  t.deepEqual(evenSaga.react({ kind: 'OddNumberAddedEvt', value: 2 }), [
    { kindOfCommand: 'AddEvenNumberCmd', valueOfCommand: 3 },
  ]);
});

test('odd-saga-react', (t) => {
  t.deepEqual(oddSaga.react({ kind: 'EvenNumberAddedEvt', value: 1 }), []);
});

test('combined-saga-react', (t) => {
  t.deepEqual(
    evenSaga
      .combine(oddSaga)
      .react({ kind: 'OddNumberMultipliedEvt', value: 2 }),
    [{ kindOfCommand: 'MultiplyEvenNumberCmd', valueOfCommand: 3 }]
  );
});

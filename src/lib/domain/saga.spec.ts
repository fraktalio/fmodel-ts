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

/* eslint-disable functional/no-class,@typescript-eslint/no-unused-vars */
import test from 'ava';

import { Saga } from './saga';

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

// ### Events
class OddNumberAddedEvt {
  constructor(readonly value: number) {}
}

class OddNumberMultipliedEvt {
  constructor(readonly value: number) {}
}

class EvenNumberAddedEvt {
  constructor(readonly value: number) {}
}

class EvenNumberMultipliedEvt {
  constructor(readonly value: number) {}
}

type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;
type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

const saga: Saga<OddNumberEvt, EvenNumberCmd> = new Saga<
  OddNumberEvt,
  EvenNumberCmd
>((ar) => {
  if (ar instanceof OddNumberAddedEvt) {
    return [new AddEvenNumberCmd(ar.value + 1)];
  } else if (ar instanceof OddNumberMultipliedEvt) {
    return [new MultiplyEvenNumberCmd(ar.value + 1)];
  } else {
    const _: never = ar;
    console.log('Never just happened in react function: ' + _);
    return [];
  }
});

const saga2: Saga<EvenNumberEvt, OddNumberCmd> = new Saga<
  EvenNumberEvt,
  OddNumberCmd
>((_) => {
  //This Saga is not doing much ;)
  return [];
});

test('saga-react', (t) => {
  t.deepEqual(saga.react(new OddNumberAddedEvt(2)), [new AddEvenNumberCmd(3)]);
});

test('saga2-react', (t) => {
  t.deepEqual(saga2.react(new EvenNumberAddedEvt(1)), []);
});

test('saga-combined-react', (t) => {
  t.deepEqual(saga.combine(saga2).react(new OddNumberMultipliedEvt(2)), [
    new MultiplyEvenNumberCmd(3),
  ]);
});

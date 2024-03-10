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

/* eslint-disable functional/no-classes*/
import test from 'ava';

import { Saga } from '../domain/saga';

import { IActionPublisher, ISagaManager, SagaManager } from './saga-manager';

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

type Action = EvenNumberCmd | OddNumberCmd;
type ActionResult = EvenNumberEvt | OddNumberEvt;

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
>(() => {
  //This Saga is not doing much ;)
  return [];
});

class ActionPublisherImpl
  implements IActionPublisher<Action, ActionResult, Action>
{
  async publish(
    actions: readonly (Action & ActionResult)[]
  ): Promise<readonly Action[]> {
    return actions.map((a) => ({
      kindOfCommand: a.kindOfCommand,
      valueOfCommand: a.valueOfCommand,
    }));
  }
}
const actionPublisher: IActionPublisher<Action, ActionResult, Action> =
  new ActionPublisherImpl();

const sagaManager: ISagaManager<ActionResult, Action, ActionResult, Action> =
  new SagaManager<ActionResult, Action, ActionResult, Action>(
    evenSaga.combine(oddSaga),
    actionPublisher
  );

test('saga-handle', async (t) => {
  t.deepEqual(
    await sagaManager.handle({ kind: 'OddNumberMultipliedEvt', value: 1 }),
    [
      {
        kindOfCommand: 'MultiplyEvenNumberCmd',
        valueOfCommand: 2,
      },
    ]
  );
});

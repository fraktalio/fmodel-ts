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

import { Decider } from './decider';

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

type OddNumberCmd = AddOddNumberCmd | MultiplyOddNumberCmd;

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

type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;

type EvenNumberAddedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberAddedEvt';
};

type EvenNumberMultipliedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberMultipliedEvt';
};

type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

// ################################
// ###### Domain - Deciders #######
// ################################

// A current state of the Even number(s)
type EvenState = {
  readonly evenNumber: number;
};

// A current state of the Odd number(s)
type OddState = {
  readonly oddNumber: number;
};

// Even number decider - It works with even numbers only
const evenDecider: Decider<EvenNumberCmd, EvenState, EvenNumberEvt> =
  new Decider<EvenNumberCmd, EvenState, EvenNumberEvt>(
    (c, _) => {
      switch (c.kindOfCommand) {
        case 'AddEvenNumberCmd':
          return [{ kind: 'EvenNumberAddedEvt', value: c.valueOfCommand }];
        case 'MultiplyEvenNumberCmd':
          return [{ kind: 'EvenNumberMultipliedEvt', value: c.valueOfCommand }];
        default: {
          // Exhaustive matching of the command type
          const _: never = c;
          console.log('Never just happened in decide function: ' + _);
          return [];
        }
      }
    },
    (s, e) => {
      switch (e.kind) {
        case 'EvenNumberAddedEvt':
          return { evenNumber: s.evenNumber + e.value };
        case 'EvenNumberMultipliedEvt':
          return { evenNumber: s.evenNumber * e.value };
        default: {
          // Exhaustive matching of the event type
          const _: never = e;
          console.log('Never just happened in evolve function: ' + _);
          return { evenNumber: s.evenNumber };
        }
      }
    },
    { evenNumber: 0 }
  );

// Odd number decider - It works with odd numbers only
const oddDecider: Decider<OddNumberCmd, OddState, OddNumberEvt> = new Decider<
  OddNumberCmd,
  OddState,
  OddNumberEvt
>(
  (c, _) => {
    switch (c.kindOfCommand) {
      case 'AddOddNumberCmd':
        return [{ kind: 'OddNumberAddedEvt', value: c.valueOfCommand }];
      case 'MultiplyOddNumberCmd':
        return [{ kind: 'OddNumberMultipliedEvt', value: c.valueOfCommand }];
      default: {
        // Exhaustive matching of the command type
        const _: never = c;
        console.log('Never just happened in decide function: ' + _);
        return [];
      }
    }
  },
  (s, e) => {
    switch (e.kind) {
      case 'OddNumberAddedEvt':
        return { oddNumber: s.oddNumber + e.value };
      case 'OddNumberMultipliedEvt':
        return { oddNumber: s.oddNumber * e.value };
      default: {
        // Exhaustive matching of the event type
        const _: never = e;
        console.log('Never just happened in evolve function: ' + _);
        return { oddNumber: s.oddNumber };
      }
    }
  },
  { oddNumber: 0 }
);

test('odd-decider-evolve', (t) => {
  t.deepEqual(
    oddDecider.evolve(
      { oddNumber: 1 },
      { kind: 'OddNumberAddedEvt', value: 1 }
    ),
    { oddNumber: 2 }
  );
});

test('even-decider-evolve', (t) => {
  t.deepEqual(
    evenDecider.evolve(
      { evenNumber: 1 },
      { kind: 'EvenNumberAddedEvt', value: 2 }
    ),
    { evenNumber: 3 }
  );
});

test('combined-decider-evolve', (t) => {
  t.deepEqual(
    oddDecider
      .combine(evenDecider)
      .evolve([{ oddNumber: 0 }, { evenNumber: 0 }], {
        kind: 'EvenNumberAddedEvt',
        value: 2,
      }),
    [{ oddNumber: 0 }, { evenNumber: 2 }]
  );
});

test('combined-decider-evolve-2', (t) => {
  t.deepEqual(
    oddDecider
      .combine(evenDecider)
      .evolve([{ oddNumber: 0 }, { evenNumber: 0 }], {
        kind: 'OddNumberAddedEvt',
        value: 3,
      }),
    [{ oddNumber: 3 }, { evenNumber: 0 }]
  );
});

test('decider-decide', (t) => {
  t.deepEqual(
    oddDecider.decide(
      { kindOfCommand: 'AddOddNumberCmd', valueOfCommand: 1 },
      { oddNumber: 1 }
    ),
    [{ kind: 'OddNumberAddedEvt', value: 1 }]
  );
});

test('decider-decide-with-map', (t) => {
  t.deepEqual(
    oddDecider
      .mapContraOnCommand<OddNumberCmd | EvenNumberCmd>(
        (cn) => cn as OddNumberCmd
      )
      .decide(
        { kindOfCommand: 'AddEvenNumberCmd', valueOfCommand: 2 },
        { oddNumber: 2 }
      ),
    []
  );
});

test('combined-decider-decide', (t) => {
  t.deepEqual(
    oddDecider
      .combine(evenDecider)
      .decide({ kindOfCommand: 'AddOddNumberCmd', valueOfCommand: 1 }, [
        { oddNumber: 0 },
        { evenNumber: 0 },
      ]),
    [{ kind: 'OddNumberAddedEvt', value: 1 }]
  );
});

test('combined-decider-decide-2', (t) => {
  t.deepEqual(
    oddDecider
      .combineAndIntersect(evenDecider)
      .decide(
        { kindOfCommand: 'AddEvenNumberCmd', valueOfCommand: 2 },
        { evenNumber: 0, oddNumber: 0 }
      ),
    [{ kind: 'EvenNumberAddedEvt', value: 2 }]
  );
});

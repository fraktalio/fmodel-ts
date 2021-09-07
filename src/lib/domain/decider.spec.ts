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

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable functional/no-class */

import test from 'ava';

import { Decider } from './decider';

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

const decider: Decider<OddNumberCmd, number, OddNumberEvt> = new Decider<
  OddNumberCmd,
  number,
  OddNumberEvt
>(
  (c, _) => {
    if (c instanceof AddOddNumberCmd) {
      return [new OddNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyOddNumberCmd) {
      return [new OddNumberMultiplied(c.value)];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (e instanceof OddNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof OddNumberMultiplied) {
      return s * e.value;
    } else {
      return s;
    }
  },
  0
);

const decider2: Decider<EvenNumberCmd, number, EvenNumberEvt> = new Decider<
  EvenNumberCmd,
  number,
  EvenNumberEvt
>(
  (c, _) => {
    if (c instanceof AddEvenNumberCmd) {
      return [new EvenNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyEvenNumberCmd) {
      return [new EvenNumberMultiplied(c.value)];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (e instanceof EvenNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof EvenNumberMultiplied) {
      return s * e.value;
    } else {
      return s;
    }
  },
  0
);

test('decider-evolve', (t) => {
  t.is(decider.evolve(1, new OddNumberAddedEvt(1)), 2);
});

test('decider2-evolve', (t) => {
  t.is(decider2.evolve(1, new EvenNumberAddedEvt(2)), 3);
});

test('decider-combined-evolve', (t) => {
  t.deepEqual(
    decider.combine(decider2).evolve([0, 0], new EvenNumberAddedEvt(2)),
    [0, 2]
  );
});

test('decider-combined-evolve2', (t) => {
  t.deepEqual(
    decider.combine(decider2).evolve([0, 0], new OddNumberAddedEvt(3)),
    [3, 0]
  );
});

test('decider-combined-evolve3', (t) => {
  t.deepEqual(
    decider.combine(decider2).evolve([2, 1], new OddNumberMultiplied(3)),
    [6, 1]
  );
});

test('decider-decide', (t) => {
  t.deepEqual(decider.decide(new AddOddNumberCmd(1), 1), [
    new OddNumberAddedEvt(1),
  ]);
});

test('decider-decide2', (t) => {
  t.deepEqual(
    decider
      .mapLeftOnCommand<OddNumberCmd | EvenNumberCmd>(
        (cn) => cn as OddNumberCmd
      )
      .decide(new AddEvenNumberCmd(2), 1),
    []
  );
});

test('decider-decide3', (t) => {
  t.deepEqual(
    decider
      .mapLeftOnCommand<OddNumberCmd | EvenNumberCmd>(
        (cn) => cn as OddNumberCmd
      )
      .decide(new AddOddNumberCmd(1), 1),
    [new OddNumberAddedEvt(1)]
  );
});

test('decider2-decide', (t) => {
  t.deepEqual(decider2.decide(new AddEvenNumberCmd(2), 0), [
    new EvenNumberAddedEvt(2),
  ]);
});

test('decider-combined-decide', (t) => {
  t.deepEqual(
    decider.combine(decider2).decide(new AddOddNumberCmd(1), [0, 0]),
    [new OddNumberAddedEvt(1)]
  );
});

test('decider-combined-decide2', (t) => {
  t.deepEqual(
    decider.combine(decider2).decide(new MultiplyOddNumberCmd(1), [0, 0]),
    [new OddNumberMultiplied(1)]
  );
});

test('decider-combined-decide3', (t) => {
  t.deepEqual(
    decider.combine(decider2).decide(new AddEvenNumberCmd(2), [0, 0]),
    [new EvenNumberAddedEvt(2)]
  );
});

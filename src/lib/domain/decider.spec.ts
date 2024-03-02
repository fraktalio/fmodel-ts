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

/* eslint-disable functional/no-classes */

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
      // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      // When narrowing, you can reduce the options of a union to a point where you have removed all possibilities and have nothing left. In those cases, TypeScript will use a never type to represent a state which shouldn’t exist.
      // The `never` type is assignable to every type; however, no type is assignable to `never` (except `never` itself).
      const _: never = c;
      console.log('Never just happened in decide function: ' + _);
      return [];
    }
  },
  (s, e) => {
    if (e instanceof OddNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof OddNumberMultiplied) {
      return s * e.value;
    } else {
      const _: never = e;
      console.log('Returning state 1: ' + s);
      console.log('Never just happened in evolve function decider 1: ' + _);
      console.log('Returning state 2: ' + s);
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
      const _: never = c;
      console.log('Never just happened in decide function: ' + _);
      return [];
    }
  },
  (s, e) => {
    console.log('S: ' + s + ', E: ' + e.value);
    if (e instanceof EvenNumberAddedEvt) {
      console.log('EvenNumberAddedEvt: ' + e.value);
      return s + e.value;
    } else if (e instanceof EvenNumberMultiplied) {
      console.log('EvenNumberMultiplied: ' + e);
      return s * e.value;
    } else {
      const _: never = e;
      console.log('Never just happened in evolve function in decider 2 ' + _);
      return s;
    }
  },
  0
);

type OddState = {
  oddNumber: number;
};
const decider3: Decider<OddNumberCmd, OddState, OddNumberEvt> = new Decider<
  OddNumberCmd,
  OddState,
  OddNumberEvt
>(
  (c, _) => {
    if (c instanceof AddOddNumberCmd) {
      return [new OddNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyOddNumberCmd) {
      return [new OddNumberMultiplied(c.value)];
    } else {
      // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      // When narrowing, you can reduce the options of a union to a point where you have removed all possibilities and have nothing left. In those cases, TypeScript will use a never type to represent a state which shouldn’t exist.
      // The `never` type is assignable to every type; however, no type is assignable to `never` (except `never` itself).
      const _: never = c;
      console.log('Never just happened in decide function: ' + _);
      return [];
    }
  },
  (s, e) => {
    if (e instanceof OddNumberAddedEvt) {
      return { oddNumber: s.oddNumber + e.value };
    } else if (e instanceof OddNumberMultiplied) {
      return { oddNumber: s.oddNumber * e.value };
    } else {
      const _: never = e;
      console.log('Returning state 1: ' + s);
      console.log('Never just happened in evolve function decider 1: ' + _);
      console.log('Returning state 2: ' + s);
      return { oddNumber: s.oddNumber };
    }
  },
  { oddNumber: 0 }
);

type EvenState = {
  evenNumber: number;
};
const decider4: Decider<EvenNumberCmd, EvenState, EvenNumberEvt> = new Decider<
  EvenNumberCmd,
  EvenState,
  EvenNumberEvt
>(
  (c, _) => {
    if (c instanceof AddEvenNumberCmd) {
      return [new EvenNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyEvenNumberCmd) {
      return [new EvenNumberMultiplied(c.value)];
    } else {
      const _: never = c;
      console.log('Never just happened in decide function: ' + _);
      return [];
    }
  },
  (s, e) => {
    console.log('S: ' + s + ', E: ' + e.value);
    if (e instanceof EvenNumberAddedEvt) {
      console.log('EvenNumberAddedEvt: ' + e.value);
      return { evenNumber: s.evenNumber + e.value };
    } else if (e instanceof EvenNumberMultiplied) {
      console.log('EvenNumberMultiplied: ' + e);
      return { evenNumber: s.evenNumber * e.value };
    } else {
      const _: never = e;
      console.log('Never just happened in evolve function in decider 2 ' + _);
      return { evenNumber: s.evenNumber };
    }
  },
  { evenNumber: 0 }
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

test('decider-combined-evolve4', (t) => {
  t.deepEqual(
    decider3
      .combineAndIntersect(decider4)
      .evolve({ evenNumber: 0, oddNumber: 0 }, new EvenNumberAddedEvt(2)),
    { evenNumber: 2, oddNumber: 0 }
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
      .mapContraOnCommand<OddNumberCmd | EvenNumberCmd>(
        (cn) => cn as OddNumberCmd
      )
      .decide(new AddEvenNumberCmd(2), 1),
    []
  );
});

test('decider-decide3', (t) => {
  t.deepEqual(
    decider
      .mapContraOnCommand<OddNumberCmd | EvenNumberCmd>(
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

test('decider-combined-decide4', (t) => {
  t.deepEqual(
    decider3
      .combineAndIntersect(decider4)
      .decide(new AddEvenNumberCmd(2), { evenNumber: 0, oddNumber: 0 }),
    [new EvenNumberAddedEvt(2)]
  );
});

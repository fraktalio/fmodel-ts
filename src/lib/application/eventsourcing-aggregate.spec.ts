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

import { Decider } from '../domain/decider';
import { Saga } from '../domain/saga';

import {
  EventRepository,
  EventSourcingAggregate,
} from './eventsourcing-aggregate';

// ################################
// ###### Domain - Commands #######
// ################################

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

// ################################
// ###### Domain - Events #########
// ################################

class OddNumberAddedEvt {
  constructor(readonly value: number) {}
}

class OddNumberMultipliedEvt {
  constructor(readonly value: number) {}
}

type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;

class EvenNumberAddedEvt {
  constructor(readonly value: number) {}
}

class EvenNumberMultipliedEvt {
  constructor(readonly value: number) {}
}

type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

// ################################
// ###### Domain - Deciders #######
// ################################

const decider: Decider<OddNumberCmd, number, OddNumberEvt> = new Decider<
  OddNumberCmd,
  number,
  OddNumberEvt
>(
  (c, _) => {
    if (c instanceof AddOddNumberCmd) {
      return [new OddNumberAddedEvt(c.value)];
    } else if (c instanceof MultiplyOddNumberCmd) {
      return [new OddNumberMultipliedEvt(c.value)];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (e instanceof OddNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof OddNumberMultipliedEvt) {
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
      return [new EvenNumberMultipliedEvt(c.value)];
    } else {
      return [];
    }
  },
  (s, e) => {
    if (e instanceof EvenNumberAddedEvt) {
      return s + e.value;
    } else if (e instanceof EvenNumberMultipliedEvt) {
      return s * e.value;
    } else {
      return s;
    }
  },
  0
);

// ################################
// ####### Domain - Sagas #########
// ################################

const saga: Saga<OddNumberEvt, EvenNumberCmd> = new Saga<
  OddNumberEvt,
  EvenNumberCmd
>((ar) => {
  if (ar instanceof OddNumberAddedEvt) {
    return [new AddEvenNumberCmd(ar.value + 1)];
  } else if (ar instanceof OddNumberMultipliedEvt) {
    return [new MultiplyEvenNumberCmd(ar.value + 1)];
  } else {
    return [];
  }
});

// ################################
// ###### Application - Repo ######
// ################################

const storage: readonly OddNumberEvt[] = [];
const storage2: readonly EvenNumberEvt[] = [];
const storage3: readonly (OddNumberEvt | EvenNumberEvt)[] = [];

class EventRepositoryImpl
  implements EventRepository<OddNumberCmd, OddNumberEvt>
{
  fetchEvents(_c: OddNumberCmd): readonly OddNumberEvt[] {
    return storage;
  }

  save(e: OddNumberEvt): OddNumberEvt {
    storage.concat(e);
    return e;
  }
  saveAll(eList: readonly OddNumberEvt[]): readonly OddNumberEvt[] {
    storage.concat(eList);
    return eList;
  }
}

class EventRepositoryImpl2
  implements EventRepository<EvenNumberCmd, EvenNumberEvt>
{
  fetchEvents(_c: EvenNumberCmd): readonly EvenNumberEvt[] {
    return storage2;
  }

  save(e: EvenNumberEvt): EvenNumberEvt {
    storage2.concat(e);
    return e;
  }
  saveAll(eList: readonly EvenNumberEvt[]): readonly EvenNumberEvt[] {
    storage2.concat(eList);
    return eList;
  }
}

class EventRepositoryImpl3
  implements
    EventRepository<EvenNumberCmd | OddNumberCmd, OddNumberEvt | EvenNumberEvt>
{
  fetchEvents(
    _c: EvenNumberCmd | OddNumberCmd
  ): readonly (OddNumberEvt | EvenNumberEvt)[] {
    return storage3;
  }
  save(e: OddNumberEvt | EvenNumberEvt): OddNumberEvt | EvenNumberEvt {
    storage3.concat(e);
    return e;
  }
  saveAll(
    eList: readonly (OddNumberEvt | EvenNumberEvt)[]
  ): readonly (OddNumberEvt | EvenNumberEvt)[] {
    storage3.concat(eList);
    return eList;
  }
}

const repository: EventRepository<OddNumberCmd, OddNumberEvt> =
  new EventRepositoryImpl();

const repository2: EventRepository<EvenNumberCmd, EvenNumberEvt> =
  new EventRepositoryImpl2();

const repository3: EventRepository<
  EvenNumberCmd | OddNumberCmd,
  OddNumberEvt | EvenNumberEvt
> = new EventRepositoryImpl3();

// ################################
// ### Application - Aggregates ###
// ################################

const aggregate: EventSourcingAggregate<OddNumberCmd, number, OddNumberEvt> =
  new EventSourcingAggregate<OddNumberCmd, number, OddNumberEvt>(
    decider,
    repository,
    undefined
  );

const aggregate2: EventSourcingAggregate<EvenNumberCmd, number, EvenNumberEvt> =
  new EventSourcingAggregate<EvenNumberCmd, number, EvenNumberEvt>(
    decider2,
    repository2,
    undefined
  );

const aggregate3: EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
> = new EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
>(decider.combine(decider2), repository3, undefined);

const aggregate4: EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
> = new EventSourcingAggregate<
  EvenNumberCmd | OddNumberCmd,
  readonly [number, number],
  OddNumberEvt | EvenNumberEvt
>(decider.combine(decider2), repository3, saga);

// ################################
// ############ Tests #############
// ################################

test('aggregate-handle', (t) => {
  t.deepEqual(aggregate.handle(new AddOddNumberCmd(1)), [
    new OddNumberAddedEvt(1),
  ]);
});

test('aggregate-handle2', (t) => {
  t.deepEqual(aggregate2.handle(new AddEvenNumberCmd(2)), [
    new EvenNumberAddedEvt(2),
  ]);
});

test('aggregate-handle3', (t) => {
  t.deepEqual(aggregate3.handle(new AddOddNumberCmd(1)), [
    new OddNumberAddedEvt(1),
  ]);
});

test('aggregate-handle4', (t) => {
  t.deepEqual(aggregate3.handle(new AddEvenNumberCmd(2)), [
    new EvenNumberAddedEvt(2),
  ]);
});

test('aggregate-handle5', (t) => {
  t.deepEqual(aggregate4.handle(new AddEvenNumberCmd(6)), [
    new EvenNumberAddedEvt(6),
  ]);
});

test('aggregate-handle6', (t) => {
  t.deepEqual(aggregate4.handle(new AddOddNumberCmd(7)), [
    new OddNumberAddedEvt(7),
    new EvenNumberAddedEvt(8),
  ]);
});

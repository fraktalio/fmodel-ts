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

/* eslint-disable functional/no-classes,@typescript-eslint/no-unused-vars */

import test from 'ava';

import { Decider } from '../domain/decider';
import { Saga } from '../domain/saga';

import {
  EventSourcingAggregate,
  EventSourcingOrchestratingAggregate,
  IEventRepository,
  IEventSourcingAggregate,
  IEventSourcingOrchestratingAggregate,
} from './eventsourcing-aggregate';

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

const evenDecider: Decider<EvenNumberCmd, EvenState, EvenNumberEvt> =
  new Decider<EvenNumberCmd, EvenState, EvenNumberEvt>(
    (c, _) => {
      switch (c.kindOfCommand) {
        case 'AddEvenNumberCmd':
          return [{ kind: 'EvenNumberAddedEvt', value: c.valueOfCommand }];
        case 'MultiplyEvenNumberCmd':
          return [{ kind: 'EvenNumberMultipliedEvt', value: c.valueOfCommand }];
        default:
          // Exhaustive matching of the command type
          // eslint-disable-next-line no-case-declarations
          const _: never = c;
          console.log('Never just happened in decide function: ' + _);
          return [];
      }
    },
    (s, e) => {
      switch (e.kind) {
        case 'EvenNumberAddedEvt':
          return { evenNumber: s.evenNumber + e.value };
        case 'EvenNumberMultipliedEvt':
          return { evenNumber: s.evenNumber * e.value };
        default:
          // Exhaustive matching of the command type
          // eslint-disable-next-line no-case-declarations
          const _: never = e;
          console.log('Never just happened in evolve function: ' + _);
          return { evenNumber: s.evenNumber };
      }
    },
    { evenNumber: 0 }
  );

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
      default:
        // Exhaustive matching of the command type
        // eslint-disable-next-line no-case-declarations
        const _: never = c;
        console.log('Never just happened in decide function: ' + _);
        return [];
    }
  },
  (s, e) => {
    switch (e.kind) {
      case 'OddNumberAddedEvt':
        return { oddNumber: s.oddNumber + e.value };
      case 'OddNumberMultipliedEvt':
        return { oddNumber: s.oddNumber * e.value };
      default:
        // Exhaustive matching of the command type
        // eslint-disable-next-line no-case-declarations
        const _: never = e;
        console.log('Never just happened in evolve function: ' + _);
        return { oddNumber: s.oddNumber };
    }
  },
  { oddNumber: 0 }
);

// ################################
// ####### Domain - Sagas #########
// ################################

const oddSaga: Saga<OddNumberEvt, EvenNumberCmd> = new Saga<
  OddNumberEvt,
  EvenNumberCmd
>((ar) => {
  switch (ar.kind) {
    case 'OddNumberAddedEvt':
      return [
        {
          kindOfCommand: 'AddEvenNumberCmd',
          valueOfCommand: ar.value + 1,
        },
      ];
    case 'OddNumberMultipliedEvt':
      return [
        {
          kindOfCommand: 'MultiplyEvenNumberCmd',
          valueOfCommand: ar.value + 1,
        },
      ];
    default:
      // Exhaustive matching of the command type
      // eslint-disable-next-line no-case-declarations
      const _: never = ar;
      console.log('Never just happened in saga react function: ' + _);
      return [];
  }
});

const evenSaga: Saga<EvenNumberEvt, OddNumberCmd> = new Saga<
  EvenNumberEvt,
  OddNumberCmd
>((_) => {
  return [];
});

// ################################
// ###### Application - Repo ######
// ################################

const storage: readonly (Evt & Version)[] = [];

// A type representing the version
type Version = {
  readonly version: number;
};

type Cmd = EvenNumberCmd | OddNumberCmd;
type Evt = EvenNumberEvt | OddNumberEvt;

class EventRepositoryImpl
  implements IEventRepository<Cmd, Evt, Version, Cmd, Evt>
{
  async fetch(_c: Cmd): Promise<readonly (Evt & Version)[]> {
    return storage;
  }

  async save(
    eList: readonly (Evt & Cmd)[],
    versionProvider: (e: Evt) => Promise<Version | null>
  ): Promise<readonly (Evt & Version)[]> {
    const savedEvents: readonly (Evt & Version)[] = await Promise.all(
      eList.map(async (e: Evt, index) => ({
        kind: e.kind,
        value: e.value,
        version: ((await versionProvider(e))?.version ?? 0) + index + 1,
      }))
    );
    storage.concat(savedEvents);
    return savedEvents;
  }

  async versionProvider(_e: Evt): Promise<Version | null> {
    return storage[storage.length - 1];
  }
}

const repository: IEventRepository<Cmd, Evt, Version, Cmd, Evt> =
  new EventRepositoryImpl();

// ################################
// ### Application - Aggregates ###
// ################################

const aggregate: IEventSourcingAggregate<
  Cmd,
  OddState & EvenState,
  Evt,
  Version,
  Cmd,
  Evt
> = new EventSourcingAggregate<
  Cmd,
  OddState & EvenState,
  Evt,
  Version,
  Cmd,
  Evt
>(evenDecider.combineAndIntersect(oddDecider), repository);

const aggregate2: IEventSourcingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  Cmd,
  Evt
> = new EventSourcingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  Cmd,
  Evt
>(evenDecider.combine(oddDecider), repository);

const aggregate3: IEventSourcingOrchestratingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  Cmd,
  Evt
> = new EventSourcingOrchestratingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  Cmd,
  Evt
>(evenDecider.combine(oddDecider), repository, oddSaga.combine(evenSaga));

// ################################
// ############ Tests #############
// ################################

test('aggregate-handle', async (t) => {
  t.deepEqual(
    await aggregate.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
    }),
    [{ value: 1, version: 1, kind: 'OddNumberAddedEvt' }]
  );
});

test('aggregate-handle2', async (t) => {
  t.deepEqual(
    await aggregate.handle({
      kindOfCommand: 'AddEvenNumberCmd',
      valueOfCommand: 2,
    }),
    [{ value: 2, version: 1, kind: 'EvenNumberAddedEvt' }]
  );
});

test('aggregate-handle3', async (t) => {
  t.deepEqual(
    await aggregate2.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
    }),
    [{ value: 1, version: 1, kind: 'OddNumberAddedEvt' }]
  );
});

test('aggregate-handle4', async (t) => {
  t.deepEqual(
    await aggregate2.handle({
      kindOfCommand: 'AddEvenNumberCmd',
      valueOfCommand: 2,
    }),
    [{ value: 2, version: 1, kind: 'EvenNumberAddedEvt' }]
  );
});

test('aggregate-handle5', async (t) => {
  t.deepEqual(
    await aggregate3.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 3,
    }),
    [
      { value: 3, version: 1, kind: 'OddNumberAddedEvt' },
      { value: 4, version: 2, kind: 'EvenNumberAddedEvt' },
    ]
  );
});

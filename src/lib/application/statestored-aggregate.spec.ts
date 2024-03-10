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
  IStateRepository,
  IStateStoredAggregate,
  IStateStoredOrchestratingAggregate,
  StateStoredAggregate,
  StateStoredOrchestratingAggregate,
} from './statestored-aggregate';

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

// Decider for Even numbers only
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
          // Exhaustive matching of the event type
          // eslint-disable-next-line no-case-declarations
          const _: never = e;
          console.log('Never just happened in evolve function: ' + _);
          return { evenNumber: s.evenNumber };
      }
    },
    { evenNumber: 0 }
  );

// Decider for Odd numbers only
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
        // Exhaustive matching of the event type
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

// Saga for Odd numbers only
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
      // Exhaustive matching of the event type
      // eslint-disable-next-line no-case-declarations
      const _: never = ar;
      console.log('Never just happened in saga react function: ' + _);
      return [];
  }
});

// Saga for Even numbers only
const evenSaga: Saga<EvenNumberEvt, OddNumberCmd> = new Saga<
  EvenNumberEvt,
  OddNumberCmd
>((_) => {
  return [];
});

// ################################
// ###### Application - Repo ######
// ################################

// eslint-disable-next-line functional/no-let
let storage: State & Version = { evenNumber: 0, oddNumber: 0, version: 0 };

// A type representing the version of the state
type Version = {
  readonly version: number;
};

// A type representing all the commands
type Cmd = EvenNumberCmd | OddNumberCmd;
// A type representing all the events
type Evt = EvenNumberEvt | OddNumberEvt;
// The type representing the combined state of both: EvenState and OddState
type State = EvenState & OddState;

// This version of repository has Command Metadata of type `Cmd` / same as payload `Cmd` / the intersections `Cmd & Cmd = Cmd`
// This version of repository has State Metadata of type `State` / same as payload `State` / the intersections `State & State = State`
class StateRepositoryImpl
  implements IStateRepository<Cmd, State, Version, Cmd, State>
{
  async fetch(_c: Cmd): Promise<(State & Version) | null> {
    return storage;
  }
  async save(s: State & Cmd): Promise<State & Version> {
    storage = {
      evenNumber: s.evenNumber,
      oddNumber: s.oddNumber,
      version: storage.version + 1,
    };
    return storage;
  }
}

const repository: IStateRepository<Cmd, State, Version, Cmd, State> =
  new StateRepositoryImpl();

type CmdMetadata = { readonly traceId: string };
type StateMetadata = { readonly traceId: string };

// eslint-disable-next-line functional/no-let
let storage2: State & Version & StateMetadata = {
  evenNumber: 0,
  oddNumber: 0,
  version: 0,
  traceId: '',
};

// This version of repository has Command Metadata of type `CmdMetadata`  / the intersections `Cmd & CmdMetadata`
// This version of repository has State Metadata of type `StateMetadata` / the intersections `State & StateMetadata`
class StateRepositoryImpl2
  implements IStateRepository<Cmd, State, Version, CmdMetadata, StateMetadata>
{
  async fetch(_c: Cmd): Promise<(State & Version & StateMetadata) | null> {
    return storage2;
  }
  async save(s: State & CmdMetadata): Promise<State & Version & StateMetadata> {
    storage2 = {
      evenNumber: s.evenNumber,
      oddNumber: s.oddNumber,
      version: storage2.version + 1,
      traceId: s.traceId,
    };
    return storage2;
  }
}

const repository2: IStateRepository<
  Cmd,
  State,
  Version,
  CmdMetadata,
  StateMetadata
> = new StateRepositoryImpl2();

// ################################
// #### Application - Aggregate ###
// ################################

const aggregate: IStateStoredAggregate<Cmd, State, Evt, Version, Cmd, State> =
  new StateStoredAggregate<Cmd, State, Evt, Version, Cmd, State>(
    evenDecider.combineAndIntersect(oddDecider), // combining two deciders into one decider
    repository
  );

const aggregate2: IStateStoredAggregate<
  Cmd,
  State,
  Evt,
  Version,
  CmdMetadata,
  StateMetadata
> = new StateStoredAggregate<
  Cmd,
  State,
  Evt,
  Version,
  CmdMetadata,
  StateMetadata
>(
  evenDecider.combineAndIntersect(oddDecider), // combining two deciders into one decider
  repository2
);

const orchestratedAggregate: IStateStoredOrchestratingAggregate<
  Cmd,
  State,
  Evt,
  Version,
  Cmd,
  State
> = new StateStoredOrchestratingAggregate<Cmd, State, Evt, Version, Cmd, State>(
  evenDecider.combineAndIntersect(oddDecider), // combining two deciders into one decider
  repository,
  evenSaga.combine(oddSaga) // combining two sagas into one saga
);

test('aggregate-handle', async (t) => {
  t.deepEqual(
    await aggregate.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
    }),
    {
      version: 1,
      evenNumber: 0,
      oddNumber: 1,
    }
  );
});

test('aggregate-handle2', async (t) => {
  t.deepEqual(
    await aggregate.handle({
      kindOfCommand: 'AddEvenNumberCmd',
      valueOfCommand: 2,
    }),
    {
      version: 2,
      evenNumber: 2,
      oddNumber: 0,
    }
  );
});

test('orchestrated-aggregate-handle', async (t) => {
  t.deepEqual(
    await orchestratedAggregate.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
    }),
    {
      version: 3,
      evenNumber: 2,
      oddNumber: 1,
    }
  );
});

test('aggregate-handle3', async (t) => {
  t.deepEqual(
    await aggregate2.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
      traceId: '1',
    }),
    {
      version: 1,
      evenNumber: 0,
      oddNumber: 1,
      traceId: '1',
    }
  );
});

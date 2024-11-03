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

// Type that represents all Odd number commands
type OddNumberCmd = AddOddNumberCmd | MultiplyOddNumberCmd;
// Type that represents all Even number commands
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

// Type that represents all Odd number events
type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;
// Type that represents all Even number events
type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;

// ################################
// ###### Domain - Deciders #######
// ################################

// A current state of the Odd number(s)
type OddState = {
  readonly oddNumber: number;
};

// A current state of the Even number(s)
type EvenState = {
  readonly evenNumber: number;
};

// A decider / decision-making component for Odd numbers only
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
  { oddNumber: 0 },
);

// A decider / decision-making component for Even numbers only
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
    { evenNumber: 0 },
  );

// ################################
// ####### Domain - Sagas #########
// ################################

// A saga component for Odd numbers only
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

// A saga component for Odd numbers only
const evenSaga: Saga<EvenNumberEvt, OddNumberCmd> = new Saga<
  EvenNumberEvt,
  OddNumberCmd
>((_) => {
  return [];
});

// ################################
// ###### Application - Repo ######
// ################################

// A very simple storage/DB
const storage: readonly (Evt & Version & EvtMetadata)[] = [];

// A type representing the version
type Version = {
  readonly version: number;
};
// A type representing the command metadata
type CmdMetadata = { readonly traceId: string };
// A type representing the event metadata
type EvtMetadata = { readonly traceId: string };
// A type representing all the commands of the system
type Cmd = EvenNumberCmd | OddNumberCmd;
// A type representing all the events of the system
type Evt = EvenNumberEvt | OddNumberEvt;

// An implementation if the event repository
class EventRepositoryImpl
  implements IEventRepository<Cmd, Evt, Version, CmdMetadata, EvtMetadata>
{
  async fetch(_c: Cmd): Promise<readonly (Evt & Version & EvtMetadata)[]> {
    return storage;
  }

  async save(
    eList: readonly Evt[],
    commandMetadata: CmdMetadata,
    versionProvider: (e: Evt) => Promise<Version | null>,
  ): Promise<readonly (Evt & Version & EvtMetadata)[]> {
    //mapping the Commands metadata into Events metadata !!!
    const savedEvents: readonly (Evt & Version & EvtMetadata)[] =
      await Promise.all(
        eList.map(async (e: Evt, index) => ({
          kind: e.kind,
          value: e.value,
          version: ((await versionProvider(e))?.version ?? 0) + index + 1,
          traceId: commandMetadata.traceId,
        })),
      );
    storage.concat(savedEvents);
    return savedEvents;
  }

  async versionProvider(_e: Evt): Promise<Version | null> {
    return storage[storage.length - 1];
  }
}

const repository: IEventRepository<
  Cmd,
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
> = new EventRepositoryImpl();

// ################################
// ### Application - Aggregates ###
// ################################

// #######################################################################################################################################################################
// #### We demonstrate more complex cases of aggregates that are actually COMBINING multiple deciders into one big decider that can be orchestrated by the aggregate. ####
// #### The choice of how we are combining them: `combine`/intersection/OddState & EvenState; OR `combineViaTuples`/tuples/readonly [EvenState, OddState]             ####
// #### does not make a big difference for the Event Sourcing aggregate, as the State is not exposed to the outside, only Events and Commands are.                    ####
// #######################################################################################################################################################################

// An aggregate that combines (via INTERSECTION) all deciders under one big that can handle all type of commands
const aggregate: IEventSourcingAggregate<
  Cmd,
  OddState & EvenState,
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
> = new EventSourcingAggregate<
  Cmd,
  OddState & EvenState,
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
>(evenDecider.combine(oddDecider), repository);

// An aggregate that combines (via TUPLES) all deciders under one big that can handle all type of commands
const aggregateViaTuple: IEventSourcingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
> = new EventSourcingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
>(evenDecider.combineViaTuples(oddDecider), repository);

// An aggregate that combines (via INTERSECTION) all deciders and SAGAS under one aggregate that can handle all type of commands
const aggregateOrchestrating: IEventSourcingOrchestratingAggregate<
  Cmd,
  EvenState & OddState,
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
> = new EventSourcingOrchestratingAggregate<
  Cmd,
  EvenState & OddState,
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
>(evenDecider.combine(oddDecider), repository, oddSaga.combine(evenSaga));

// An aggregate that combines (via TUPLES) all deciders and SAGAS under one aggregate that can handle all type of commands
const aggregateViaTupleOrchestrating: IEventSourcingOrchestratingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
> = new EventSourcingOrchestratingAggregate<
  Cmd,
  readonly [EvenState, OddState],
  Evt,
  Version,
  CmdMetadata,
  EvtMetadata
>(
  evenDecider.combineViaTuples(oddDecider),
  repository,
  oddSaga.combine(evenSaga),
);

// ################################
// ############ Tests #############
// ################################

test('aggregate-handle', async (t) => {
  t.deepEqual(
    await aggregate.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
      traceId: 'trc1',
    }),
    [{ value: 1, version: 1, kind: 'OddNumberAddedEvt', traceId: 'trc1' }],
  );
});

test('aggregate-handle2', async (t) => {
  t.deepEqual(
    await aggregate.handle({
      kindOfCommand: 'AddEvenNumberCmd',
      valueOfCommand: 2,
      traceId: 'trc1',
    }),
    [{ value: 2, version: 1, kind: 'EvenNumberAddedEvt', traceId: 'trc1' }],
  );
});

test('aggregate-via-tuples-handle', async (t) => {
  t.deepEqual(
    await aggregateViaTuple.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 1,
      traceId: 'trc1',
    }),
    [{ value: 1, version: 1, kind: 'OddNumberAddedEvt', traceId: 'trc1' }],
  );
});

test('aggregate-via-tuples-handle2', async (t) => {
  t.deepEqual(
    await aggregateViaTuple.handle({
      kindOfCommand: 'AddEvenNumberCmd',
      valueOfCommand: 2,
      traceId: 'trc1',
    }),
    [{ value: 2, version: 1, kind: 'EvenNumberAddedEvt', traceId: 'trc1' }],
  );
});

test('aggregate-orchestrating-handle', async (t) => {
  t.deepEqual(
    await aggregateOrchestrating.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 3,
      traceId: 'trc1',
    }),
    [
      { value: 3, version: 1, kind: 'OddNumberAddedEvt', traceId: 'trc1' },
      { value: 4, version: 2, kind: 'EvenNumberAddedEvt', traceId: 'trc1' },
    ],
  );
});

test('aggregate-via-tuples-orchestrating-handle', async (t) => {
  t.deepEqual(
    await aggregateViaTupleOrchestrating.handle({
      kindOfCommand: 'AddOddNumberCmd',
      valueOfCommand: 3,
      traceId: 'trc1',
    }),
    [
      { value: 3, version: 1, kind: 'OddNumberAddedEvt', traceId: 'trc1' },
      { value: 4, version: 2, kind: 'EvenNumberAddedEvt', traceId: 'trc1' },
    ],
  );
});

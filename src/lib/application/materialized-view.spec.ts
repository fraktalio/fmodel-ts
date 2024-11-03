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

import { View } from '../domain/view';

import {
  IMaterializedView,
  IViewStateRepository,
  MaterializedView,
} from './materialized-view';

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

// A type representing the events for the Odd numbers
type OddNumberEvt = OddNumberAddedEvt | OddNumberMultipliedEvt;

type EvenNumberAddedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberAddedEvt';
};

type EvenNumberMultipliedEvt = {
  readonly value: number;
  readonly kind: 'EvenNumberMultipliedEvt';
};

// A type representing the events for the Odd numbers
type EvenNumberEvt = EvenNumberAddedEvt | EvenNumberMultipliedEvt;
// A type representing all events of the system
type Event = OddNumberEvt | EvenNumberEvt;

// A type representing the state of the view for Even numbers
type EvenViewState = {
  readonly evenState: number;
};
// A type representing the state of the view for Odd numbers
type OddViewState = {
  readonly oddState: number;
};

// Combined View state of the system
type ViewState = EvenViewState & OddViewState;

// View for the Even numbers
const evenView: View<EvenViewState, EvenNumberEvt> = new View<
  EvenViewState,
  EvenNumberEvt
>(
  (s, e) => {
    switch (e.kind) {
      case 'EvenNumberAddedEvt': {
        return { evenState: s.evenState + e.value };
      }
      case 'EvenNumberMultipliedEvt':
        return { evenState: s.evenState * e.value };
      default:
        // Exhaustive matching of the event type
        // eslint-disable-next-line no-case-declarations
        const _: never = e;
        console.log('Never just happened in evolve function: ' + _);
        return { evenState: s.evenState };
    }
  },
  { evenState: 0 },
);

// View for the Odd numbers
const oddView: View<OddViewState, OddNumberEvt> = new View<
  OddViewState,
  OddNumberEvt
>(
  (s, e) => {
    switch (e.kind) {
      case 'OddNumberAddedEvt':
        return { oddState: s.oddState + e.value };
      case 'OddNumberMultipliedEvt':
        return { oddState: s.oddState * e.value };
      default:
        // Exhaustive matching of the event type
        // eslint-disable-next-line no-case-declarations
        const _: never = e;
        console.log('Never just happened in evolve function: ' + _);
        return { oddState: s.oddState };
    }
  },
  { oddState: 0 },
);

// ############################################
// ############## Repository ##################
// ############################################

// A type representing the version
type Version = {
  readonly version: number;
};
// A type representing the event metadata
type EventMetadata = { readonly traceId: string };

// eslint-disable-next-line functional/no-let
let storage: (ViewState & Version) | null = null;

class ViewStateRepositoryImpl
  implements IViewStateRepository<Event, ViewState, Version, EventMetadata>
{
  async fetch(_e: Event): Promise<(ViewState & Version) | null> {
    return storage;
  }
  async save(
    s: ViewState,
    _: EventMetadata,
    v: Version | null,
  ): Promise<ViewState & Version> {
    storage = {
      evenState: s.evenState,
      oddState: s.oddState,
      version: (v?.version ?? 0) + 1,
    };
    return storage;
  }
}
const repository: IViewStateRepository<
  Event,
  ViewState,
  Version,
  EventMetadata
> = new ViewStateRepositoryImpl();

// ############################################
// ########## Materialized View ###############
// ############################################
const materializedView: IMaterializedView<
  ViewState,
  Event,
  Version,
  EventMetadata
> = new MaterializedView<ViewState, Event, Version, EventMetadata>(
  evenView.combine(oddView),
  repository,
);

test('view-handle', async (t) => {
  t.deepEqual(
    await materializedView.handle({
      kind: 'EvenNumberAddedEvt',
      value: 2,
      traceId: 'trc1',
    }),
    { evenState: 2, oddState: 0, version: 1 },
  );
});

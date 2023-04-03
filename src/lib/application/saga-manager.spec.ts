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

/* eslint-disable functional/no-classes,@typescript-eslint/no-explicit-any */
import test from 'ava';

import { Saga } from '../domain/saga';

import { ActionPublisher, ISagaManager, SagaManager } from './saga-manager';

function isNumber(x: any): x is number {
  return typeof x === 'number';
}

function isString(x: any): x is string {
  return typeof x === 'string';
}

const saga: Saga<number, number> = new Saga<number, number>((ar) => {
  if (isNumber(ar)) {
    return [ar];
  } else {
    return [];
  }
});

const saga2: Saga<string, string> = new Saga<string, string>((ar) => {
  if (isString(ar)) {
    return [ar];
  } else {
    return [];
  }
});

class ActionPublisherImpl implements ActionPublisher<number> {
  async publish(a: number): Promise<number> {
    return a;
  }

  async publishAll(aList: readonly number[]): Promise<readonly number[]> {
    return aList;
  }
}
const actionPublisher: ActionPublisher<number> = new ActionPublisherImpl();

class ActionPublisherImpl2 implements ActionPublisher<string> {
  async publish(a: string): Promise<string> {
    return a;
  }

  async publishAll(aList: readonly string[]): Promise<readonly string[]> {
    return aList;
  }
}
const actionPublisher2: ActionPublisher<string> = new ActionPublisherImpl2();

const sagaManager: ISagaManager<number, number> = new SagaManager<
  number,
  number
>(saga, actionPublisher);

const sagaManager2: ISagaManager<string, string> = new SagaManager<
  string,
  string
>(saga2, actionPublisher2);

class ActionPublisherImpl3 implements ActionPublisher<string | number> {
  async publish(a: string | number): Promise<string | number> {
    return a;
  }

  async publishAll(
    aList: readonly (string | number)[]
  ): Promise<readonly (string | number)[]> {
    return aList;
  }
}

const actionPublisher3: ActionPublisher<string | number> =
  new ActionPublisherImpl3();

const sagaManager3: ISagaManager<string | number, string | number> =
  new SagaManager<string | number, string | number>(
    saga.combine(saga2),
    actionPublisher3
  );

test('saga-handle', async (t) => {
  t.deepEqual(await sagaManager.handle(1), [1]);
});

test('saga2-handle', async (t) => {
  t.deepEqual(await sagaManager2.handle('Yin'), ['Yin']);
});

test('saga3-handle', async (t) => {
  t.deepEqual(await sagaManager3.handle('Yin'), ['Yin']);
});

test('saga4-handle', async (t) => {
  t.deepEqual(await sagaManager3.handle(1), [1]);
});

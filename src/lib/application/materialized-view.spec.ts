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

/* eslint-disable functional/no-classes,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */

import test from 'ava';

import { View } from '../domain/view';

import {
  IMaterializedLockingView,
  IMaterializedView,
  MaterializedLockingView,
  MaterializedView,
  ViewStateLockingRepository,
  ViewStateRepository,
} from './materialized-view';

function isNumber(x: any): x is number {
  return typeof x === 'number';
}

function isString(x: any): x is string {
  return typeof x === 'string';
}

const view: View<number, number> = new View<number, number>((s, e) => {
  if (isNumber(e)) {
    return s + e;
  } else {
    const _: never = e;
    console.log('Never just happened: ' + _);
    return s;
  }
}, 0);

const view2: View<string, string> = new View<string, string>((s, e) => {
  if (isString(e)) {
    return s.concat(e);
  } else {
    const _: never = e;
    console.log('Never just happened: ' + _);
    return s;
  }
}, '');

// eslint-disable-next-line functional/no-let
let storage: number | null = null;
// eslint-disable-next-line functional/no-let
let storage2: string | null = null;
// eslint-disable-next-line functional/no-let
let lockingStorage2: readonly [string | null, number | null] = [null, null];

class ViewStateRepositoryImpl implements ViewStateRepository<number, number> {
  async fetchState(_e: number): Promise<number | null> {
    return storage;
  }
  async save(s: number): Promise<number> {
    storage = s;
    return s;
  }
}

class ViewStateRepository2Impl implements ViewStateRepository<string, string> {
  async fetchState(_e: string): Promise<string | null> {
    return storage2;
  }
  async save(s: string): Promise<string> {
    storage2 = s;
    return s;
  }
}

class ViewStateLockingRepository2Impl
  implements ViewStateLockingRepository<string, string, number>
{
  async fetchState(
    _e: string
  ): Promise<readonly [string | null, number | null]> {
    return lockingStorage2;
  }
  async save(
    s: string,
    currentStateVersion: number | null
  ): Promise<readonly [string, number]> {
    const newVersion = (currentStateVersion ? currentStateVersion : 0) + 1;
    lockingStorage2 = [s, newVersion];
    return [s, newVersion];
  }
}

const repository: ViewStateRepository<number, number> =
  new ViewStateRepositoryImpl();

const repository2: ViewStateRepository<string, string> =
  new ViewStateRepository2Impl();

const repositoryLocking2: ViewStateLockingRepository<string, string, number> =
  new ViewStateLockingRepository2Impl();

const materializedView: IMaterializedView<number, number> =
  new MaterializedView<number, number>(view, repository);

const materializedView2: IMaterializedView<string, string> =
  new MaterializedView<string, string>(view2, repository2);

const materializedLockingView2: IMaterializedLockingView<
  string,
  string,
  number
> = new MaterializedLockingView<string, string, number>(
  view2,
  repositoryLocking2
);

test('view-handle', async (t) => {
  t.deepEqual(await materializedView.handle(1), 1);
});

test('view2-handle', async (t) => {
  t.deepEqual(await materializedView2.handle('Yin'), 'Yin');
});

test('view2-handle-locking', async (t) => {
  t.deepEqual(await materializedLockingView2.handle('Yin'), ['Yin', 1]);
  t.deepEqual(await materializedLockingView2.handle('Yun'), ['YinYun', 2]);
  t.deepEqual(await materializedLockingView2.handle('Yan'), ['YinYunYan', 3]);
});

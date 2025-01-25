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

export * from './lib/domain/view';
export * from './lib/domain/decider';
export * from './lib/domain/saga';
export * from './lib/application/eventsourcing-aggregate';
export * from './lib/application/statestored-aggregate';
export * from './lib/application/materialized-view';
export * from './lib/application/saga-manager';

/**
 * Identifier type - a simple type that represents an identifier.
 * For example, it can be used to identify the decider/aggregate/entity that the command is targeting or the event that is being processed.
 */
export type Identifier = {
  readonly id: string; // The ID of the decider/aggregate/entity that the command is targeting
};

---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Application

The only responsibility of the application layer is to orchestrate the execution of the logic by

- loading the state from a repository
- execute logic by executing domain layer components
- store the new state

Fmodel offers application interfaces/components which are actually composed out of repository interfaces/components (side effects) and core domain components (decision-making):

## Event-Sourced vs State-Stored

<Tabs groupId="system-type" queryString="system-type">
  <TabItem value="event-stored" label="Event-Stored / Event-Sourced">

Event-stored systems are split to command and view/query models, by default.
This is making a huge difference as we are not limited to use a single canonical model for writing and
reading/presenting!

![event-modeling-event-driven-systems](/img/event-modeling-event-driven-systems.png)

**Event-sourcing Aggregate** is a formalization of the event-stored/event-sourced system (Command
Model) [mentioned previously](architecture.md#event-stored-or-state-stored-systems).

```ts
interface IEventSourcingAggregate<C, S, E, V, CM, EM>
interface EventSourcingOrchestratingAggregate<C, S, E>
interface IMaterializedView<S, E, V, EM>
interface ISagaManager<AR, A, ARM, AM>
```

Event-sourcing Aggregate is using/delegating a `Decider` to handle commands and produce events. It belongs to the
Application layer. In order to
handle the command, aggregate needs to fetch the current state (represented as a list of events)
via `EventRepository.fetchEvents` function, and then delegate the command to the decider which can produce new events as
a result. Produced events are then stored via `EventRepository.save` suspending function.

```ts
/**
 * Event sourcing aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `IEventRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * Produced events are then stored via `IEventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 */
export interface IEventSourcingAggregate<C, S, E, V, CM, EM>
  extends IDecider<C, S, E>,
    IEventRepository<C, E, V, CM, EM> {
  /**
   * Handles the command of type `C`, and returns new persisted list of pairs of event and its version.
   *
   * @param command - Command of type `C` with Command Metadata
   * @return list of persisted events with Version and Event Metadata
   */
  readonly handle: (command: C & CM) => Promise<readonly (E & V & EM)[]>;
}

/**
 * Event sourcing orchestrating aggregate interface is using/delegating a `decider` of type `IDecider`<`C`, `S`, `E`> to handle commands and produce events.
 * In order to handle the command, aggregate needs to fetch the current state (represented as a list of events) via `IEventRepository.fetchEvents` function, and then delegate the command to the `decider` which can produce new event(s) as a result.
 *
 * If the `decider` is combined out of many deciders via `combine` function, an optional `EventSourcingOrchestratingAggregate.saga` could be used to react on new events and send new commands to the `decider` recursively, in one transaction.
 *
 * Produced events are then stored via `IEventRepository.save` function.
 *
 * @typeParam C - Commands of type `C` that this aggregate can handle
 * @typeParam S - Aggregate state of type `S`
 * @typeParam E - Events of type `E` that this aggregate can publish
 * @typeParam V - Version
 * @typeParam CM - Command Metadata
 * @typeParam EM - Event Metadata
 *
 */
export interface IEventSourcingOrchestratingAggregate<C, S, E, V, CM, EM>
  extends IEventSourcingAggregate<C, S, E, V, CM, EM>,
    ISaga<E, C> {}
```

<Tabs groupId="style" queryString="style">

  <TabItem value="monolith" label="monolith">

_Example of a monolith scenario, in which Order and Restaurant deciders
are [combined/aggregated](/domain/aggregating-the-behaviour.md?component-type=decider) in one big decider and then
wrapped by one aggregate component:_

```ts
const restaurantDecider: Decider<
  RestaurantCommand,
  Restaurant | null,
  RestaurantEvent
>;
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>;

class AggregateEventRepository
  implements
    IEventRepository<
      Command,
      Event,
      StreamVersion,
      CommandMetadata,
      EventMetadata
    > {
  // Implement the repository using the DB you find fit!
}

const eventRepository = new AggregateEventRepository();

const aggregate: ApplicationAggregate = new EventSourcingAggregate(
  restaurantDecider.combine(orderDecider),
  eventRepository
);

/**
 * Start handling all commands!
 */
const result = await aggregate.handle(command);
```

 </TabItem>

   <TabItem value="monolith-orchestrated" label="monolith orchestrated">

_Example of a monolith scenario, in which Order and Restaurant deciders
are [combined/aggregated](/domain/aggregating-the-behaviour.md?component-type=decider) in one big decider, additionally Order and Restaurant sagas are [combined](/domain/aggregating-the-behaviour.md?component-type=saga) into one orchestrating saga.
Decider and Saga are then wrapped by one aggregate component. Saga is responsible to integrate deciders internally, and enable event of one decider to trigger command of another, automatically_

:::info
Events produced by both deciders belong to the same transaction, and they are immediately consistent.
:::

```ts
const restaurantDecider: Decider<RestaurantCommand,Restaurant | null, RestaurantEvent>
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>
const restaurantSaga: Saga<OrderEvent, RestaurantCommand>
const orderSaga: Saga<RestaurantEvent, OrderCommand>

class AggregateEventRepository implements
  IEventRepository<
    Command,
    Event,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const eventRepository = new AggregateEventRepository ...

const aggregate: ApplicationAggregate = new EventSourcingOrchestratingAggregate(
        restaurantDecider.combine(orderDecider),
        eventRepository,
        restaurantSaga.combine(orderSaga),
      );

/**
 * Start handling all your commands, inculding Restaurant and Order!
 */
const result = await aggregate.handle(command)
```

   </TabItem>

  <TabItem value="distributed" label="distributed">

_Example of a distributed scenario, in which Order and Restaurant deciders are wrapped by independent aggregate
components:_

:::info
In distributed scenario, all aggregate components could be deployed as independent applications
:::

```ts
const restaurantDecider: Decider<RestaurantCommand, Restaurant | null, RestaurantEvent>
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>

class RestaurantAggregateEventRepository implements
  IEventRepository<
    RestaurantCommand,
    RestaurantEvent,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const restaurantEventRepository = new RestaurantAggregateEventRepository ...

class OrderAggregateEventRepository implements
  IEventRepository<
    OrderCommand,
    OrderEvent,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const orderEventRepository = new OrderAggregateEventRepository ...


const restaurantAggregate = new EventSourcingAggregate(
        restaurantDecider,
        restaurantEventRepository
      );

const orderAggregate = new EventSourcingAggregate(
        orderDecider,
        orderEventRepository
      );


/**
 * Start handling your Restaurant commands!
 */
const result1 = await restaurantAggregate.handle(restaurantCommand)

/**
 * Start handling your Order commands!
 */
const result2 = await orderAggregate.handle(orderCommand)
```

  </TabItem>

  <TabItem value="distributed-orchestrated" label="distributed orchestrated">

_Example of a distributed scenario, in which Order and Restaurant deciders are wrapped by independent aggregate
components, and Order and Restaurant sagas are combined into one Saga and wrapped by unique Saga Manager:_

:::info
In distributed scenario, all aggregate and saga manager component(s) could be deployed as independent applications, communicating over the wire.

In this scenario we have three components on the application layer that should communicate to each other over the wire:

- orderAggregate (app1)
- restaurantAggregate (app2)
- orchestratedSagaManager (app3)

The combined (orchestrating) `orchestratedSagaManager` will react on events (**over the wire**) produced by both aggregates and send commands (**over the wire**) to these aggregates.
:::

```ts
const restaurantDecider: Decider<RestaurantCommand, Restaurant | null, RestaurantEvent>
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>
const restaurantSaga: Saga<OrderEvent, RestaurantCommand>
const orderSaga: Saga<RestaurantEvent, OrderCommand>

class RestaurantAggregateEventRepository implements
  IEventRepository<
    RestaurantCommand,
    RestaurantEvent,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const restaurantEventRepository = new RestaurantAggregateEventRepository ...

class OrderAggregateEventRepository implements
  IEventRepository<
    OrderCommand,
    OrderEvent,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const orderEventRepository = new OrderAggregateEventRepository ...

const sagaPublisher = new ActionPublisher ...




const restaurantAggregate = new EventSourcingAggregate(
        restaurantDecider,
        restaurantEventRepository
      );

const orderAggregate = new EventSourcingAggregate(
        orderDecider,
        orderEventRepository
      );


/**
 * Start handling your Restaurant commands!
 */
const result1 = await restaurantAggregate.handle(restaurantCommand)

/**
 * Start handling your Order commands!
 */
const result2 = await orderAggregate.handle(orderCommand)

/**
 * Additionally, a single, orchestratig sagaManager is reacting on events from one aggregate and publishes command to the other.
 */
const orchestratedSagaManager = new SagaManager(
   restaurantSaga.combine(orderSaga),
   sagaPublisher
)
```

  </TabItem>

  <TabItem value="distributed-choreography" label="distributed choreography">

_Example of a distributed scenario, in which Order and Restaurant deciders are wrapped by independent aggregate
components, and Order and Restaurant sagas are wrapped by independent Saga managers:_

:::info
In distributed scenario, all aggregate and corresponding saga manager component(s) could be deployed as independent applications, communicating over the wire.

In this scenario we have four components on the application layer that should communicate to each other over the wire:

- orderAggregate (app1)
- orderSagaManager (app1)
- restaurantAggregate (app2)
- restaurantSagaManager (app2)

The `orderSagaManager / restaurantSagaManager` will react on events (**over the wire**) produced by aggregates and send commands (**locally**) to the appropriate aggregate(s).
:::

```ts
const restaurantDecider: Decider<RestaurantCommand, Restaurant | null, RestaurantEvent>
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>
const restaurantSaga: Saga<OrderEvent, RestaurantCommand>
const orderSaga: Saga<RestaurantEvent, OrderCommand>

class RestaurantAggregateEventRepository implements
  IEventRepository<
    RestaurantCommand,
    RestaurantEvent,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const restaurantEventRepository = new RestaurantAggregateEventRepository ...

class OrderAggregateEventRepository implements
  IEventRepository<
    OrderCommand,
    OrderEvent,
    StreamVersion,
    CommandMetadata,
    EventMetadata
  > {
   // Implement the repository using the DB you find fit!
  }

const orderEventRepository = new OrderAggregateEventRepository ...

const restaurantPublisher = new ActionPublisher ...
const orderPublisher = new ActionPublisher ...




const restaurantAggregate = new EventSourcingAggregate(
        restaurantDecider,
        restaurantEventRepository
      );

const orderAggregate = new EventSourcingAggregate(
        orderDecider,
        orderEventRepository
      );


/**
 * Start handling your Restaurant commands!
 */
const result1 = await restaurantAggregate.handle(restaurantCommand)

/**
 * Start handling your Order commands!
 */
const result2 = await orderAggregate.handle(orderCommand)

/**
 * Additionally, a independent, choreography sagaManagers are reacting on events from one aggregate and publishes command to the other.
 */
const restaurantSagaManager = new SagaManager(
   restaurantSaga,
   restaurantPublisher
)

const orderSagaManager = new SagaManager(
   orderSaga,
   orderPublisher
)
```

  </TabItem>
</Tabs>

**Materialized View** is a formalization of the event-stored/event-sourced system (View
Model) [mentioned previously](architecture.md#event-stored-or-state-stored-systems).

```ts
export interface IMaterializedView<S, E, V, EM>
  extends IView<S, E>,
    IViewStateRepository<E, S, V, EM>
```

Materialized view is using/delegating a `View` (domain component) to handle events of type `E` and to maintain a state
of denormalized projection(s) as a result.

<Tabs groupId="style" queryString="style">

  <TabItem value="monolith" label="monolith">

_Example of a monolith scenario, in which Order and Restaurant views
are [combined](/domain/aggregating-the-behaviour.md?component-type=view) in one big view and then wrapped by one
materialized-view component:_

```ts
const restaurantView: View<RestaurantView | null, RestaurantEvent>;
const orderView: View<OrderView | null, OrderEvent>;

const viewRepository: IViewStateRepository<
  RestaurantEvent | OrderEvent,
  ViewState,
  StreamVersion,
  EventMetadata
> = new DenoViewStateRepository(kv);

const materializedView: ApplicationMaterializedView = new MaterializedView(
  restaurantView.combine(orderView),
  viewRepository
);

// Handle the events of all types
const result = await materializedView.handle(event);
```

  </TabItem>
  <TabItem value="distributed" label="distributed">

_Example of a distributed scenario, in which Order and Restaurant views are wrapped by independent materialized-view
components:_

```ts
const restaurantView: View<RestaurantView | null, RestaurantEvent>;
const orderView: View<OrderView | null, OrderEvent>;

const restaurantViewRepository: IViewStateRepository<
  RestaurantEvent,
  RestaurantViewState,
  StreamVersion,
  EventMetadata
> = new DenoRestaurantViewStateRepository(kv);

const orderViewRepository: IViewStateRepository<
  OrderEvent,
  OrderViewState,
  StreamVersion,
  EventMetadata
> = new DenoOrderViewStateRepository(kv);

const restaurantMaterializedView = new MaterializedView(
  restaurantView,
  restaurantViewRepository
);

const orderMaterializedView = new MaterializedView(
  orderView,
  orderViewRepository
);

// Handle the restaurant events
const result1 = await restaurantMaterializedView.handle(event);
// Handle the order events
const result2 = await orderMaterializedView.handle(event);
```

  </TabItem>
</Tabs>

  </TabItem>

  <TabItem value="state-stored" label="State-Stored">

State-stored systems are using single canonical model for writing and reading/presenting, by default.

![event-modeling-traditional-systems](/img/event-modeling-traditional-systems.png)

**State-stored Aggregate** is a formalization of the state-stored
system [mentioned previously](architecture.md#event-stored-or-state-stored-systems).

```ts
export interface IStateStoredAggregate<C, S, E, V, CM, SM>
  extends IDecider<C, S, E>,
    IStateRepository<C, S, V, CM, SM> {
  readonly handle: (command: C & CM) => Promise<S & V & SM>;
}

export interface IStateStoredOrchestratingAggregate<C, S, E, V, CM, SM>
  extends IStateStoredAggregate<C, S, E, V, CM, SM>,
    ISaga<E, C> {}
```

State-stored Aggregate is using/delegating a `Decider` to handle commands and produce new state. It belongs to the
Application layer. In order to
handle the command, aggregate needs to fetch the current state via `StateRepository.fetchState` function first, and then
delegate the command to the decider which can produce new state as a result. New state is then stored
via `StateRepository.save` suspending function.

<Tabs groupId="style" queryString="style">

  <TabItem value="monolith" label="monolith">

_Example of a monolith scenario, in which Order and Restaurant deciders
are [combined/aggregated](/domain/aggregating-the-behaviour.md?component-type=decider) in one big decider and then
wrapped by one aggregate component:_

```ts
const restaurantDecider: Decider<
  RestaurantCommand,
  Restaurant | null,
  RestaurantEvent
>;
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>;

class AggregateStateRepository
  implements
    IStateRepository<
      Command,
      (Restaurant & Order) | null,
      StreamVersion,
      CommandMetadata,
      StateMetadata
    > {
  // Implement the repository using the DB you find fit!
}

const stateRepository = new AggregateStateRepository();

const aggregate: ApplicationAggregate = new StateStoredAggregate(
  restaurantDecider.combine(orderDecider),
  stateRepository
);

/**
 * Start handling all commands!
 */
const result = await aggregate.handle(command);
```

  </TabItem>

  <TabItem value="monolith-orchestrated" label="monolith orchestrated">

_Example of a monolith scenario, in which Order and Restaurant deciders
are [combined/aggregated](/domain/aggregating-the-behaviour.md?component-type=decider) in one big decider, additionally Order and Restaurant sagas are [combined](/domain/aggregating-the-behaviour.md?component-type=saga) into one orchestrating saga.
Decider and Saga are then wrapped by one aggregate component.
Saga is responsible to integrate deciders internally, and enable event of one decider to trigger command of another, automatically_

  </TabItem>

  <TabItem value="distributed" label="distributed">

_Example of a distributed scenario, in which Order and Restaurant deciders are wrapped by independent aggregate
components:_

```ts
const restaurantDecider: Decider<
  RestaurantCommand,
  Restaurant | null,
  RestaurantEvent
>;
const orderDecider: Decider<OrderCommand, Order | null, OrderEvent>;

class RestaurantAggregateStateRepository
  implements
    IStateRepository<
      RestaurantCommand,
      Restaurant | null,
      StreamVersion,
      CommandMetadata,
      StateMetadata
    > {
  // Implement the repository using the DB you find fit!
}

class OrdertAggregateStateRepository
  implements
    IStateRepository<
      OrderCommand,
      Order | null,
      StreamVersion,
      CommandMetadata,
      StateMetadata
    > {
  // Implement the repository using the DB you find fit!
}

const restaurantStateRepository = new RestaurantAggregateStateRepository();
const orderStateRepository = new OrderAggregateStateRepository();

const restaurantAggregate: ApplicationAggregate = new StateStoredAggregate(
  restaurantDecider,
  restaurantStateRepository
);

const orderAggregate: ApplicationAggregate = new StateStoredAggregate(
  orderDecider,
  orderStateRepository
);

/**
 * Start handling restaurant commands!
 */
const result1 = await restaurantAggregate.handle(command);
/**
 * Start handling order commands!
 */
const result2 = await orderAggregate.handle(command);
```

  </TabItem>
</Tabs>

 </TabItem>
</Tabs>

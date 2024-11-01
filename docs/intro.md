---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Intro

Domain modeling is a powerful tool for clarifying and refining our understanding of a subject area, and for identifying
opportunities for optimization and improvement. By carefully considering the needs of stakeholders and the nature of the
domain, it is possible to create effective and useful models that can facilitate communication and drive progress.

Fmodel aims to bring functional, algebraic and reactive domain modeling to TypeScript.

It is inspired by DDD, EventSourcing and Functional programming communities, yet implements these ideas and concepts in
idiomatic TypeScript, which in turn makes our code

- less error-prone,
- easier to understand,
- easier to test,
- type-safe and
- thread-safe.


**FModel promotes clear separation between data and behaviour**:

- Data
  - `Command` - An intent to change the state of the system
  - `Event` - The state change itself, a fact. It represents a decision that has already happened.
  - `State` - The current state of the system. It is evolved out of past events.
- Behaviour
  - `Decide` - A pure function that takes `command` and current `state` as parameters, and returns the flow of new `events`.
  - `Evolve` - A pure function that takes `event` and current `state` as parameters, and returns the new `state` of the system.
  - `React` - A pure function that takes `event` as parameter, and returns the flow of `commands`, deciding what to execute next.

**The focus is on implementing robust information systems (back-end)**:

- traditional - state-stored systems / storing the new `state` by overwriting the previous `state`.
- event-driven - event-sourced systems / storing the `events` in immutable storage by only appending.
- or you can have both flavors within your systems landscape, and easily transit from one to another 


## What you'll need

- [Node.js](https://nodejs.org/en/download/prebuilt-installer/current) or [Deno](https://deno.com/) runtime.

## Getting Started

Get started by **including dependencies**.


### NPM registry

Fmodel is published in [NPM registry](https://www.npmjs.com/package/@fraktalio/fmodel-ts), so you need to
enable it as a source of dependencies in your build.


### Include the dependencies

You're now ready to include Fmodel in your project.

<Tabs groupId="build" queryString="build-type">
<TabItem value="node" label="NPM">

package.json:
```ts
"dependencies": {
    "@fraktalio/fmodel-ts": "^2.1.1"
}
```

</TabItem>
<TabItem value="deno" label="Deno">


deno.json:
```ts
"imports": {
    "fmodel": "npm:@fraktalio/fmodel-ts@2.1.1"
  }
```

</TabItem>

</Tabs>

## Create a new application

You have great frameworks at your service to bootstrap development:

- [Deno](https://deno.com/) (check the [demo application (source code included)](https://github.com/fraktalio/fmodel-deno-demo))
- [Next.js](https://nextjs.org/) (check the [demo application](https://faccounting.fraktalio.com/))
- [Nest.js](https://nestjs.com/) (check the [demo application (source code included)](https://github.com/AxonIQ/giftcard-demo-ts))


:::info
Fmodel does not require usage of any framework whatsoever. It is completely up to you.
:::
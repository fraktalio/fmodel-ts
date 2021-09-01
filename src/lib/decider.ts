/* eslint-disable functional/no-this-expression */

/* eslint-disable functional/no-class */

export class _Decider<C, Si, So, Ei, Eo> {
  readonly decide: (c: C, s: Si) => readonly Eo[];
  readonly evolve: (s: Si, e: Ei) => So;
  readonly initialState: So;

  constructor(
    decide: (c: C, s: Si) => readonly Eo[],
    evolve: (s: Si, e: Ei) => So,
    initialState: So
  ) {
    this.decide = decide;
    this.evolve = evolve;
    this.initialState = initialState;
  }
}

export type Decider<C, S, E> = _Decider<C, S, S, E, E>;

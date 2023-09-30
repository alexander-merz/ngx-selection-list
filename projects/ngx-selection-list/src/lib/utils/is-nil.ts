type Nil = null | undefined;

export const isNil = (value: unknown): value is Nil => value == null;

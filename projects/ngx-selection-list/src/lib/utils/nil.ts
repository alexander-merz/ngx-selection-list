type Nil = null | undefined;

type NonNil<T> = T extends Nil ? never : T;

export const isNil = (value: unknown): value is Nil => value == null;

export const isNonNil = <T>(value: unknown): value is NonNil<T> => !isNil(value);

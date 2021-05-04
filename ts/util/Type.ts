export type AnyFunction = (...args: any[]) => any;
export type GetterOfOr<T> = T | (() => T);
export type ArrayOr<T> = T | T[];

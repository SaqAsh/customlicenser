export type Result<T, E = Error> = Success<T> | Failure<E>;

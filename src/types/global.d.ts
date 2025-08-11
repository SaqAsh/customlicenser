export { };

declare global {
  type Success<T> = [T, null];
  type Failure<E> = [null, E];
  type Result<T, E = Error> = Success<T> | Failure<E>;
}

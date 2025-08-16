export { };

declare global {
  function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>>;
}

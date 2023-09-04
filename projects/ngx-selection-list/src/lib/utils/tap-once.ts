import { defer, Observable, tap } from "rxjs";

export function tapOnce<T>(fn: (value: T) => void, options?: { withCondition: (value: T) => boolean }) {
  return (source$: Observable<T>): Observable<T> => {
    return defer(() => {
      let first = true;

      return source$.pipe(
        tap<T>((payload: T) => {
          if (first && (!options || options.withCondition(payload))) {
            fn(payload);
            first = false;
          }
        }),
      );
    });
  };
}

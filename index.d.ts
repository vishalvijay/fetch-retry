declare module 'any-fetch-retry' {
  type RequestDelayFunction = ((
    attempt: number,
    error: Error | null,
    response: Response | null
  ) => number);

  type RequestRetryOnFunction = ((
    attempt: number,
    error: Error | null,
    response: Response | null
  ) => boolean);

  interface IRequestInitWithRetry extends RequestInit {
    retries?: number;
    retryDelay?: number | RequestDelayFunction;
    retryOn?: number[] | RequestRetryOnFunction;
  }

  function fetchBuilder(fetch: (url: String, options?: RequestInit) => Promise<Response>): ((url: String, options?: IRequestInitWithRetry) => Promise<Response>);
  export = fetchBuilder;
}
// https://stackoverflow.com/questions/47914536/use-partial-in-nested-property-with-typescript
type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends Array<infer R> ? Array<DeepPartial<R>> : DeepPartial<T[K]>;
};

export { DeepPartial };

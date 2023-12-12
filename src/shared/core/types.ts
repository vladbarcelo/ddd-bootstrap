export type ExecutionContext = {
  requestId: string
}

export type ClassInstance = {
  constructor: {
    name: string
  }
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type DeepRequired<T> = {
  [K in keyof T]: Required<DeepRequired<T[K]>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Impossible<K extends keyof any> = {
  [P in K]: never
}

export type Opaque<T, K> = T & { __opaque: K };

export type GenericFile = {
  name: string
  buffer: Buffer
  contentType: string
  parsedExtension: string
}

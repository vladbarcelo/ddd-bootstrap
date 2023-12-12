import Koa from 'koa';
import { ExecutionContext, GenericFile } from 'src/shared/core/types';

export interface IHTTPContext {
  req: Koa.Request & { cookies: string[] }
  exCtx: ExecutionContext
  kCtx: Koa.Context
  cookies?: string[]
  data: Record<string, unknown>
}
export interface IHTTPController<_ReqT = unknown, ResT = unknown> {
  (req: unknown, res: unknown): unknown
  handle(ctx: IHTTPContext): Promise<ResT>
}

export interface IHTTPMiddleware {
  run(ctx: IHTTPContext): Promise<void>
}

export type RequestValidator = (request: unknown) => unknown

export type ResponseBase = {
  success: boolean
}

export type ErrorResponse = ResponseBase & {
  error: {
    alias: string
    message?: string
    trace?: string[]
  }
}

export type Response<DataT> =
  | {
      success: boolean
      data: DataT
    }
  | ErrorResponse

export type FileWrapper<FilesT extends Record<string, GenericFile | GenericFile[]>> = {
  files: FilesT
}

export type FileGetter<RequestT extends Record<string, unknown | Blob>> = {
  [k in keyof Omit<RequestT, 'data'>]: GenericFile
}

export enum ControllerState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

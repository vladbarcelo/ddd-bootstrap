/* eslint-disable no-param-reassign */
import { performance } from 'perf_hooks';
import { Readable } from 'stream';
import CallableInstance from 'callable-instance';
import Koa from 'koa';
import { IIDGenerator } from 'src/shared/pkg/id-generator/interface';
import { IAppLogger } from 'src/shared/pkg/logger/interface';
import { LoggerLevel } from 'src/shared/pkg/logger/types';
import { isDevEnvironment } from 'src/shared/utils/env';
import { parseError } from 'src/shared/utils/stacktrace';
import { serialize, CookieSerializeOptions } from 'cookie';
import { maskObjectFields } from 'src/shared/utils/mask';
import { sleep } from 'src/shared/utils/sleep';
import { GenericFile } from 'src/shared/core/types';
import {
  Response,
  ControllerState, IHTTPContext, IHTTPController, IHTTPMiddleware, ErrorResponse,
} from './types';
import { HTTPConfig } from './config';
import { ControllerInactiveError } from './errors';

export class BaseHTTPController<
  ResponseT,
  RequestT = null,
  DataT extends Record<string, unknown> = null,
  PathVarsT extends Record<string, string> = null,
  QueryT extends Record<string, (string|number)> = null
> extends CallableInstance<[], (ctx: unknown) => Promise<void>>
  implements IHTTPController<RequestT, ResponseT> {
  constructor(
    protected idGen: IIDGenerator,
    protected cfg: HTTPConfig,
    protected logger: IAppLogger,
  ) {
    super('handler');

    this.logger = logger.child('controller', this);
  }

  protected maskedRequestFields = ['password', 'newPassword', 'key']

  protected maskedHeaders = ['cookie', 'auth', 'apikey']

  private executionPerformanceThreshold = 2500

  protected middlewares: IHTTPMiddleware[] = []

  protected customResponse = false

  protected customStatus = false

  protected printLogResponse = true

  protected printLogRequest = true

  private activeRequests: Record<string, string> = {}

  private state = ControllerState.ACTIVE

  private checkControllerIsActive() {
    if (this.state !== ControllerState.ACTIVE) throw new ControllerInactiveError();
  }

  protected async handler(kCtx: Koa.Context): Promise<void> {
    const startTime = performance.now();
    const reqID = this.getRequestId();

    this.activeRequests[reqID] = kCtx.URL.toString();

    this.addRequestIDHeader(kCtx, reqID);

    const ctx = this.setContext(kCtx, reqID);
    let status = 200;
    let response: Response<ResponseT>;

    try {
      this.checkControllerIsActive();
      await this.runMiddlewares(ctx);
      this.logRequest(ctx);

      const data = await this.handle(ctx);

      if (ctx.cookies) {
        this.addCookieHeader(ctx);
      }

      response = this.customResponse ? data as Response<ResponseT> : this.createResponse(data);
    } catch (err) {
      response = this.createErrorResponse(err as Error, reqID);
      status = this.getErrorResponseStatus(err as Error, reqID);
    }

    this.logResponse(response, ctx);

    if (!this.customStatus) {
      kCtx.status = status;
    }

    kCtx.body = response;

    const endTime = performance.now();

    this.handlePerformanceData(startTime, endTime, reqID);

    delete this.activeRequests[reqID];
  }

  public handle(ctx: IHTTPContext): Promise<ResponseT> {
    throw new Error('Method not implemented.');
  }

  protected getRequestBody(ctx: IHTTPContext): RequestT {
    return ctx.req.body as RequestT;
  }

  protected getContextData(ctx: IHTTPContext): DataT {
    return ctx.data as DataT;
  }

  private variableCfg: Record<string, number> = {}

  protected getPathVariables(ctx: IHTTPContext): PathVarsT {
    return ctx.kCtx.params;
  }

  protected getHTTPParams(ctx: IHTTPContext): QueryT {
    return ctx.req.query as QueryT;
  }

  public setupVariable(variableName: string, pathIndex: number) {
    this.variableCfg[variableName] = pathIndex;
  }

  protected setCookie(
    ctx: IHTTPContext,
    name: string,
    value: string,
    options: CookieSerializeOptions = {},
  ) {
    const newCookie = serialize(name, value, options);

    if (ctx.cookies) {
      ctx.cookies.push(newCookie);
    } else {
      ctx.cookies = [newCookie];
    }
  }

  private addCookieHeader(ctx: IHTTPContext) {
    ctx.kCtx.set('Set-Cookie', ctx.cookies);
  }

  private addRequestIDHeader(
    context: Koa.Context,
    reqID: string,
  ) {
    context.set('X-Request-ID', reqID);
  }

  protected addMiddlewares(...middlewares: IHTTPMiddleware[]) {
    this.middlewares.push(...middlewares);
  }

  private async runMiddlewares(ctx: IHTTPContext): Promise<void> {
    for (const m of this.middlewares) {
      // eslint-disable-next-line no-await-in-loop
      await m.run(ctx);
    }
  }

  private getRequestId(): string {
    return this.idGen.generateID();
  }

  private setContext(kCtx: Koa.Context, requestId: string): IHTTPContext {
    return {
      req: kCtx.request as IHTTPContext['req'],
      kCtx,
      data: {},
      exCtx: {
        requestId,
      },
    };
  }

  private logRequest(ctx: IHTTPContext): void {
    if (this.logger.level() > LoggerLevel.Debug || !this.printLogRequest) return;

    const body = { ...this.getRequestBody(ctx) } as { data: unknown };
    let data = {};

    if (ctx.req.headers['content-type'] && ctx.req.headers['content-type'].match(/multipart\/form-data/ig)) {
      data = body.data;
    }

    const maskedBody = maskObjectFields(data, this.maskedRequestFields);
    const maskedHeaders = maskObjectFields(ctx.req.headers, this.maskedHeaders);

    this.logger.debug(
      {
        req: {
          url: ctx.req.url,
          method: ctx.req.method,
          headers: maskedHeaders,
          body: maskedBody,
        },
      },
      ctx.exCtx,
    );
  }

  private getParsedError(err: Error) {
    return parseError(err, this.logger);
  }

  private createErrorResponse(err: Error, reqId: string): ErrorResponse {
    const parsedError = this.getParsedError(err);
    const errBracketsPart = reqId;
    const errNamePart = `ERR_${err.constructor.name.replace(/Error$/, '').toUpperCase() || 'UNKNOWN'
    }`;
    let errMessagePart = err.message ? `: ${err.message}` : '';

    if (isDevEnvironment()) {
      errMessagePart += ` on ${parsedError.file.replace(/.*webpack:\//, '')}:${parsedError.line}`;
    }

    const data: ErrorResponse['error'] = {
      alias: errNamePart,
    };

    data.message = err.message;

    if (this.cfg.errors && this.cfg.errors[err.constructor.name]) {
      const errCfg = this.cfg.errors[err.constructor.name];

      if (errCfg.alias) {
        data.alias = errCfg.alias;
      }

      if (errCfg.message) {
        data.message = errCfg.message;
      }
    } else if (isDevEnvironment()) {
      data.message = `[${errBracketsPart}] ${errNamePart}${errMessagePart}`;

      const unfilteredTrace = parsedError.trace.map((t) => `${t.file}:${t.lineNumber}`);
      const filteredTrace = unfilteredTrace.filter((tr) => tr.match(/webpack/ig)).filter((tr) => !tr.match(/@babel/ig)).map((t) => t.replace(/.*webpack:\//, ''));

      data.trace = filteredTrace.length > 0 ? filteredTrace : unfilteredTrace;
    }

    return {
      success: false,
      error: data,
    };
  }

  private getErrorResponseStatus(err: Error, reqId: string) {
    let status = 500;
    const parsedError = this.getParsedError(err);

    if (this.cfg.errors && this.cfg.errors[err.constructor.name]) {
      status = this.cfg.errors[err.constructor.name].code;
    }

    if (status === 500) {
      this.logger.error({
        reqId,
        trace: parsedError.trace,
        err: { type: err.constructor.name, message: err.message },
      }, { requestId: reqId });
    }

    return status;
  }

  private createResponse(data: ResponseT): Response<ResponseT> {
    return {
      success: true,
      data,
    };
  }

  private logResponse(res: Response<ResponseT>, ctx: IHTTPContext): void {
    if (this.logger.level() > LoggerLevel.Debug || !this.printLogResponse) return;

    this.logger.debug({ res }, ctx.exCtx);
  }

  private handlePerformanceData(
    startTime: number,
    endTime: number,
    reqId: string,
  ): void {
    const executionTime = endTime - startTime;

    if (executionTime > this.executionPerformanceThreshold) {
      this.logger.warn(
        `Request ${reqId} is too slow: took ${executionTime}ms, max ${this.executionPerformanceThreshold}ms`,
      );
    }
  }

  protected createFileDownload(ctx: IHTTPContext, file: GenericFile): Readable {
    const readable = new Readable();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    readable._read = () => {};
    readable.push(file.buffer);
    readable.push(null);

    ctx.kCtx.set('Content-Type', file.contentType);
    ctx.kCtx.attachment(`${file.name}.${file.parsedExtension}`);

    return readable;
  }

  public async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.constructor.name}...`);

    this.state = ControllerState.INACTIVE;

    while (Object.keys(this.activeRequests).length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(100);
    }

    this.logger.info(`${this.constructor.name} shutdown completed`);
  }
}

import Bunyan from 'bunyan';
import PrettyStream from 'bunyan-prettystream';
import { getEnvironment } from '../../utils/env';
import { IAppLogger } from './interface';
import { LoggerLevel } from './types';
import { ClassInstance, ExecutionContext } from '../../core/types';

export class BunyanAppLogger implements IAppLogger {
  constructor(
    private isDevEnvironment: boolean,
    private appName: string,
    private identifier: string,
    private instance: Bunyan = null,
  ) {
    if (!instance) {
      this.createRootLogger();
    }
  }

  private createRootLogger(): void {
    const logLevel = (process.env.LOG_LEVEL as Bunyan.LogLevel)
      || (this.isDevEnvironment ? 'debug' : 'info');
    const appVersion = process.env.npm_package_version || 'x.x.x';
    const environmentName = getEnvironment();
    const logStreams: Bunyan.LoggerOptions['streams'] = [];

    const prettyStdOut = new PrettyStream({
      useColor: process.env.LOGS_USE_COLOR === 'true',
    });

    prettyStdOut.pipe(process.stdout);
    logStreams.push({
      level: logLevel,
      type: 'raw',
      stream: prettyStdOut,
    });

    if (process.env.LOG_FILE) {
      logStreams.push({
        path: process.env.LOG_FILE,
        type: 'rotating-file',
        period: '1d', // daily rotation
        count: 3, // keep 3 back copies
      });
    }

    this.instance = Bunyan.createLogger({
      name: `core-${environmentName}-${this.identifier}-${appVersion}`,
      level: logLevel,
      streams: logStreams,
      serializers: Bunyan.stdSerializers,
    });
    this.instance.debug('Core logger initialized.');
  }

  info(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext = null,
  ): void {
    this.instance.info(...(this.getFormattedMsg(msg, ctx) as []));
  }

  warn(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext = null,
  ): void {
    this.instance.warn(...(this.getFormattedMsg(msg, ctx) as []));
  }

  error(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext = null,
  ): void {
    this.instance.error(...(this.getFormattedMsg(msg, ctx) as []));
  }

  fatal(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext = null,
  ): void {
    this.instance.fatal(...(this.getFormattedMsg(msg, ctx) as []));
  }

  debug(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext = null,
  ): void {
    this.instance.debug(...(this.getFormattedMsg(msg, ctx) as []));
  }

  trace(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext = null,
  ): void {
    this.instance.trace(...(this.getFormattedMsg(msg, ctx) as []));
  }

  private getFormattedMsg(
    msg: string | Record<string, unknown>,
    ctx: ExecutionContext,
  ): unknown[] {
    let ctxData = ctx;

    if (ctx) {
      ctxData = {
        requestId: ctx.requestId,
      };
    }

    let formattedMsg: string;
    const maxLogSize = Number(process.env.MAX_LOG_SIZE) || 15000;

    if (typeof msg === 'object') {
      formattedMsg = JSON.stringify(msg, null, 2);
    } else {
      formattedMsg = String(msg);
    }

    if (formattedMsg.length > maxLogSize) {
      this.warn(
        `Log line too long: ${formattedMsg.length} vs ${maxLogSize} characters max`,
        ctxData,
      );
      formattedMsg = formattedMsg.substring(0, maxLogSize);
      formattedMsg += '...';
    }

    if (!ctxData) {
      return [formattedMsg];
    }

    return [ctxData, formattedMsg];
  }

  child(type: string, instance: ClassInstance): IAppLogger {
    const cfg = this.getChildOpts(type, instance);
    const child = this.instance.child(cfg);

    return new BunyanAppLogger(this.isDevEnvironment, this.appName, this.identifier, child);
  }

  private getChildOpts(
    type: string,
    instance: ClassInstance,
  ): { abstraction: string; class: string } {
    return {
      abstraction: type,
      class: instance.constructor.name,
    };
  }

  level(): LoggerLevel {
    return this.instance.level() as LoggerLevel;
  }
}

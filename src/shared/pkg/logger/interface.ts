import { ClassInstance, ExecutionContext } from '../../core/types';
import { LoggerLevel } from './types';

export interface IChildCfg {
  [key: string]: string
}

export interface IAppLogger {
  trace(msg: string | Record<string, unknown>, ctx?: ExecutionContext): void
  info(msg: string | Record<string, unknown>, ctx?: ExecutionContext): void
  warn(msg: string | Record<string, unknown>, ctx?: ExecutionContext): void
  error(msg: string | Record<string, unknown>, ctx?: ExecutionContext): void
  fatal(msg: string | Record<string, unknown>, ctx?: ExecutionContext): void
  debug(msg: string | Record<string, unknown>, ctx?: ExecutionContext): void
  child(type: string, instance: ClassInstance): IAppLogger
  level(): LoggerLevel
}

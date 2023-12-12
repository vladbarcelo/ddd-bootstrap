import { Logger } from 'typeorm';
import { IAppLogger } from '../../pkg/logger/interface';

export class TypeORMLogger implements Logger {
  constructor(private logger: IAppLogger) {
    this.logger = logger.child('orm', this);
  }

  private logLevelMapping: Record<string, 'debug' | 'warn' | 'error'> = {
    log: 'debug',
  }

  logQuery(
    query: string,
    parameters?: unknown[],
  ): void {
    this.logger.debug({ query, parameters });
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
  ): void {
    this.logger.error({
      error,
      query,
      parameters,
    });
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: unknown[],
  ): void {
    this.logger.warn({
      warnType: 'slow',
      time,
      query,
      parameters,
    });
  }

  logSchemaBuild(message: string): void {
    this.logger.debug({ message });
  }

  logMigration(message: string): void {
    this.logger.debug({ message });
  }

  log(
    level: 'log' | 'info' | 'warn',
    message: unknown,
  ): void {
    const fnName = this.logLevelMapping[level];

    this.logger[fnName]({ message });
  }
}

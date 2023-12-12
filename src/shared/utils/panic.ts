import { IAppLogger } from '../pkg/logger/interface';
import { parseError } from './stacktrace';

export async function panic(
  msg: string,
  err: Error,
  logger?: IAppLogger,
  code = 1,
  _graceful = true,
): Promise<void> {
  const stack = parseError(err, logger);

  const formattedMsg = `${msg}. Error ${err.message} at ${stack.file}: ${stack.line}. Trace: ${JSON.stringify(
    stack.trace,
  )}`;

  if (logger) {
    logger.fatal(formattedMsg);
  } else {
    process.stderr.write(`FATAL: ${formattedMsg}`);
  }

  // if (graceful) await global.gracefulShutdown('PANIC', alertSvc);

  process.exit(code);
}

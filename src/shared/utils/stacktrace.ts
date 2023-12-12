import * as stackTraceParser from 'stacktrace-parser';
import { IAppLogger } from '../pkg/logger/interface';

type ParsedErrorT = {
  file: string
  line: number
  column: number
  method: string
  args: string[]
  trace: stackTraceParser.StackFrame[]
}

export function parseError(err: Error, logger: IAppLogger): ParsedErrorT {
  let data: ParsedErrorT = {
    file: '',
    line: -1,
    column: -1,
    method: '',
    args: [],
    trace: [],
  };

  try {
    const trace = stackTraceParser.parse(err.stack);
    const lastTrace = trace[0];

    data = {
      file: lastTrace?.file,
      line: lastTrace?.lineNumber,
      column: lastTrace?.column,
      method: lastTrace?.methodName,
      args: lastTrace?.arguments,
      trace,
    };
  } catch (error) {
    logger.error(`Error parsing stack: ${error.constructor.name}: ${(error as Error)?.message}`);
  }

  return data;
}

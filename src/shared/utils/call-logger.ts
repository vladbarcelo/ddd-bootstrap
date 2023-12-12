/* eslint-disable no-param-reassign, func-names, sonarjs/cognitive-complexity, no-continue, @typescript-eslint/no-explicit-any, sonarjs/cognitive-complexity */
import { ClassInstance, ExecutionContext } from '../core/types';
import { IAppLogger } from '../pkg/logger/interface';

const getCircularReplacer = () => {
  const seen = new WeakSet();

  return (key: unknown, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }

      seen.add(value);
    }

    // eslint-disable-next-line consistent-return
    return value;
  };
};

export function getChildOpts(
  type: string,
  instance: ClassInstance,
): { abstraction: string; class: string } {
  return {
    abstraction: type,
    class: instance.constructor.name,
  };
}

export function LogAsyncCall(opts: {
  withCtx?: boolean
  withData?: boolean
  excludeDataIndices?: number[]
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    for (const prop of Object.getOwnPropertyNames(target)) {
      if (prop !== propertyKey) continue;

      const originalMethod = target[prop];

      if (originalMethod instanceof Function) {
        descriptor.value = async function (...args: unknown[]) {
          let msg = `Calling method ${propertyKey}`;
          // Remove first element as it is the request id
          const dataCopy = [...args];

          if (opts?.excludeDataIndices?.length) {
            for (const i of opts.excludeDataIndices) {
              dataCopy[i] = '*******';
            }
          }

          const ctx = opts?.withCtx ? (dataCopy.shift() as ExecutionContext) : null;

          if (args && opts?.withData) msg += ` with data ${JSON.stringify(dataCopy, getCircularReplacer())}`;

          (this as PropertyDescriptor & { logger: IAppLogger }).logger.trace(msg, ctx);

          return originalMethod.apply(this, args);
        };
      }
    }
  };
}

export function LogSyncCall(opts: {
  withCtx?: boolean
  withData?: boolean
  excludeDataIndices?: number[]
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    for (const prop of Object.getOwnPropertyNames(target)) {
      if (prop !== propertyKey) continue;

      const originalMethod = target[prop];

      if (originalMethod instanceof Function) {
        descriptor.value = function (...args: unknown[]) {
          let msg = `Calling method ${propertyKey}`;
          // Remove first element as it is the request id
          const dataCopy = [...args];

          if (opts?.excludeDataIndices?.length) {
            for (const i of opts.excludeDataIndices) {
              dataCopy[i] = '*******';
            }
          }

          const ctx = opts?.withCtx ? (dataCopy.shift() as ExecutionContext) : null;

          if (args && opts?.withData) msg += ` with data ${JSON.stringify(dataCopy, getCircularReplacer())}`;

          (this as PropertyDescriptor & { logger: IAppLogger }).logger.trace(msg, ctx);

          return originalMethod.apply(this, args);
        };
      }
    }
  };
}

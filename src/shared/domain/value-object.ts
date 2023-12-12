import { ZodError } from 'zod';
import {
  instanceToPlain, plainToClassFromExist,
} from 'class-transformer';
import {
  validateSync,
  ValidationError,
} from 'class-validator';
import { DomainValidationError } from '../core/errors';

type zod = { parse: CallableFunction }

function createFromFunction<T>(zod: zod) {
  return (v: unknown) => {
    try {
      return zod.parse(v) as T;
    } catch (err) {
      const zErr = err as ZodError;

      throw new DomainValidationError(
        `Error validating value ${v}: ${zErr.issues.map((i) => i.message).join(', ')}`,
      );
    }
  };
}

export function ValidatedString<T>(zod: {
  parse: CallableFunction;
}): {
  fromString(v: string): T;
  fromNumber(v: number): T;
} {
  const fromString = createFromFunction<T>(zod);

  return {
    fromString,
    fromNumber: (v: number) => fromString(String(v)),
  };
}

export function ValidatedNumber<T>(zod: {
  parse: CallableFunction;
}): {
  fromNumber(v: number): T;
  fromString(v: string): T
} {
  const fromNumber = createFromFunction<T>(zod);

  return {
    fromNumber,
    fromString: (v: string) => fromNumber(Number(v)),
  };
}

export function ValidatedBool<T>(zod: {
  parse: CallableFunction;
}): {
  fromBool(v: number): T;
  fromString(v: string): T
} {
  const fromBool = createFromFunction<T>(zod);

  return {
    fromBool,
    fromString: (v: string) => fromBool(Boolean(v)),
  };
}

export class GenericValueObject {
  from(data: Omit<this, 'from'|'fromPromise'>): this {
    if (!data || Object.keys(data).length === 0) return null;

    const instance = plainToClassFromExist(this, instanceToPlain(data), {
      excludeExtraneousValues: true,
    });

    const errors: ValidationError[] = validateSync(instance);

    if (errors.length) {
      const errMsg = `Error constructing ${this.constructor.name} from data ${JSON.stringify(data, null, 2)}: ${errors
        .map((e) => Object.values(e.constraints).map((v) => `prop ${v}`))
        .join(', ')}`;

      throw new DomainValidationError(errMsg);
    }

    Object.freeze(instance);

    return instance;
  }

  async fromPromise(dataPromise: Promise<Omit<this, 'from'|'fromPromise'>>): Promise<this> {
    return this.from({ ...await dataPromise });
  }
}

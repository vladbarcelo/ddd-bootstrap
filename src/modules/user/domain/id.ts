import { Opaque } from 'src/shared/core/types';
import { ValidatedNumber } from 'src/shared/domain/value-object';
import { z } from 'zod';

export type UserID = Opaque<number, 'UserID'>;
export const UserID = ValidatedNumber<UserID>(z.number().positive());

import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { GenericValueObject } from 'src/shared/domain/value-object';
import { UserID } from '../../id';

export class BalanceUpdatedEventData extends GenericValueObject {
  @Expose()
  @IsNotEmpty()
  id: UserID

  @Expose()
  @IsNotEmpty()
  newBalance: number
}

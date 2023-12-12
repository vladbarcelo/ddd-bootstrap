import { Expose } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class UserProps {
  @IsNumber()
  @IsPositive()
  @Expose()
  balance: number
}

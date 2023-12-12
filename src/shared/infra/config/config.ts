import { Expose } from 'class-transformer';
import { IsNotEmptyObject } from 'class-validator';
import { GenericValueObject } from '../../domain/value-object';
import { DBConfig } from '../database/config';
import { HTTPConfig } from '../http/config';

export class AppConfig extends GenericValueObject {
  @Expose()
  @IsNotEmptyObject()
  db: DBConfig

  @Expose()
  @IsNotEmptyObject()
  http: HTTPConfig
}

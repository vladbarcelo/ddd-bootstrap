import { IsNotEmpty, IsNotEmptyObject, IsNumber } from 'class-validator';

export class HTTPConfig {
  @IsNumber()
  @IsNotEmpty()
  port: number

  @IsNotEmptyObject()
  errors: {
    [errName: string]: {
      alias?: string
      code: number
      message?: string
    }
  }
}

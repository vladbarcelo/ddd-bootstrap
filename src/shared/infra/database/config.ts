import { IsNumber, IsString } from 'class-validator';

export class DBConfig {
  @IsString()
  username: string

  @IsString()
  host: string

  @IsString()
  database: string

  @IsString()
  password: string

  @IsNumber()
  port: number

  @IsNumber()
  connectionPoolSize: number
}

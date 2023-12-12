import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { GenericTypeORMModel } from '../types';

@Entity('users')
export class UserTypeORMModel implements GenericTypeORMModel<UserTypeORMModel> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  balance: number;

  preformat(): void {
    this.balance = Number(this.balance);
    this.id = Number(this.id);
  }
}

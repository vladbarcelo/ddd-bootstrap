import { v4 } from 'uuid';
import { IIDGenerator } from './interface';

export class UUIDGenerator implements IIDGenerator {
  generateID(): string {
    return v4();
  }
}

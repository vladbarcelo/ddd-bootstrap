import { v4 } from 'uuid';

export abstract class GenericDomainEvent<DataT> {
  constructor(public readonly name: string, public readonly data: DataT) {}

  public readonly id = v4()
}

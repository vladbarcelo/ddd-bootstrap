import { GenericDomainEvent } from 'src/shared/domain/event';
import {
  EntityManager,
} from 'typeorm';
import { ExecutionContext } from '../../core/types';

type UnitOfWork = {
  unitOfWork?: {
    manager: EntityManager
    txID: string
  }
}

export type ContextWithUnitOfWork = ExecutionContext & UnitOfWork

export type StrictContextWithUnitOfWork = ExecutionContext & Required<UnitOfWork>

export type GenericSearchDTO = {
  filter?: {
    [key: string]:
      | string
      | string[]
      | {
          from?: string
          to?: string
        }
  }
  limit?: number
  offset?: number
  query?: string
  order?: Record<string, 'ASC' | 'DESC' | 1 | -1>
}

export type GenericListType<Item> = {
  data: Item[]
  total: number
}

export type GenericTypeORMModel<Model> = Model & {
  preformat(): void
}

export type Transaction = {
  id: string
  promise: Promise<unknown>
  domainEvents: GenericDomainEvent<unknown>[]
}

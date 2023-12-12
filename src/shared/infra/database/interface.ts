import { DeepPartial, ExecutionContext } from 'src/shared/core/types';
import { GenericDomainEvent } from 'src/shared/domain/event';
import {
  SelectQueryBuilder, QueryRunner, FindOneOptions, FindManyOptions,
} from 'typeorm';
import { ContextWithUnitOfWork, StrictContextWithUnitOfWork } from './types';
import { UnitOfWorkOptions } from './unit-of-work';

export interface IPostgreSQLClient<Model> {
  findOne(
    ctx: ContextWithUnitOfWork,
    statement: FindOneOptions<Model>,
  ): Promise<Model>
  find(
    ctx: ContextWithUnitOfWork,
    statement?: FindManyOptions<Model>,
  ): Promise<Model[]>
  create(ctx: ContextWithUnitOfWork, data: DeepPartial<Model>): Promise<Model>
  save(ctx: ContextWithUnitOfWork, data: DeepPartial<Model>): Promise<void>
  count(
    ctx: ContextWithUnitOfWork,
    statement?: FindManyOptions<Model>,

  ): Promise<number>
  remove(ctx: ContextWithUnitOfWork, data: DeepPartial<Model>): Promise<void>
  delete(ctx: ContextWithUnitOfWork, where: DeepPartial<Model>): Promise<void>
  softRemove(ctx: ContextWithUnitOfWork, data: DeepPartial<Model>): Promise<void>
  softDelete(ctx: ContextWithUnitOfWork, where: DeepPartial<Model>): Promise<void>
  insert(
    ctx: ContextWithUnitOfWork,
    data: DeepPartial<Model> | DeepPartial<Model>[],
  ): Promise<void>
  update(
    ctx: ContextWithUnitOfWork,
    data: DeepPartial<Model>,
    where: DeepPartial<Record<keyof Model, unknown>>,
  ): Promise<void>
  disconnect(): Promise<void>
}

export interface ITypeORMSQLClient<Model> extends IPostgreSQLClient<Model> {
  createRawQueryBuilder(alias?: string, uctx?: ContextWithUnitOfWork): Promise<SelectQueryBuilder<unknown>>
  createQueryRunner(): Promise<QueryRunner>
}

export interface IUniversalPostgresClient {
  findOne<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    statement: FindOneOptions<Model>,
  ): Promise<Model | null>
  update<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    data: DeepPartial<Model>,
    where: DeepPartial<Model>,
  ): Promise<void>
  remove<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: DeepPartial<Model>): Promise<void>
  delete<Model>(uctx: ContextWithUnitOfWork, entity: unknown, where: DeepPartial<Model>): Promise<void>
  softRemove<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: DeepPartial<Model>): Promise<void>
  softDelete<Model>(uctx: ContextWithUnitOfWork, entity: unknown, where: DeepPartial<Model>): Promise<void>
  insert<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    data: DeepPartial<Model> | DeepPartial<Model>[],
  ): Promise<void>
  find<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    statement?: FindManyOptions<Model>,
  ): Promise<Model[]>
  create<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: DeepPartial<Model>): Promise<Model>
  save<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: DeepPartial<Model>): Promise<void>
  count<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    statement?: FindManyOptions<Model>,
  ): Promise<number>
  createQueryBuilder(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    alias: string,
  ): SelectQueryBuilder<unknown>
  createRawQueryBuilder(uctx: ContextWithUnitOfWork): Promise<SelectQueryBuilder<unknown>>
  createQueryRunner(uctx: ContextWithUnitOfWork): Promise<QueryRunner>
  runInTransaction<T>(ctx: ExecutionContext, fn: (uctx: StrictContextWithUnitOfWork) => Promise<T>, opts: UnitOfWorkOptions): Promise<T>;
  disconnect(): Promise<void>
  getMaxShutdownTimeMs(): number
  addDomainEventsToTX(txID: string, events: GenericDomainEvent<unknown>[]): void
}

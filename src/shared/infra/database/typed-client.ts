/* eslint-disable max-classes-per-file */
import {
  FindManyOptions, FindOneOptions, QueryRunner, SelectQueryBuilder,
} from 'typeorm';
import { IAppLogger } from 'src/shared/pkg/logger/interface';
import { LogAsyncCall } from 'src/shared/utils/call-logger';
import type {
  ITypeORMSQLClient,
  IUniversalPostgresClient,
} from './interface';
import { ContextWithUnitOfWork } from './types';

export class TypedPostgreSQLClient<T> implements ITypeORMSQLClient<T> {
  constructor(
    private readonly client: IUniversalPostgresClient,
    private readonly entity: unknown,
    private logger: IAppLogger,
  ) {
    this.logger = logger.child('client', this);
  }

  createQueryRunner(uctx?: ContextWithUnitOfWork): Promise<QueryRunner> {
    return this.client.createQueryRunner(uctx);
  }

  disconnect(): Promise<void> {
    return this.client.disconnect();
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async findOne(
    uctx: ContextWithUnitOfWork,
    statement: FindOneOptions<T>,
  ): Promise<T | null> {
    const data = await this.client.findOne(uctx, this.entity, statement);

    return data || null;
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async update(
    uctx: ContextWithUnitOfWork,
    where: Partial<T>,
    data: Partial<T>,
  ): Promise<void> {
    await this.client.update(uctx, this.entity, where, data);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async remove(uctx: ContextWithUnitOfWork, data: Partial<T>): Promise<void> {
    await this.client.remove(uctx, this.entity, data);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async delete(uctx: ContextWithUnitOfWork, where: Partial<T>): Promise<void> {
    await this.client.delete(uctx, this.entity, where);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async softRemove(uctx: ContextWithUnitOfWork, data: Partial<T>): Promise<void> {
    await this.client.softRemove(uctx, this.entity, data);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async softDelete(uctx: ContextWithUnitOfWork, where: Partial<T>): Promise<void> {
    await this.client.softDelete(uctx, this.entity, where);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async insert(
    uctx: ContextWithUnitOfWork,
    data: Partial<T> | Partial<T>[],
  ): Promise<void> {
    await this.client.insert(uctx, this.entity, data);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async find(
    uctx: ContextWithUnitOfWork,
    statement?: FindManyOptions<T>,
  ): Promise<T[]> {
    return this.client.find(uctx, this.entity, statement);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async save(uctx: ContextWithUnitOfWork, data: Partial<T>): Promise<void> {
    await this.client.create(uctx, this.entity, data);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  async create(uctx: ContextWithUnitOfWork, data: Partial<T>): Promise<T> {
    return this.client.create(uctx, this.entity, data);
  }

  @LogAsyncCall({ withCtx: true, withData: true })
  count(
    uctx: ContextWithUnitOfWork,
    statement?: FindManyOptions<T>,
  ): Promise<number> {
    return this.client.count(uctx, this.entity, statement);
  }

  createQueryBuilder(uctx: ContextWithUnitOfWork, alias: string): SelectQueryBuilder<unknown> {
    return this.client.createQueryBuilder(uctx, this.entity, alias);
  }

  createRawQueryBuilder(_alias?: string, uctx?: ContextWithUnitOfWork): Promise<SelectQueryBuilder<unknown>> {
    return this.client.createRawQueryBuilder(uctx);
  }
}

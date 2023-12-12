import { DeepPartial, ExecutionContext } from 'src/shared/core/types';
import { IAppLogger } from 'src/shared/pkg/logger/interface';
import { panic } from 'src/shared/utils/panic';
import { waitUntil } from 'src/shared/utils/wait';
import {
  Connection,
  createConnection,
  Repository,
  EntitySchema,
  FindOneOptions,
  FindManyOptions,
  SelectQueryBuilder,
  QueryRunner,
  EntityManager,
} from 'typeorm';
import { IEventListener } from 'src/shared/domain/event-listener';
import { IIDGenerator } from 'src/shared/pkg/id-generator/interface';
import { GenericDomainEvent } from 'src/shared/domain/event';
import { nop } from 'src/shared/utils/nop';
import entities from './models';
import { DBConfig } from './config';
import { IUniversalPostgresClient } from './interface';
import { TypeORMLogger } from './logger';
import {
  ContextWithUnitOfWork, GenericTypeORMModel, StrictContextWithUnitOfWork, Transaction,
} from './types';
import { UnitOfWorkOptions } from './unit-of-work';

export class BasePostgreSQLClient implements IUniversalPostgresClient {
  private connection: Connection

  public isConnected = false

  public connections: Record<string, Connection> = {}

  private transactions: Record<string, Transaction> = {}

  public queryRunners: Record<string, QueryRunner> = {}

  constructor(
    private readonly cfg: DBConfig,
    private readonly eventBus: IEventListener,
    private readonly idGen: IIDGenerator,
    private readonly logger: IAppLogger,
  ) {
    this.logger = logger.child('client', this);
    this.connectRepo();
  }

  addDomainEventsToTX(txID: string, events: GenericDomainEvent<unknown>[]): void {
    this.transactions[txID].domainEvents = this.transactions[txID].domainEvents.concat(events).filter((value, index, self) => index === self.findIndex((t) => (
      t.id === value.id
    )));
  }

  getMaxShutdownTimeMs(): number {
    return (Object.keys(this.connections).length + 1) * 1000;
  }

  public async runInTransaction<T>(ctx: ExecutionContext, fn: (uctx: StrictContextWithUnitOfWork) => Promise<T>, opts: UnitOfWorkOptions): Promise<T> {
    await this.waitForConnection();

    this.logger.debug('Starting transaction', ctx);

    const txConnection = this.connection;

    let mgr: EntityManager;
    let timeout: NodeJS.Timeout;

    const txID = this.idGen.generateID();

    const txPromise = txConnection.transaction<T>(opts.isolationLevel, async (manager) => {
      mgr = manager;

      return fn({
        ...ctx,
        unitOfWork: {
          manager,
          txID,
        },
      });
    });

    const tx: Transaction = {
      id: txID,
      promise: txPromise,
      domainEvents: [],
    };

    this.transactions[txID] = tx;

    txPromise.then(() => {
      this.logger.debug(`Transaction committed, pushing ${this.transactions[txID].domainEvents.length} domain events...`, ctx);
      this.transactions[txID].domainEvents.forEach((event) => {
        this.eventBus.emit(event);
      });

      this.transactions[txID].domainEvents = [];
    }).catch(nop);

    txPromise.finally(async () => {
      this.logger.debug('Releasing query manager resources', ctx);

      await mgr.release();
      clearTimeout(timeout);
      delete this.transactions[txID];

      this.logger.debug('TX cleanup done', ctx);
    }).catch(nop);

    timeout = setTimeout(async () => {
      this.logger.warn(`Releasing query manager resources on timeout: ${opts.maxExecutionTimeMs}ms passed`, ctx);

      await mgr.release();
      delete this.transactions[txID];

      const msg = `TX cleanup done on timeout: ${opts.maxExecutionTimeMs}ms max.`;

      this.logger.warn(msg, ctx);
    }, opts.maxExecutionTimeMs);

    return txPromise;
  }

  private async connectRepo() {
    this.connection = await this.createConnection();
  }

  async disconnect(): Promise<void> {
    this.logger.info('Closing db connections...');
    this.logger.info('Closing main connection...');

    await this.connection?.close();

    this.logger.info('Closing transaction connections...');

    await Promise.all(Object.entries(this.connections).map(([reqID, conn]) => {
      this.logger.info(`Closing connection for transaction request id ${reqID}`, { requestId: reqID });

      return conn.close();
    }));

    this.logger.info('Connections closed');
  }

  private async createConnection(name = 'default'): Promise<Connection> {
    let connection: Connection;

    try {
      connection = await createConnection({
        name,
        type: 'postgres',
        host: this.cfg.host,
        port: this.cfg.port,
        username: this.cfg.username,
        password: this.cfg.password,
        database: this.cfg.database,
        cache: false,
        maxQueryExecutionTime: 2000,
        extra: { max: this.cfg.connectionPoolSize },
        entities,
        logger: new TypeORMLogger(this.logger),
      });
      this.logger.debug(
        `Postgres connected to database ${this.cfg.database} on ${this.cfg.host}:${this.cfg.port}`,
      );
      this.isConnected = true;
    } catch (err) {
      panic(
        `Postgres failed to connect on ${this.cfg.host}:${this.cfg.port}: ${err}`,
        err as Error,
        this.logger,
      );
    }

    return connection;
  }

  private getRepo<Model = unknown>(entity: unknown, manager?: EntityManager): Repository<Model> {
    return manager ? manager.getRepository(entity as EntitySchema) : this.connection.getRepository(entity as EntitySchema);
  }

  private async waitForConnection() {
    await waitUntil(async () => this.isConnected === true);
  }

  async findOne<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    statement: FindOneOptions<Model>,
  ): Promise<Model | null> {
    await this.waitForConnection();

    const data: GenericTypeORMModel<Model> = await this.getRepo<GenericTypeORMModel<Model>>(entity, uctx?.unitOfWork?.manager).findOne(statement as FindOneOptions);

    data?.preformat();

    return data;
  }

  async update<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    data: Partial<Model>,
    where: Partial<Model>,
  ): Promise<void> {
    await this.waitForConnection();

    const filteredData = this.removeUndefinedFields(data);

    if (Object.keys(filteredData).length === 0) return;

    await this.getRepo(entity, uctx?.unitOfWork?.manager).update(where, filteredData);
  }

  async remove<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: Partial<Model>): Promise<void> {
    await this.waitForConnection();
    await this.getRepo(entity, uctx?.unitOfWork?.manager).remove(data);
  }

  async delete<Model>(uctx: ContextWithUnitOfWork, entity: unknown, where: Partial<Model>): Promise<void> {
    await this.waitForConnection();
    await this.getRepo(entity, uctx?.unitOfWork?.manager).delete(where);
  }

  async softRemove<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: Partial<Model>): Promise<void> {
    await this.waitForConnection();
    await this.getRepo(entity, uctx?.unitOfWork?.manager).softRemove(data);
  }

  async softDelete<Model>(uctx: ContextWithUnitOfWork, entity: unknown, where: Partial<Model>): Promise<void> {
    await this.waitForConnection();
    await this.getRepo(entity, uctx?.unitOfWork?.manager).softDelete(where);
  }

  async insert<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    data: Partial<Model> | Partial<Model>[],
  ): Promise<void> {
    await this.waitForConnection();
    await this.getRepo(entity, uctx?.unitOfWork?.manager).insert(data);
  }

  async find<Model>(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    statement?: FindManyOptions,
  ): Promise<Model[]> {
    await this.waitForConnection();

    const data = (await this.getRepo<GenericTypeORMModel<Model>>(entity, uctx?.unitOfWork?.manager).find(statement));

    data.forEach((d) => d.preformat());

    return data;
  }

  async save<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: Partial<Model>): Promise<void> {
    await this.waitForConnection();
    await this.getRepo(entity, uctx?.unitOfWork?.manager).create(data);
  }

  async create<Model>(uctx: ContextWithUnitOfWork, entity: unknown, data: DeepPartial<Model>): Promise<Model> {
    await this.waitForConnection();

    const newModel = this.getRepo(entity, uctx?.unitOfWork?.manager).create(data) as GenericTypeORMModel<Model> & {
      save(): Promise<unknown>
    };

    this.logger.debug(newModel);
    await this.getRepo(entity, uctx?.unitOfWork?.manager).save(newModel);
    newModel.preformat();

    return newModel;
  }

  async count(uctx: ContextWithUnitOfWork, entity: unknown, statement?: FindManyOptions): Promise<number> {
    await this.waitForConnection();

    return this.getRepo(entity, uctx?.unitOfWork?.manager).count(statement);
  }

  createQueryBuilder(
    uctx: ContextWithUnitOfWork,
    entity: unknown,
    alias?: string,
  ): SelectQueryBuilder<unknown> {
    return this.getRepo(entity, uctx?.unitOfWork?.manager).createQueryBuilder(alias);
  }

  async createRawQueryBuilder(uctx: ContextWithUnitOfWork): Promise<SelectQueryBuilder<unknown>> {
    await this.waitForConnection();

    return uctx?.unitOfWork?.manager ? uctx?.unitOfWork?.manager.createQueryBuilder() : this.connection.createQueryBuilder();
  }

  async createQueryRunner(uctx: ContextWithUnitOfWork): Promise<QueryRunner> {
    await this.waitForConnection();

    const qr = uctx?.unitOfWork?.manager ? uctx?.unitOfWork?.manager.connection.createQueryRunner() : this.connection.createQueryRunner();

    setTimeout(() => {
      if (!qr.isReleased) {
        this.logger.warn('Releasing query manager resource on timeout');
        qr.release();
      }
    }, 30 * 1000);

    return qr;
  }

  private removeUndefinedFields(
    dto: Record<string, unknown>,
  ): Record<string, unknown> {
    const res: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) res[key] = value;
    }

    return res;
  }
}

import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { GenericAggregateRoot } from 'src/shared/domain/aggregate-root';
import { GenericDomainEvent } from 'src/shared/domain/event';
import { IUniversalPostgresClient } from './interface';
import { ExecutionContext } from '../../core/types';
import { StrictContextWithUnitOfWork } from './types';

export type UnitOfWorkOptions = {
  maxExecutionTimeMs?: number;
  isolationLevel?: IsolationLevel;
}

export interface IUnitOfWorkHelper {
  runTransactional<T>(ctx: ExecutionContext, fn: (uctx: StrictContextWithUnitOfWork) => Promise<T>, opts: UnitOfWorkOptions): Promise<T>
}

export class UnitOfWorkHelper implements IUnitOfWorkHelper {
  constructor(
    private readonly client: IUniversalPostgresClient,
  ) {}

  runTransactional<T>(ctx: ExecutionContext, fn: (uctx: StrictContextWithUnitOfWork) => Promise<T>, opts: UnitOfWorkOptions): Promise<T> {
    const options = {
      isolationLevel: opts.isolationLevel || 'READ COMMITTED' as IsolationLevel,
      maxExecutionTimeMs: opts.maxExecutionTimeMs || 10 * 1000,
    };

    return this.client.runInTransaction<T>(ctx, fn, options);
  }

  markAggregatesForEventDispatch(uctx: StrictContextWithUnitOfWork, aggregates: GenericAggregateRoot<unknown, unknown>[]): void {
    let events: GenericDomainEvent<unknown>[] = [];

    for (const agg of aggregates) {
      events = events.concat(agg.getEventsToDispatch());
      agg.clearEventsToDispatch();
    }

    this.client.addDomainEventsToTX(uctx.unitOfWork.txID, events);
  }
}

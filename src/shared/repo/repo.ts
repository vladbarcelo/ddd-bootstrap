import { ITypeORMSQLClient } from '../infra/database/interface';
import { ContextWithUnitOfWork, StrictContextWithUnitOfWork } from '../infra/database/types';
import { IMapper } from '../mapper/interface';

export class GenericRepo<DomainModel, PersistenceModel extends { id: unknown }> {
  constructor(
    private readonly client: ITypeORMSQLClient<PersistenceModel>,
    private readonly mapper: IMapper<DomainModel, PersistenceModel>,
  ) {}

  async getByIDWithLock(ctx: StrictContextWithUnitOfWork, id: never): Promise<DomainModel> {
    const record = await this.client.findOne(ctx, { where: { id }, lock: { mode: 'pessimistic_write' } });

    return this.mapper.toDomain(record);
  }

  async save(ctx: ContextWithUnitOfWork, model: DomainModel): Promise<void> {
    const data = this.mapper.toPersistence(model);

    await this.client.update(ctx, data, { id: data.id });
  }
}

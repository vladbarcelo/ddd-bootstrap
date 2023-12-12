import { ExecutionContext } from 'src/shared/core/types';
import { ITypeORMSQLClient } from 'src/shared/infra/database/interface';
import { UserTypeORMModel } from 'src/shared/infra/database/models/user';
import { StrictContextWithUnitOfWork } from 'src/shared/infra/database/types';
import { UserID } from '../domain/id';
import { User } from '../domain/user';

export interface IUserRepo {
  getByIDWithLock(ctx: StrictContextWithUnitOfWork, id: UserID): Promise<User>
  save(ctx: ExecutionContext, user: User): Promise<void>
}

export type IUserPGClient = ITypeORMSQLClient<UserTypeORMModel>

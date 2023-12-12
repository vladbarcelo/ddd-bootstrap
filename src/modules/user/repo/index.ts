import { UserTypeORMModel } from 'src/shared/infra/database/models/user';
import { IMapper } from 'src/shared/mapper/interface';
import { GenericRepo } from 'src/shared/repo/repo';
import { User } from '../domain/user';
import { IUserPGClient, IUserRepo } from './interface';

export class UserRepo extends GenericRepo<User, UserTypeORMModel> implements IUserRepo {
  constructor(
    client: IUserPGClient,
    mapper: IMapper<User, UserTypeORMModel>,
  ) {
    super(client, mapper);
  }
}

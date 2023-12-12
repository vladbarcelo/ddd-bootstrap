import { UserTypeORMModel } from 'src/shared/infra/database/models/user';
import { IMapper } from 'src/shared/mapper/interface';
import { UserID } from '../domain/id';
import { User } from '../domain/user';

export class UserMapper implements IMapper<User, UserTypeORMModel> {
  toPersistence(model: User) {
    return {
      id: Number(model.id),
      balance: model.props.balance,
    };
  }

  toDomain(record: Partial<UserTypeORMModel>): User {
    return new User({
      balance: record.balance,
    }, UserID.fromNumber(record.id));
  }
}

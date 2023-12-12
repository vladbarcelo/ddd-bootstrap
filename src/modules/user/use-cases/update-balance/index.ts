import { ExecutionContext } from 'src/shared/core/types';
import { GenericCommandUseCaseResponse } from 'src/shared/core/use-case';
import { UnitOfWorkHelper } from 'src/shared/infra/database/unit-of-work';
import { UserID } from '../../domain/id';
import { IUserRepo } from '../../repo/interface';
import { IUserUpdateBalanceUC } from './interface';
import { UpdateBalanceUseCaseDTO } from './types';

export class UpdateBalanceUseCase implements IUserUpdateBalanceUC {
  constructor(
    private readonly repo: IUserRepo,
    private readonly uowh: UnitOfWorkHelper,
  ) {}

  async execute(ctx: ExecutionContext, request: UpdateBalanceUseCaseDTO): Promise<GenericCommandUseCaseResponse> {
    return this.uowh.runTransactional(ctx, async (uctx) => {
      const user = await this.repo.getByIDWithLock(uctx, UserID.fromNumber(request.userID));

      user.updateBalance(request.delta);

      await this.repo.save(uctx, user);

      this.uowh.markAggregatesForEventDispatch(uctx, [user]);
    }, { isolationLevel: 'REPEATABLE READ' });
  }
}

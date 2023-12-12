import { IUserUpdateBalanceUC } from 'src/modules/user/use-cases/update-balance/interface';
import { UpdateBalanceUseCaseDTO } from 'src/modules/user/use-cases/update-balance/types';
import { HTTPConfig } from 'src/shared/infra/http/config';
import { BaseHTTPController } from 'src/shared/infra/http/controller';
import { IHTTPContext } from 'src/shared/infra/http/types';
import { IIDGenerator } from 'src/shared/pkg/id-generator/interface';
import { IAppLogger } from 'src/shared/pkg/logger/interface';
import { UpdateUserBalanceControllerPathVars } from './pathvars';
import { UpdateUserBalanceControllerQuery } from './query';

export class UpdateUserBalanceController extends BaseHTTPController<
  void,
  null,
  null,
  UpdateUserBalanceControllerPathVars,
  UpdateUserBalanceControllerQuery
> {
  constructor(
    private readonly uc: IUserUpdateBalanceUC,
    protected idGen: IIDGenerator,
    protected cfg: HTTPConfig,
    protected logger: IAppLogger,

  ) {
    super(idGen, cfg, logger);
  }

  async handle(ctx: IHTTPContext): Promise<void> {
    const { id } = this.getPathVariables(ctx);
    const { amount } = this.getHTTPParams(ctx);
    const dto: UpdateBalanceUseCaseDTO = {
      userID: Number(id),
      delta: Number(amount),
    };

    await this.uc.execute(ctx.exCtx, dto);
  }
}

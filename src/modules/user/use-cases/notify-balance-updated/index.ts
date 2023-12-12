import CallableInstance from 'callable-instance';
import { ExecutionContext } from 'src/shared/core/types';
import { GenericCommandUseCaseResponse, IUseCase } from 'src/shared/core/use-case';
import { IAppLogger } from 'src/shared/pkg/logger/interface';
import { BalanceUpdatedEventData } from '../../domain/events/balance-updated/data';
import { NotifyBalanceUpdatedUseCaseResponse } from './types';

export class NotifyBalanceUpdatedUseCase extends CallableInstance<[], (ctx: unknown) => Promise<void>> implements IUseCase<BalanceUpdatedEventData, NotifyBalanceUpdatedUseCaseResponse> {
  constructor(
    private readonly logger: IAppLogger,
  ) {
    super('execute');
  }

  async execute(ctx: ExecutionContext, request?: BalanceUpdatedEventData): Promise<GenericCommandUseCaseResponse> {
    this.logger.info(`Balance updated for user ${request.id}. New balance: ${request.newBalance}`);
  }
}

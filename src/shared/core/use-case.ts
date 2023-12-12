import { ExecutionContext } from './types';

export interface IUseCase<IRequest, IResponse> {
  execute(ctx: ExecutionContext, request?: IRequest): Promise<IResponse>;
}

export type GenericCommandUseCaseResponse = void

import { IUseCase } from 'src/shared/core/use-case';
import { UpdateBalanceUseCaseDTO, UpdateBalanceUseCaseResponse } from './types';

export type IUserUpdateBalanceUC = IUseCase<UpdateBalanceUseCaseDTO, UpdateBalanceUseCaseResponse>

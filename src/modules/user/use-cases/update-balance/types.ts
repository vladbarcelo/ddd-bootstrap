import { GenericCommandUseCaseResponse } from 'src/shared/core/use-case';

export type UpdateBalanceUseCaseDTO = {
  userID: number,
  delta: number
}

export type UpdateBalanceUseCaseResponse = GenericCommandUseCaseResponse

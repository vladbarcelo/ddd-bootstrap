import { GenericDomainEvent } from 'src/shared/domain/event';
import { BalanceUpdatedEventData } from './data';

export class BalanceUpdatedEvent extends GenericDomainEvent<BalanceUpdatedEventData> {
  constructor(data: BalanceUpdatedEventData) {
    super(BalanceUpdatedEvent.eventName, data);
  }

  static eventName = 'user.balance.updated';
}

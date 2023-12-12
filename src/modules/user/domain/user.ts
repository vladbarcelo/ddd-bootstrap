import { GenericAggregateRoot } from 'src/shared/domain/aggregate-root';
import { InsufficientBalanceError } from './errors';
import { BalanceUpdatedEventData } from './events/balance-updated/data';
import { BalanceUpdatedEvent } from './events/balance-updated/event';
import { UserID } from './id';
import { UserProps } from './props';

export class User extends GenericAggregateRoot<UserProps, UserID> {
  get PropsClass() {
    return UserProps;
  }

  updateBalance(delta: number): void {
    if (this.props.balance + delta < 0) {
      throw new InsufficientBalanceError();
    }

    this.props.balance += delta;

    const evt = new BalanceUpdatedEvent(new BalanceUpdatedEventData().from({
      id: this.id,
      newBalance: this.props.balance,
    }));

    this.emitDomainEvent(evt);
  }
}

import { GenericEntity } from './entity';
import { GenericDomainEvent } from './event';

export abstract class GenericAggregateRoot<Props, ID> extends GenericEntity<Props, ID> {
  private eventsToDispatch: GenericDomainEvent<unknown>[] = []

  protected emitDomainEvent(evt: GenericDomainEvent<unknown>): void {
    this.eventsToDispatch.push(evt);
  }

  public getEventsToDispatch() {
    return this.eventsToDispatch;
  }

  public clearEventsToDispatch() {
    this.eventsToDispatch = [];
  }
}

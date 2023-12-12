import EventEmitter from 'events';
import { ExecutionContext } from '../core/types';
import { GenericDomainEvent } from './event';

export interface IEventListener {
  emit(event: GenericDomainEvent<unknown>): void
  subscribe<T>(event: string, callback: (ctx: ExecutionContext, data: T) => unknown): void
}

export class EventListenerBus implements IEventListener {
  private _emitter = new EventEmitter()

  emit(event: GenericDomainEvent<unknown>): void {
    this._emitter.emit(event.name, event.data);
  }

  subscribe<T>(event: string, callback: (ctx: ExecutionContext, data: T) => unknown): void {
    this._emitter.on(event, this.wrapCallback(callback));
  }

  private wrapCallback<T>(callback: (ctx: ExecutionContext, data: T) => unknown) {
    return (data: T) => callback({ requestId: null }, data);
  }
}

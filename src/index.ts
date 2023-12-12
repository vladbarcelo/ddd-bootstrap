require('dotenv').config();

import Router from '@koa/router';
import { v4 } from 'uuid';
import { BalanceUpdatedEvent } from './modules/user/domain/events/balance-updated/event';
import { bindUserControllers } from './modules/user/infra/http/binder';
import { UpdateUserBalanceController } from './modules/user/infra/http/controllers/update-balance/controller';
import { UserMapper } from './modules/user/mapper';
import { UserRepo } from './modules/user/repo';
import { NotifyBalanceUpdatedUseCase } from './modules/user/use-cases/notify-balance-updated';
import { UpdateBalanceUseCase } from './modules/user/use-cases/update-balance';
import { EventListenerBus } from './shared/domain/event-listener';
import { Config } from './shared/infra/config';
import { BasePostgreSQLClient } from './shared/infra/database/client-base';
import { UserTypeORMModel } from './shared/infra/database/models/user';
import { TypedPostgreSQLClient } from './shared/infra/database/typed-client';
import { UnitOfWorkHelper } from './shared/infra/database/unit-of-work';
import { HTTPServer } from './shared/infra/http/server';
import { UUIDGenerator } from './shared/pkg/id-generator/uuid';
import { BunyanAppLogger } from './shared/pkg/logger/bunyan';
import { isDevEnvironment } from './shared/utils/env';

const identifier = v4();
const logger = new BunyanAppLogger(isDevEnvironment(), 'core', identifier);

process.on('unhandledRejection', (error: Error) => {
  logger.warn(`Unhandled ${error?.constructor?.name}: ${error.message}`);
});

const config = new Config(logger).cfg;

const idGen = new UUIDGenerator();
const eventBus = new EventListenerBus();
const pgSQLClient = new BasePostgreSQLClient(config.db, eventBus, idGen, logger);
const uowh = new UnitOfWorkHelper(pgSQLClient);
const userPGClient = new TypedPostgreSQLClient<UserTypeORMModel>(pgSQLClient, UserTypeORMModel, logger);
const userMapper = new UserMapper();
const userRepo = new UserRepo(userPGClient, userMapper);
const updateUserBalanceUseCase = new UpdateBalanceUseCase(userRepo, uowh);
const notifyUserBalanceUpdatedUseCase = new NotifyBalanceUpdatedUseCase(logger);

eventBus.subscribe(BalanceUpdatedEvent.eventName, notifyUserBalanceUpdatedUseCase);

const updateUserBalanceController = new UpdateUserBalanceController(updateUserBalanceUseCase, idGen, config.http, logger);

const router = new Router();

bindUserControllers({ updateBalance: updateUserBalanceController }, router);

const server = new HTTPServer(router, config.http, logger);

server.start();

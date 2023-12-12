import { IAppLogger } from 'src/shared/pkg/logger/interface';
import Koa from 'koa';
import { Server } from 'http';
import BodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import Router from '@koa/router';
import { HTTPConfig } from './config';

export class HTTPServer {
  constructor(
    private readonly router: Router,
    private readonly cfg: HTTPConfig,
    private readonly logger: IAppLogger,
  ) {
    this.bootstrap();
  }

  private koa: Koa

  private server: Server

  private bootstrap() {
    this.koa = new Koa();
    this.koa.use(
      cors({
        origin: '*',
        credentials: true,
      }),
    );
    this.koa.use(BodyParser());

    this.koa.use(this.router.routes());
  }

  public start() {
    const port = this.cfg.port || 8080;

    this.server = this.koa.listen(port);

    this.logger.info(`Server started on ${JSON.stringify(this.server.address())}`);
  }

  public stop() {
    return new Promise<void>((resolve, reject) => {
      this.server?.close((err) => {
        this.logger.info('Shutting down webserver...');

        if (err) return reject(err);

        this.logger.info('Webserver shutdown completed');

        return resolve();
      });
    });
  }
}

import LoadedConfig from 'config';
import { IAppLogger } from 'src/shared/pkg/logger/interface';
import { panic } from 'src/shared/utils/panic';
import { AppConfig } from './config';

export class Config {
  constructor(private logger: IAppLogger) {
    this.bootstrap();
  }

  private bootstrap() {
    this.logger.info(`Loading config from ${process.env.NODE_CONFIG_DIR || './config'}`);

    try {
      this.cfg = new AppConfig().from(LoadedConfig as never);
    } catch (err) {
      panic(`Failed to load config: ${err}`, err as Error, this.logger);
    }

    this.logCfg();
    Object.freeze(this);
  }

  private maskedFields = ['serviceRole', 'privateKey', 'password', 'username', 'jwt', 'apiKey', 'rpcURL', 'token']

  private maskCfg(cfgPart: Record<string, unknown>): Record<string, unknown> {
    const part = cfgPart;

    Object.keys(part).forEach((key) => {
      if (typeof part[key] === 'object') {
        part[key] = this.maskCfg(part[key] as Record<string, unknown>);
      } else if (this.maskedFields.includes(key)) {
        part[key] = '*************';
      }
    });

    return part;
  }

  private logCfg() {
    const cfgClone = JSON.parse(JSON.stringify(this.cfg));
    const maskedCfg = this.maskCfg(cfgClone);

    this.logger.debug('Loaded config:');
    this.logger.debug(maskedCfg);
  }

  public cfg: AppConfig
}

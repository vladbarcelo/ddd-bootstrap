import { ClassConstructor, plainToClassFromExist } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';
import { v4 } from 'uuid';
import { DomainValidationError } from '../core/errors';

export abstract class GenericEntity<Props, ID> {
  public readonly props: Props

  public readonly id: ID

  constructor(props: Props, id?: ID) {
    this.props = this.validateProps(props);
    this.id = id || v4() as ID;
  }

  protected get PropsClass(): ClassConstructor<Props> {
    return null;
  }

  protected validateProps(props: Props): Props {
    const validatedProps = plainToClassFromExist(new this.PropsClass(), props, {
      excludeExtraneousValues: true,
    });
    const errors: ValidationError[] = validateSync(validatedProps as never);

    if (errors.length) {
      const errMsg = `Error constructing ${this.constructor.name} from data ${JSON.stringify(props, null, 2)}: ${errors
        .map((e) => Object.values(e.constraints).map((v) => `prop ${v}`))
        .join(', ')}`;

      throw new DomainValidationError(errMsg);
    }

    return validatedProps;
  }
}

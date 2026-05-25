import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    });

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints)
          : ['Valor invalido'];
        return {
          field: err.property,
          errors: constraints,
        };
      });

      this.logger.warn(
        `Validation failed: ${JSON.stringify(formattedErrors)}`,
      );

      throw new BadRequestException({
        message: 'Error de validacion',
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = Number(value);
    const isInteger = Number.isInteger(val);

    if (isNaN(val) || !isInteger || val <= 0) {
      throw new BadRequestException(
        `El identificador '${value}' no es válido. Debe ser un número entero positivo mayor a 0.`,
      );
    }

    return val;
  }
}

import { z } from 'zod';

export class PatientSchema {
  static patient = z.object({
    id: z
      .number()
      .int()
      .refine(
        (val) => {
          const length = val.toString().length;
          return length >= 7 && length <= 9;
        },
        {
          message: 'El DNI debe tener entre 7 y 9 dígitos',
        },
      ),
    name: z
      .array(
        z.object({
          family: z.string().min(2, 'Apellido muy corto'),
          given: z
            .array(z.string().min(1, 'Nombre muy corto'))
            .min(1, 'Debe tener al menos un nombre'),
        }),
      )
      .min(1, 'Debe tener al menos un nombre')
      .max(1, 'Solo se permite un objeto de nombre'),
    birthDate: z
      .string()
      .regex(
        /^\d{4}\/\d{2}\/\d{2}$/,
        'Formato de fecha inválido. Use YYYY/MM/DD',
      ),

    telecom: z
      .array(
        z.object({
          system: z.literal('phone'),
          value: z.string().refine(
            (val) => {
              const digitsOnly = val.replace(/\s+/g, '');
              return (
                /^\d+$/.test(digitsOnly) &&
                digitsOnly.length >= 6 &&
                digitsOnly.length <= 15
              );
            },
            {
              message:
                'El teléfono debe tener entre 6 y 15 dígitos numéricos (sin contar espacios)',
            },
          ),
        }),
      )
      .min(1, 'Debe tener al menos un teléfono')
      .max(1, 'Solo se permite un teléfono'),
  });
}

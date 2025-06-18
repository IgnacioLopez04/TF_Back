import { z } from 'zod';

export class PatientSchema {
  static patient = z.object({
    dni_paciente: z
      .string()
      .min(7, 'El DNI debe tener al menos 7 dígitos')
      .max(10),
    nombre_paciente: z.string().min(2, 'Nombre muy corto'),
    apellido_paciente: z.string().min(2, 'Apellido muy corto'),
    fecha_nacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    telefono: z.string().min(6).max(15),
  });
}

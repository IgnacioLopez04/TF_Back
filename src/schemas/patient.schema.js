import { z } from 'zod';

export class PatientSchema {
  static patient = z.object({
    dni_paciente: z.string().refine(
      (val) => {
        const length = val.length;
        return length >= 7 && length <= 9;
      },
      {
        message: 'El DNI debe tener entre 7 y 9 dígitos',
      },
    ),
    nombre_paciente: z.string().min(1, 'El nombre es requerido'),
    apellido_paciente: z.string().min(1, 'El apellido es requerido'),
    fecha_nacimiento: z.union([z.number(), z.string()]).optional(),
    telefono: z.union([z.number(), z.string()]).optional(),
    id_ciudad: z.string().optional(),
    barrio: z.string().optional(),
    calle: z.string().optional(),
    id_prestacion: z.string().optional(),
    piso_departamento: z.string().optional(),
  });
}

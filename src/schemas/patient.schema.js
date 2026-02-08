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
    numero: z.string().optional(),
    id_prestacion: z.string().optional(),
    piso_departamento: z.string().optional(),
    vive_con: z.string().optional(),
    id_mutual: z.union([z.number(), z.string()]).optional(),
    numero_afiliado: z
      .string()
      .max(25, 'El número de afiliado no puede superar los 25 caracteres')
      .optional(),
    ocupacion_actual: z.string().optional(),
    ocupacion_anterior: z.string().optional(),
    tutores: z
      .array(
        z.object({
          nombre: z.string().min(1, 'El nombre es requerido'),
          dni: z.string().min(1, 'El DNI es requerido'),
          fechaNacimiento: z.union([z.number(), z.string()]).optional(),
          lugarNacimiento: z.string().optional(),
          ocupacion: z.string().optional(),
          relacion: z.string().optional(),
          convive: z.boolean().optional(),
        }),
      )
      .optional(),
  });
}

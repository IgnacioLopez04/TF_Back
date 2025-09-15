import crypto from 'crypto';

/**
 * Genera un hash SHA-256 de una cadena de texto para usar como ID de paciente
 * Utiliza un salt desde las variables de entorno para mayor seguridad
 * @param {string} text - Texto a hashear (ej: nombre + apellido + fecha nacimiento)
 * @returns {string} Hash SHA-256 en formato hexadecimal (64 caracteres)
 */
export const createHashId = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('El texto debe ser una cadena no vacía');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256');
  hash.update(text + salt); // Concatenar texto con salt
  return hash.digest('hex');
};

/**
 * Limpia un hash_id eliminando caracteres no deseados como comillas dobles
 * @param {string} hashId - Hash ID a limpiar
 * @returns {string} - Hash ID limpio
 */
export const cleanHashId = (hashId) => {
  if (!hashId || typeof hashId !== 'string') {
    return hashId;
  }

  let cleaned = hashId
    .replace(/&quot;/g, '') // Comillas dobles codificadas HTML
    .trim();

  return cleaned;
};

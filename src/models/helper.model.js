import { pool } from '../configs/config';
import { InternalServerError } from '../errors/errors';

export class HelperModel {
  static async insertProvince({ id_provincia, nombre_provincia }) {
    try {
      await pool.query(
        'INSERT INTO provincia(id_provincia, nombre_provincia) VALUES($1,$2)',
        [id_provincia, nombre_provincia],
      );
    } catch (err) {
      throw new InternalServerError('Error al cargar la provincia');
    }
  }
  static async selectProvince({ id_provincia }) {
    try {
      const res = pool.query('SELECT * FROM provincia WHERE id_provincia=$1', [
        id_provincia,
      ]);
      return res.rows;
    } catch (err) {
      throw new InternalServerError('Error al obtener la provincia');
    }
  }

  static async insertCity({
    id_ciudad,
    nombre_ciudad,
    id_codigo_postal,
    id_provincia,
  }) {
    try {
      await pool.query(
        'INSERT INTO ciudad(id_ciudad, nombre_ciudad, id_codigo_postal, id_provincia) VALUES($1, $2, $3, $4)',
        [id_ciudad, nombre_ciudad, id_codigo_postal, id_provincia],
      );
    } catch (err) {
      throw new InternalServerError('Error al cargar la ciudad');
    }
  }

  static async selectCity(
    id_ciudad = null,
    id_provincia = null,
    id_codigo_postal = null,
  ) {
    if (id_provincia) {
      try {
        const res = pool.query('SELECT * FROM ciudad WHERE id_provincia=$1', [
          id_provincia,
        ]);
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar las ciudades');
      }
    }

    if (id_ciudad) {
      try {
        const res = pool.query('SELECT * FROM ciudad WHERE id_ciudad=$1', [
          id_ciudad,
        ]);
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar la ciudad');
      }
    }

    if (id_codigo_postal) {
      try {
        const res = pool.query(
          'SELECT * FROM ciudad WHERE id_codigo_postal=$1',
          [id_codigo_postal],
        );
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar las ciudades');
      }
    }
  }

  static async insertNeighborhood({ id_barrio, nombre_barrio, id_ciudad }) {
    try {
      await pool.query(
        'INSERT INTO barrio(id_barrio, nombre_barrio, id_ciudad)  VALUES($1, $2, $3)',
        [id_barrio, nombre_barrio, id_ciudad],
      );
    } catch (err) {
      throw new InternalServerError('Error al cargar el barrio');
    }
  }

  static async getNeighborhood(id_barrio = null, id_ciudad = null) {
    if (id_barrio) {
      try {
        const res = pool.query('SELECT * FROM barrio WHERE id_barrio=$1', [
          id_barrio,
        ]);
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar el barrio');
      }
    }

    if (id_ciudad) {
      try {
        const res = pool.query('SELECT * FROM barrio WHERE id_ciudad=$1', [
          id_ciudad,
        ]);
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar los barrios');
      }
    }
  }

  static async insertStreet({ id_calle, nombre_calle, id_barrio }) {
    try {
      await pool.query(
        'INSERT INTO calle(id_calle, nombre_calle, id_barrio)  VALUES($1, $2, $3)',
        [id_calle, nombre_calle, id_barrio],
      );
    } catch (err) {
      throw new InternalServerError('Error al cargar la calle');
    }
  }

  static async getStreet(id_calle = null, id_barrio = null) {
    if (id_calle) {
      try {
        const res = await pool.query('SELECT * FROM calle WHERE id_calle=$1', [
          id_calle,
        ]);
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar las calles');
      }
    }

    if (id_barrio) {
      try {
        const res = await pool.query('SELECT * FROM calle WHERE id_barrio=$1', [
          id_barrio,
        ]);
        return res.rows;
      } catch (err) {
        throw new InternalServerError('Error al consultar las calles');
      }
    }
  }

  static async insertZipCode({ id_codigo_postal }) {
    try {
      await pool.query(
        'INSERT INTO codigo_postal(id_codigo_postal) VALUES($1)',
        [id_codigo_postal],
      );
    } catch (err) {
      throw new InternalServerError('Error al cargar el código postal');
    }
  }
}

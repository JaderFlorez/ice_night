import { Sesion } from '../../dominio/sesion.js';
import { SesionRepositorio } from '../../dominio/repositorios.js';
import { SesionNoEncontrada } from '../../dominio/errores.js';

export class ObtenerSesion {
  constructor(private readonly sesionRepo: SesionRepositorio) {}

  async ejecutar(id: string): Promise<Sesion> {
    const sesion = await this.sesionRepo.findById(id);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }
    return sesion;
  }
}

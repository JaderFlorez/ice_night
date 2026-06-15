import { SesionRepositorio } from '../../dominio/repositorios.js';
import { SesionNoEncontrada, SesionYaCerrada } from '../../dominio/errores.js';

export class CerrarSesionSinItems {
  constructor(private readonly sesionRepo: SesionRepositorio) {}

  async ejecutar(id: string): Promise<void> {
    const sesion = await this.sesionRepo.findById(id);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }

    if (sesion.estado === 'cerrada') {
      throw new SesionYaCerrada();
    }

    await this.sesionRepo.cerrar(id, 0);
  }
}

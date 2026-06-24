import {
  SesionRepositorio,
  ItemSesionRepositorio,
} from '../../dominio/repositorios.js';
import {
  SesionNoEncontrada,
  SesionYaCerrada,
} from '../../dominio/errores.js';

export class EliminarConsumo {
  constructor(
    private readonly sesionRepo: SesionRepositorio,
    private readonly itemRepo: ItemSesionRepositorio,
  ) {}

  async ejecutar(sesionId: string, itemId: string): Promise<void> {
    const sesion = await this.sesionRepo.findById(sesionId);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }
    if (sesion.estado === 'cerrada') {
      throw new SesionYaCerrada();
    }

    await this.itemRepo.delete(itemId);
  }
}

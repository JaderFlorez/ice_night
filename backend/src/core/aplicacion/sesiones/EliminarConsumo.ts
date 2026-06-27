import { ItemSesionRepositorio, SesionRepositorio } from '../../dominio/repositorios.js';
import { SesionNoEncontrada, SesionYaCerrada } from '../../dominio/errores.js';

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

    const item = await this.itemRepo.findById(itemId);
    if (!item || item.sesion_id !== sesionId) {
      throw new Error('Consumo no encontrado');
    }

    await this.itemRepo.delete(itemId);
  }
}

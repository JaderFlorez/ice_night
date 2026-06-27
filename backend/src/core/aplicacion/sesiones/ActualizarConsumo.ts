import { ItemSesionRepositorio, SesionRepositorio } from '../../dominio/repositorios.js';
import { SesionNoEncontrada, SesionYaCerrada } from '../../dominio/errores.js';
import { ItemSesion } from '../../dominio/sesion.js';

export class ActualizarConsumo {
  constructor(
    private readonly sesionRepo: SesionRepositorio,
    private readonly itemRepo: ItemSesionRepositorio,
  ) {}

  async ejecutar(
    sesionId: string,
    itemId: string,
    cantidad: number,
  ): Promise<ItemSesion> {
    const sesion = await this.sesionRepo.findById(sesionId);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }
    if (sesion.estado === 'cerrada') {
      throw new SesionYaCerrada();
    }

    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new Error('Item no encontrado');
    }
    if (item.sesion_id !== sesionId) {
      throw new Error('Item no pertenece a esta sesión');
    }

    const subtotal = item.precio_unitario * cantidad;

    await this.itemRepo.update(itemId, { cantidad, subtotal });

    return {
      ...item,
      cantidad,
      subtotal,
    };
  }
}

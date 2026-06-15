import crypto from 'node:crypto';
import { ItemSesion } from '../../dominio/sesion.js';
import {
  SesionRepositorio,
  VarianteRepositorio,
  ItemSesionRepositorio,
} from '../../dominio/repositorios.js';
import {
  SesionNoEncontrada,
  SesionYaCerrada,
  VarianteNoEncontrada,
} from '../../dominio/errores.js';

export class AgregarConsumo {
  constructor(
    private readonly varianteRepo: VarianteRepositorio,
    private readonly sesionRepo: SesionRepositorio,
    private readonly itemRepo: ItemSesionRepositorio,
  ) {}

  async ejecutar(
    sesionId: string,
    varianteId: string,
    cantidad: number,
  ): Promise<ItemSesion> {
    const sesion = await this.sesionRepo.findById(sesionId);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }
    if (sesion.estado === 'cerrada') {
      throw new SesionYaCerrada();
    }

    const variante = await this.varianteRepo.findById(varianteId);
    if (!variante || !variante.activa) {
      throw new VarianteNoEncontrada();
    }

    const now = new Date().toISOString();
    const precio_unitario = Number(variante.precio);
    const subtotal = cantidad * precio_unitario;

    const item: ItemSesion = {
      id: crypto.randomUUID(),
      sesion_id: sesionId,
      variante_id: varianteId,
      cantidad,
      precio_unitario,
      subtotal,
      creado_en: now,
    };

    await this.itemRepo.save(item);
    return item;
  }
}

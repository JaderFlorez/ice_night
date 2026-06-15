import { Sesion, ItemSesion } from '../../dominio/sesion.js';
import {
  SesionRepositorio,
  ItemSesionRepositorio,
} from '../../dominio/repositorios.js';
import { SesionNoEncontrada } from '../../dominio/errores.js';

export interface CuentaResult {
  sesion: Sesion;
  items: ItemSesion[];
  total: number;
}

export class ObtenerCuenta {
  constructor(
    private readonly sesionRepo: SesionRepositorio,
    private readonly itemRepo: ItemSesionRepositorio,
  ) {}

  async ejecutar(sesionId: string): Promise<CuentaResult> {
    const sesion = await this.sesionRepo.findById(sesionId);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }

    const items = await this.itemRepo.findBySesion(sesionId);
    const total = items.reduce((acc, i) => acc + Number(i.subtotal), 0);

    return { sesion, items, total };
  }
}

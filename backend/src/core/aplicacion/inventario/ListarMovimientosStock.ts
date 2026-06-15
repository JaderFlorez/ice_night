import { MovimientoStockRepositorio } from '../../dominio/repositorios.js';
import { MovimientoStock } from '../../dominio/movimiento-stock.js';

export class ListarMovimientosStock {
  constructor(
    private readonly movimientoRepo: MovimientoStockRepositorio,
  ) {}

  async ejecutar(varianteId: string): Promise<MovimientoStock[]> {
    return this.movimientoRepo.findByVariante(varianteId);
  }
}

import { VarianteRepositorio } from '../../dominio/repositorios.js';
import { Variante } from '../../dominio/variante.js';

export class ListarVariantes {
  constructor(private readonly varianteRepo: VarianteRepositorio) {}

  async ejecutar(productoId: string): Promise<Variante[]> {
    return this.varianteRepo.findByProducto(productoId);
  }
}

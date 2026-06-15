import { CompraRepositorio } from '../../dominio/repositorios.js';
import { CompraConItems } from '../../dominio/compra.js';

export class ListarCompras {
  constructor(private readonly compraRepo: CompraRepositorio) {}

  async ejecutar(): Promise<CompraConItems[]> {
    return this.compraRepo.findAll();
  }
}

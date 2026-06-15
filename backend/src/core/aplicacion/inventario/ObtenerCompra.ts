import { CompraRepositorio } from '../../dominio/repositorios.js';
import { CompraConItems } from '../../dominio/compra.js';
import { CompraNoEncontrada } from '../../dominio/errores.js';

export class ObtenerCompra {
  constructor(private readonly compraRepo: CompraRepositorio) {}

  async ejecutar(id: string): Promise<CompraConItems> {
    const compra = await this.compraRepo.findById(id);
    if (!compra) {
      throw new CompraNoEncontrada();
    }
    return compra;
  }
}

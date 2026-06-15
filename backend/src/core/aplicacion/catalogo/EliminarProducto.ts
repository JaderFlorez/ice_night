import { ProductoRepositorio } from '../../dominio/repositorios.js';
import { ProductoNoEncontrado } from '../../dominio/errores.js';

export class EliminarProducto {
  constructor(private readonly productoRepo: ProductoRepositorio) {}

  async ejecutar(id: string): Promise<void> {
    const existe = await this.productoRepo.findById(id);
    if (!existe) throw new ProductoNoEncontrado();

    await this.productoRepo.delete(id);
  }
}

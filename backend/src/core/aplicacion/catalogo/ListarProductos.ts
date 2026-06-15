import { ProductoRepositorio } from '../../dominio/repositorios.js';
import { ProductoConVariantes } from '../../dominio/producto.js';

export class ListarProductos {
  constructor(private readonly productoRepo: ProductoRepositorio) {}

  async ejecutar(q?: string, categoria?: string): Promise<ProductoConVariantes[]> {
    return this.productoRepo.findAll(q, categoria);
  }
}

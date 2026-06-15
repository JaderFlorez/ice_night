import { ProductoRepositorio } from '../../dominio/repositorios.js';
import { ProductoConVariantes } from '../../dominio/producto.js';
import { ProductoNoEncontrado } from '../../dominio/errores.js';

export class ObtenerProducto {
  constructor(private readonly productoRepo: ProductoRepositorio) {}

  async ejecutar(id: string): Promise<ProductoConVariantes> {
    const producto = await this.productoRepo.findById(id);
    if (!producto) throw new ProductoNoEncontrado();
    return producto;
  }
}

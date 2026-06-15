import { ProductoRepositorio } from '../../dominio/repositorios.js';
import { ProductoNoEncontrado } from '../../dominio/errores.js';
import { Producto } from '../../dominio/producto.js';
import { ActualizarProductoDTO } from '../../../tipos/dto.js';

type ProductoKeys = keyof Producto;

const CAMPOS_PRODUCTO: Set<string> = new Set<ProductoKeys>([
  'nombre', 'descripcion', 'categoria', 'tiene_variantes',
]);

export class ActualizarProducto {
  constructor(private readonly productoRepo: ProductoRepositorio) {}

  async ejecutar(id: string, data: ActualizarProductoDTO): Promise<void> {
    const existe = await this.productoRepo.findById(id);
    if (!existe) throw new ProductoNoEncontrado();

    // Only pass Producto fields — filter out precio/stock (belong to variante)
    const datosProducto: Partial<Producto> = {};
    for (const [key, value] of Object.entries(data)) {
      if (CAMPOS_PRODUCTO.has(key)) {
        (datosProducto as Record<string, unknown>)[key] = value;
      }
    }

    if (Object.keys(datosProducto).length > 0) {
      await this.productoRepo.update(id, datosProducto);
    }
  }
}

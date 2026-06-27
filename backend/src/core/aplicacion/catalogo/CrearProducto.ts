import crypto from 'node:crypto';
import { ProductoRepositorio, VarianteRepositorio } from '../../dominio/repositorios.js';
import { Producto, Categoria } from '../../dominio/producto.js';
import { CrearProductoDTO } from '../../../tipos/dto.js';

export class CrearProducto {
  constructor(
    private readonly productoRepo: ProductoRepositorio,
    private readonly varianteRepo: VarianteRepositorio,
  ) {}

  async ejecutar(data: CrearProductoDTO): Promise<Producto> {
    const now = new Date().toISOString();
    const producto: Producto = {
      id: crypto.randomUUID(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      categoria: data.categoria as Categoria,
      tiene_variantes: data.tiene_variantes ?? false,
      activo: true,
      created_at: now,
    };

    await this.productoRepo.save(producto);

    // If the product does NOT have variants, auto-create "Único" variant
    if (!producto.tiene_variantes) {
      const sku = await this.generarSku(data.categoria);
      await this.varianteRepo.save({
        id: crypto.randomUUID(),
        producto_id: producto.id,
        nombre: 'Único',
        sku,
        precio: data.precio ?? 0,
        costo: data.costo ?? 0,
        stock: data.stock ?? 0,
        stock_minimo: 5,
        activa: true,
        created_at: now,
      });
    }

    return producto;
  }

  private async generarSku(categoria: string): Promise<string> {
    const prefijos: Record<string, string> = {
      cerveza: 'CER',
      vino: 'VIN',
      licor: 'LIC',
      whisky: 'WHI',
      vodka: 'VOD',
      ron: 'RON',
      granizado: 'GRA',
      energizante: 'ENE',
      gaseosa: 'GAS',
      agua: 'AGU',
      snack: 'SNA',
      otro: 'OTR',
    };
    const prefijo = prefijos[categoria] ?? 'GEN';
    const ultimo = await this.varianteRepo.findMaxSkuByPrefix(prefijo);
    if (!ultimo) return `${prefijo}-001`;

    const numero = parseInt(ultimo.split('-')[1], 10);
    const siguiente = numero + 1;
    return `${prefijo}-${String(siguiente).padStart(3, '0')}`;
  }
}

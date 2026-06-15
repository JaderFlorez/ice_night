import crypto from 'node:crypto';
import { VarianteRepositorio } from '../../dominio/repositorios.js';
import { Variante } from '../../dominio/variante.js';
import { CrearVarianteDTO } from '../../../tipos/dto.js';

export class CrearVariante {
  constructor(private readonly varianteRepo: VarianteRepositorio) {}

  async ejecutar(productoId: string, data: CrearVarianteDTO): Promise<Variante> {
    const variante: Variante = {
      id: crypto.randomUUID(),
      producto_id: productoId,
      nombre: data.nombre,
      sku: data.sku,
      precio: data.precio,
      costo: data.costo,
      stock: data.stock,
      stock_minimo: data.stock_minimo,
      activa: true,
      created_at: new Date().toISOString(),
    };

    await this.varianteRepo.save(variante);
    return variante;
  }
}

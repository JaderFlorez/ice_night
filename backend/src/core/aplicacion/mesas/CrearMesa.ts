import crypto from 'node:crypto';
import { Mesa } from '../../dominio/mesa.js';
import { MesaRepositorio } from '../../dominio/repositorios.js';
import { CrearMesaDTO } from '../../../tipos/dto.js';
import { ErrorDeDominio } from '../../dominio/errores.js';

export class CrearMesa {
  constructor(private readonly mesaRepo: MesaRepositorio) {}

  async ejecutar(data: CrearMesaDTO): Promise<Mesa> {
    const existente = await this.mesaRepo.findByNumero(data.numero);
    if (existente) {
      throw new ErrorDeDominio(
        `Ya existe una mesa con el número ${data.numero}`,
      );
    }

    const now = new Date().toISOString();
    const mesa: Mesa = {
      id: crypto.randomUUID(),
      numero: data.numero,
      capacidad: data.capacidad,
      ubicacion: data.ubicacion,
      activa: true,
      created_at: now,
    };

    await this.mesaRepo.save(mesa);
    return mesa;
  }
}

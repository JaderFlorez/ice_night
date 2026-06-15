import { Mesa } from '../../dominio/mesa.js';
import { MesaRepositorio } from '../../dominio/repositorios.js';
import { ActualizarMesaDTO } from '../../../tipos/dto.js';
import { MesaNoEncontrada, ErrorDeDominio } from '../../dominio/errores.js';

export class ActualizarMesa {
  constructor(private readonly mesaRepo: MesaRepositorio) {}

  async ejecutar(id: string, data: ActualizarMesaDTO): Promise<void> {
    const mesa = await this.mesaRepo.findById(id);
    if (!mesa) {
      throw new MesaNoEncontrada();
    }

    if (data.numero !== undefined && data.numero !== mesa.numero) {
      const existente = await this.mesaRepo.findByNumero(data.numero);
      if (existente) {
        throw new ErrorDeDominio(
          `Ya existe una mesa con el número ${data.numero}`,
        );
      }
    }

    await this.mesaRepo.update(id, data);
  }
}

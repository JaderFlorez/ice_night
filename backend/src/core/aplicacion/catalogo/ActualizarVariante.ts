import { VarianteRepositorio } from '../../dominio/repositorios.js';
import { VarianteNoEncontrada } from '../../dominio/errores.js';
import { ActualizarVarianteDTO } from '../../../tipos/dto.js';

export class ActualizarVariante {
  constructor(private readonly varianteRepo: VarianteRepositorio) {}

  async ejecutar(id: string, data: ActualizarVarianteDTO): Promise<void> {
    const existe = await this.varianteRepo.findById(id);
    if (!existe) throw new VarianteNoEncontrada();

    await this.varianteRepo.update(id, data);
  }
}

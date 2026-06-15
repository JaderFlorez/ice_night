import { VarianteRepositorio } from '../../dominio/repositorios.js';
import { VarianteNoEncontrada } from '../../dominio/errores.js';

export class EliminarVariante {
  constructor(private readonly varianteRepo: VarianteRepositorio) {}

  async ejecutar(id: string): Promise<void> {
    const existe = await this.varianteRepo.findById(id);
    if (!existe) throw new VarianteNoEncontrada();

    await this.varianteRepo.delete(id);
  }
}

import { MesaRepositorio } from '../../dominio/repositorios.js';
import { MesaNoEncontrada } from '../../dominio/errores.js';

export class EliminarMesa {
  constructor(private readonly mesaRepo: MesaRepositorio) {}

  async ejecutar(id: string): Promise<void> {
    const mesa = await this.mesaRepo.findById(id);
    if (!mesa) {
      throw new MesaNoEncontrada();
    }

    await this.mesaRepo.updateEstado(id, false);
  }
}

import { Mesa } from '../../dominio/mesa.js';
import { MesaRepositorio } from '../../dominio/repositorios.js';

export class ListarMesas {
  constructor(private readonly mesaRepo: MesaRepositorio) {}

  async ejecutar(): Promise<Mesa[]> {
    return this.mesaRepo.findAll();
  }
}

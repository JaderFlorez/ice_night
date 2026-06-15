import { Sesion } from '../../dominio/sesion.js';
import { SesionRepositorio } from '../../dominio/repositorios.js';

export class ListarSesionesActivas {
  constructor(private readonly sesionRepo: SesionRepositorio) {}

  async ejecutar(): Promise<Sesion[]> {
    return this.sesionRepo.findActivas();
  }
}

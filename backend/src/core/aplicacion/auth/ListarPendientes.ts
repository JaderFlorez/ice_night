import { UsuarioRepositorio } from '../../dominio/repositorios.js';
import { Usuario } from '../../dominio/usuario.js';

export class ListarPendientes {
  constructor(private readonly usuarioRepo: UsuarioRepositorio) {}

  async ejecutar(): Promise<Usuario[]> {
    return this.usuarioRepo.listPendientes();
  }
}

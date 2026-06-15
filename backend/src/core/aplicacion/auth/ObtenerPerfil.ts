import { UsuarioRepositorio } from '../../dominio/repositorios.js';
import { Usuario } from '../../dominio/usuario.js';
import { UsuarioNoEncontrado } from '../../dominio/errores.js';

export class ObtenerPerfil {
  constructor(private readonly usuarioRepo: UsuarioRepositorio) {}

  async ejecutar(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new UsuarioNoEncontrado();
    return usuario;
  }
}

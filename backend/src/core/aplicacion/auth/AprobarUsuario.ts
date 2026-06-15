import { UsuarioRepositorio } from '../../dominio/repositorios.js';
import { EstadoUsuario } from '../../dominio/usuario.js';
import { UsuarioNoEncontrado } from '../../dominio/errores.js';

export class AprobarUsuario {
  constructor(private readonly usuarioRepo: UsuarioRepositorio) {}

  async ejecutar(usuarioId: string, nuevoEstado: EstadoUsuario): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new UsuarioNoEncontrado();
    if (usuario.estado === nuevoEstado) return; // idempotente
    await this.usuarioRepo.updateEstado(usuarioId, nuevoEstado);
  }
}

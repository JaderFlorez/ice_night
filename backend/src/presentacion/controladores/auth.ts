import { FastifyRequest, FastifyReply } from 'fastify';
import { ObtenerPerfil } from '../../core/aplicacion/auth/ObtenerPerfil.js';
import { ListarPendientes } from '../../core/aplicacion/auth/ListarPendientes.js';
import { AprobarUsuario } from '../../core/aplicacion/auth/AprobarUsuario.js';
import { UsuarioRepositorioImpl } from '../../infraestructura/repositorios/usuario-repositorio.js';
import { AprobarUsuarioSchema } from '../../tipos/dto.js';
import { UsuarioNoEncontrado } from '../../core/dominio/errores.js';

const usuarioRepo = new UsuarioRepositorioImpl();
const obtenerPerfil = new ObtenerPerfil(usuarioRepo);
const listarPendientes = new ListarPendientes(usuarioRepo);
const aprobarUsuario = new AprobarUsuario(usuarioRepo);

export async function perfilHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const usuario = await obtenerPerfil.ejecutar(request.usuario!.id);
    return reply.send(usuario);
  } catch (error) {
    if (error instanceof UsuarioNoEncontrado) {
      return reply.status(404).send({ error: 'Perfil no encontrado' });
    }
    request.log.error(error, 'Error en perfilHandler');
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    });
  }
}

export async function listarPendientesHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const usuarios = await listarPendientes.ejecutar();
  return reply.send({ usuarios });
}

export async function aprobarUsuarioHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = AprobarUsuarioSchema.parse(request.body);

  try {
    await aprobarUsuario.ejecutar(id, body.estado);
    const mensaje =
      body.estado === 'activo'
        ? 'Usuario aprobado correctamente'
        : 'Usuario rechazado';
    return reply.send({ mensaje });
  } catch (error) {
    if (error instanceof UsuarioNoEncontrado) {
      return reply.status(404).send({ error: 'Usuario no encontrado' });
    }
    request.log.error(error, 'Error en aprobarUsuarioHandler');
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    });
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { MesaRepositorioImpl } from '../../infraestructura/repositorios/mesa-repositorio.js';
import { ListarMesas } from '../../core/aplicacion/mesas/ListarMesas.js';
import { CrearMesa } from '../../core/aplicacion/mesas/CrearMesa.js';
import { ActualizarMesa } from '../../core/aplicacion/mesas/ActualizarMesa.js';
import { EliminarMesa } from '../../core/aplicacion/mesas/EliminarMesa.js';
import {
  CrearMesaSchema,
  ActualizarMesaSchema,
} from '../../tipos/dto.js';
import { MesaNoEncontrada, ErrorDeDominio } from '../../core/dominio/errores.js';

const mesaRepo = new MesaRepositorioImpl();

const listarMesas = new ListarMesas(mesaRepo);
const crearMesa = new CrearMesa(mesaRepo);
const actualizarMesa = new ActualizarMesa(mesaRepo);
const eliminarMesa = new EliminarMesa(mesaRepo);

export async function listarMesasHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const mesas = await listarMesas.ejecutar();
    return reply.send({ data: mesas });
  } catch (error) {
    request.log.error(error, 'Error en listarMesasHandler');
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Error al listar mesas',
    });
  }
}

export async function crearMesaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = CrearMesaSchema.parse(request.body);
    const mesa = await crearMesa.ejecutar(body);
    return reply.status(201).send({ data: mesa });
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        detalles: error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      });
    }
    if (error instanceof ErrorDeDominio) {
      return reply.status(409).send({ error: error.message });
    }
    request.log.error(error, 'Error en crearMesaHandler');
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Error al crear mesa',
    });
  }
}

export async function actualizarMesaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const body = ActualizarMesaSchema.parse(request.body);
    await actualizarMesa.ejecutar(id, body);
    return reply.send({ mensaje: 'Mesa actualizada correctamente' });
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        detalles: error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      });
    }
    if (error instanceof MesaNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    if (error instanceof ErrorDeDominio) {
      return reply.status(409).send({ error: error.message });
    }
    request.log.error(error, 'Error en actualizarMesaHandler');
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Error al actualizar mesa',
    });
  }
}

export async function eliminarMesaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    await eliminarMesa.ejecutar(id);
    return reply.send({ mensaje: 'Mesa eliminada correctamente' });
  } catch (error) {
    if (error instanceof MesaNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    request.log.error(error, 'Error en eliminarMesaHandler');
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Error al eliminar mesa',
    });
  }
}

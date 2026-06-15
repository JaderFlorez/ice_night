import { FastifyRequest, FastifyReply } from 'fastify';
import { Pool } from 'pg';
import { MesaRepositorioImpl } from '../../infraestructura/repositorios/mesa-repositorio.js';
import { SesionRepositorioImpl } from '../../infraestructura/repositorios/sesion-repositorio.js';
import { ItemSesionRepositorioImpl } from '../../infraestructura/repositorios/item-sesion-repositorio.js';
import { VarianteRepositorioImpl } from '../../infraestructura/repositorios/variante-repositorio.js';
import { MovimientoStockRepositorioImpl } from '../../infraestructura/repositorios/movimiento-stock-repositorio.js';
import { getPool } from '../../infraestructura/db/pool.js';
import { AbrirSesion } from '../../core/aplicacion/sesiones/AbrirSesion.js';
import { ObtenerSesion } from '../../core/aplicacion/sesiones/ObtenerSesion.js';
import { ListarSesionesActivas } from '../../core/aplicacion/sesiones/ListarSesionesActivas.js';
import { AgregarConsumo } from '../../core/aplicacion/sesiones/AgregarConsumo.js';
import { ObtenerCuenta } from '../../core/aplicacion/sesiones/ObtenerCuenta.js';
import { CerrarSesion } from '../../core/aplicacion/sesiones/CerrarSesion.js';
import { AgregarItemSchema, CerrarSesionSchema } from '../../tipos/dto.js';
import {
  MesaNoEncontrada,
  MesaOcupada,
  SesionNoEncontrada,
  SesionYaCerrada,
  VarianteNoEncontrada,
  StockInsuficiente,
} from '../../core/dominio/errores.js';
import { ZodError } from 'zod';

// ─── Repositorios (lazy — no pool call at module level) ───
const mesaRepo = new MesaRepositorioImpl();
const sesionRepo = new SesionRepositorioImpl();
const itemRepo = new ItemSesionRepositorioImpl();
const varianteRepo = new VarianteRepositorioImpl();
const movimientoRepo = new MovimientoStockRepositorioImpl();

// ─── Casos de uso (no pool at module level) ───
const abrirSesion = new AbrirSesion(mesaRepo, sesionRepo);
const obtenerSesion = new ObtenerSesion(sesionRepo);
const listarSesionesActivas = new ListarSesionesActivas(sesionRepo);
const agregarConsumo = new AgregarConsumo(varianteRepo, sesionRepo, itemRepo);
const obtenerCuenta = new ObtenerCuenta(sesionRepo, itemRepo);

// Pool-dependent use case — lazy init
let _pool: Pool | null = null;
let _cerrarSesion: CerrarSesion | null = null;

function getCerrarSesionUc(): CerrarSesion {
  if (!_cerrarSesion) {
    _pool = getPool();
    _cerrarSesion = new CerrarSesion(
      _pool,
      sesionRepo,
      itemRepo,
      movimientoRepo,
    );
  }
  return _cerrarSesion;
}

// ─── Handlers ───

export async function abrirSesionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const sesion = await abrirSesion.ejecutar(id, request.usuario!.id);
    return reply.status(201).send({ data: sesion });
  } catch (error) {
    if (error instanceof MesaNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    if (error instanceof MesaOcupada) {
      return reply.status(409).send({ error: error.message });
    }
    throw error;
  }
}

export async function cerrarSesionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const body = CerrarSesionSchema.parse(request.body);
    await getCerrarSesionUc().ejecutar(id, body?.metodo_pago);
    return reply.send({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        detalles: error.errors.map((e) => e.message),
      });
    }
    if (error instanceof SesionNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    if (error instanceof SesionYaCerrada) {
      return reply.status(409).send({ error: error.message });
    }
    if (error instanceof StockInsuficiente) {
      return reply.status(409).send({ error: error.message });
    }
    throw error;
  }
}

export async function obtenerSesionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const sesion = await obtenerSesion.ejecutar(id);
    return reply.send({ data: sesion });
  } catch (error) {
    if (error instanceof SesionNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    throw error;
  }
}

export async function listarSesionesActivasHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const sesiones = await listarSesionesActivas.ejecutar();
  return reply.send({ data: sesiones });
}

export async function agregarConsumoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const body = AgregarItemSchema.parse(request.body);
    const item = await agregarConsumo.ejecutar(
      id,
      body.variante_id,
      body.cantidad,
    );
    return reply.status(201).send({ data: item });
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        detalles: error.errors.map((e) => e.message),
      });
    }
    if (error instanceof SesionNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    if (error instanceof SesionYaCerrada) {
      return reply.status(409).send({ error: error.message });
    }
    if (error instanceof VarianteNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    throw error;
  }
}

export async function obtenerCuentaHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const cuenta = await obtenerCuenta.ejecutar(id);
    return reply.send({ data: cuenta });
  } catch (error) {
    if (error instanceof SesionNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    throw error;
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { Pool } from 'pg';
import { CompraRepositorioImpl } from '../../infraestructura/repositorios/compra-repositorio.js';
import { VarianteRepositorioImpl } from '../../infraestructura/repositorios/variante-repositorio.js';
import { MovimientoStockRepositorioImpl } from '../../infraestructura/repositorios/movimiento-stock-repositorio.js';
import { getPool } from '../../infraestructura/db/pool.js';
import { ListarCompras } from '../../core/aplicacion/inventario/ListarCompras.js';
import { ObtenerCompra } from '../../core/aplicacion/inventario/ObtenerCompra.js';
import { RegistrarCompra } from '../../core/aplicacion/inventario/RegistrarCompra.js';
import { ListarMovimientosStock } from '../../core/aplicacion/inventario/ListarMovimientosStock.js';
import { ObtenerAlertasStock } from '../../core/aplicacion/inventario/ObtenerAlertasStock.js';
import { RegistrarCompraSchema } from '../../tipos/dto.js';
import {
  CompraNoEncontrada,
} from '../../core/dominio/errores.js';
import { ZodError } from 'zod';

// ─── Repositorios ───
const compraRepo = new CompraRepositorioImpl();
const varianteRepo = new VarianteRepositorioImpl();
const movimientoRepo = new MovimientoStockRepositorioImpl();

// ─── Casos de uso ───
const listarCompras = new ListarCompras(compraRepo);
const obtenerCompra = new ObtenerCompra(compraRepo);
const listarMovimientos = new ListarMovimientosStock(movimientoRepo);
const obtenerAlertas = new ObtenerAlertasStock();

// Pool-dependent use case — lazy init
let _pool: Pool | null = null;
let _registrarCompra: RegistrarCompra | null = null;

function getRegistrarCompraUc(): RegistrarCompra {
  if (!_registrarCompra) {
    _pool = getPool();
    _registrarCompra = new RegistrarCompra(_pool, varianteRepo, movimientoRepo);
  }
  return _registrarCompra;
}

// ─── Handlers ───

export async function listarComprasHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const compras = await listarCompras.ejecutar();
  return reply.send({ data: compras });
}

export async function obtenerCompraHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const compra = await obtenerCompra.ejecutar(id);
    return reply.send({ data: compra });
  } catch (error) {
    if (error instanceof CompraNoEncontrada) {
      return reply.status(404).send({ error: error.message });
    }
    throw error;
  }
}

export async function registrarCompraHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = RegistrarCompraSchema.parse(request.body);
    const compra = await getRegistrarCompraUc().ejecutar(body);
    return reply.status(201).send({ data: compra });
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        detalles: error.errors.map((e) => e.message),
      });
    }
    throw error;
  }
}

export async function listarMovimientosHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { variante_id } = request.query as { variante_id: string };
  if (!variante_id) {
    return reply.status(400).send({ error: 'variante_id es requerido' });
  }
  const movimientos = await listarMovimientos.ejecutar(variante_id);
  return reply.send({ data: movimientos });
}

export async function obtenerAlertasHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const alertas = await obtenerAlertas.ejecutar();
  return reply.send({ data: alertas });
}

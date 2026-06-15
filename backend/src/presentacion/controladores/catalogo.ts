import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductoRepositorioImpl } from '../../infraestructura/repositorios/producto-repositorio.js';
import { VarianteRepositorioImpl } from '../../infraestructura/repositorios/variante-repositorio.js';
import { ListarProductos } from '../../core/aplicacion/catalogo/ListarProductos.js';
import { ObtenerProducto } from '../../core/aplicacion/catalogo/ObtenerProducto.js';
import { CrearProducto } from '../../core/aplicacion/catalogo/CrearProducto.js';
import { ActualizarProducto } from '../../core/aplicacion/catalogo/ActualizarProducto.js';
import { EliminarProducto } from '../../core/aplicacion/catalogo/EliminarProducto.js';
import { ListarVariantes } from '../../core/aplicacion/catalogo/ListarVariantes.js';
import { CrearVariante } from '../../core/aplicacion/catalogo/CrearVariante.js';
import { ActualizarVariante } from '../../core/aplicacion/catalogo/ActualizarVariante.js';
import { EliminarVariante } from '../../core/aplicacion/catalogo/EliminarVariante.js';
import { SugerirSku } from '../../core/aplicacion/catalogo/SugerirSku.js';
import {
  CrearProductoSchema,
  ActualizarProductoSchema,
  CrearVarianteSchema,
  ActualizarVarianteSchema,
} from '../../tipos/dto.js';
import { ProductoNoEncontrado, VarianteNoEncontrada } from '../../core/dominio/errores.js';

const productoRepo = new ProductoRepositorioImpl();
const varianteRepo = new VarianteRepositorioImpl();

const listarProductos = new ListarProductos(productoRepo);
const obtenerProducto = new ObtenerProducto(productoRepo);
const crearProducto = new CrearProducto(productoRepo, varianteRepo);
const actualizarProducto = new ActualizarProducto(productoRepo);
const eliminarProducto = new EliminarProducto(productoRepo);
const listarVariantes = new ListarVariantes(varianteRepo);
const crearVariante = new CrearVariante(varianteRepo);
const actualizarVariante = new ActualizarVariante(varianteRepo);
const eliminarVariante = new EliminarVariante(varianteRepo);
const sugerirSku = new SugerirSku();

// ─── Productos ───

export async function listarProductosHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { q, categoria } = request.query as { q?: string; categoria?: string };
  const productos = await listarProductos.ejecutar(q, categoria);
  return reply.send({ data: productos });
}

export async function obtenerProductoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    const producto = await obtenerProducto.ejecutar(id);
    return reply.send({ data: producto });
  } catch (error) {
    if (error instanceof ProductoNoEncontrado) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }
    throw error;
  }
}

export async function crearProductoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = CrearProductoSchema.parse(request.body);
  const producto = await crearProducto.ejecutar(body);
  return reply.status(201).send({ data: producto });
}

export async function actualizarProductoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = ActualizarProductoSchema.parse(request.body);
  try {
    await actualizarProducto.ejecutar(id, body);
    return reply.send({ mensaje: 'Producto actualizado correctamente' });
  } catch (error) {
    if (error instanceof ProductoNoEncontrado) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }
    throw error;
  }
}

export async function eliminarProductoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    await eliminarProducto.ejecutar(id);
    return reply.send({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    if (error instanceof ProductoNoEncontrado) {
      return reply.status(404).send({ error: 'Producto no encontrado' });
    }
    throw error;
  }
}

// ─── Variantes ───

export async function listarVariantesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { productoId } = request.params as { productoId: string };
  const variantes = await listarVariantes.ejecutar(productoId);
  return reply.send({ data: variantes });
}

export async function crearVarianteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { productoId } = request.params as { productoId: string };
  const body = CrearVarianteSchema.parse(request.body);
  const variante = await crearVariante.ejecutar(productoId, body);
  return reply.status(201).send({ data: variante });
}

export async function actualizarVarianteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = ActualizarVarianteSchema.parse(request.body);
  try {
    await actualizarVariante.ejecutar(id, body);
    return reply.send({ mensaje: 'Variante actualizada correctamente' });
  } catch (error) {
    if (error instanceof VarianteNoEncontrada) {
      return reply.status(404).send({ error: 'Variante no encontrada' });
    }
    throw error;
  }
}

export async function eliminarVarianteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  try {
    await eliminarVariante.ejecutar(id);
    return reply.send({ mensaje: 'Variante eliminada correctamente' });
  } catch (error) {
    if (error instanceof VarianteNoEncontrada) {
      return reply.status(404).send({ error: 'Variante no encontrada' });
    }
    throw error;
  }
}

// ─── SKU ───

export async function sugerirSkuHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { categoria } = request.query as { categoria: string };
  const sku = await sugerirSku.ejecutar(categoria);
  return reply.send({ data: { sku } });
}

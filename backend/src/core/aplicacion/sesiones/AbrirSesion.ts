import crypto from 'node:crypto';
import { Sesion } from '../../dominio/sesion.js';
import { MesaRepositorio, SesionRepositorio } from '../../dominio/repositorios.js';
import { MesaNoEncontrada, MesaOcupada } from '../../dominio/errores.js';

export class AbrirSesion {
  constructor(
    private readonly mesaRepo: MesaRepositorio,
    private readonly sesionRepo: SesionRepositorio,
  ) {}

  async ejecutar(mesaId: string, meseroId: string): Promise<Sesion> {
    const mesa = await this.mesaRepo.findById(mesaId);
    if (!mesa) {
      throw new MesaNoEncontrada();
    }

    const abierta = await this.sesionRepo.findByMesaAbierta(mesaId);
    if (abierta) {
      throw new MesaOcupada(mesa.numero);
    }

    const now = new Date().toISOString();
    const sesion: Sesion = {
      id: crypto.randomUUID(),
      mesa_id: mesaId,
      mesero_id: meseroId,
      estado: 'abierta',
      abierta_en: now,
    };

    await this.sesionRepo.save(sesion);
    return sesion;
  }
}

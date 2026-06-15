export class ErrorDeDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeDominio';
  }
}

export class UsuarioNoEncontrado extends ErrorDeDominio {
  constructor() {
    super('Usuario no encontrado');
  }
}

export class EmailYaRegistrado extends ErrorDeDominio {
  constructor(email: string) {
    super(`El email ${email} ya está registrado`);
  }
}

export class StockInsuficiente extends ErrorDeDominio {
  constructor(sku: string, disponible: number, solicitado: number) {
    super(
      `Stock insuficiente para ${sku}: disponible ${disponible}, solicitado ${solicitado}`,
    );
  }
}

export class MesaNoEncontrada extends ErrorDeDominio {
  constructor() {
    super('Mesa no encontrada');
  }
}

export class SesionNoEncontrada extends ErrorDeDominio {
  constructor() {
    super('Sesión no encontrada');
  }
}

export class MesaOcupada extends ErrorDeDominio {
  constructor(numero: number) {
    super(`La mesa ${numero} ya tiene una sesión abierta`);
  }
}

export class SesionYaCerrada extends ErrorDeDominio {
  constructor() {
    super('La sesión ya está cerrada');
  }
}

export class UsuarioNoActivo extends ErrorDeDominio {
  constructor() {
    super(
      'Usuario no activo — esperando aprobación del administrador',
    );
  }
}

export class VarianteNoEncontrada extends ErrorDeDominio {
  constructor() {
    super('Variante no encontrada');
  }
}

export class ProductoNoEncontrado extends ErrorDeDominio {
  constructor() {
    super('Producto no encontrado');
  }
}

export class CompraNoEncontrada extends ErrorDeDominio {
  constructor() {
    super('Compra no encontrada');
  }
}

export interface Administrador {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  activo: boolean;
  fechaCreacion?: Date;
  password: string;
}

export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaRegistro?: Date;
  totalCompras?: number;
  activo: boolean;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  stock: number;
  imagen?: string;
  disponible: boolean;
}

export interface ProductoComprado {
  nombre: string;
  cantidad: number;
}

export interface Reporte {
  id: number;
  fechaGeneracion: string;        // ISO date
  periodoInicio: string;          // ISO date
  periodoFin: string;             // ISO date
  tipoReporte: 'POR_PRODUCTO' | 'POR_CLIENTE' | 'GENERAL';
  detalles: ReporteDetalle[];
}

export interface ReporteDetalle {
  // POR_CLIENTE
  clienteId?: number;
  nombreCliente?: string;
  totalUnidades?: number;
  productosComprados?: { nombre: string; cantidad: number }[];

  // POR_PRODUCTO
  productoId?: number;
  nombreProducto?: string;
  cantidadVendida?: number;
  stock?: number;
  precioUnitario?: number;
  categoria?: string;

  // GENERAL
  unidadesVendidasTotales?: number;
  totalGenerado?: number;
  numeroPedidos?: number;
  ticketPromedio?: number;
  metodoPago?: string;
}


export interface Repartidor {
  id?: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  vehiculo: string;
  licencia: string;
  disponible: boolean;
  pedidosEntregados?: number;
}

export interface Pedido {
  id?: number;
  clienteId: number;
  clienteNombre?: string;
  fecha: Date;
  estado: 'pendiente' | 'en preparación' | 'en camino' | 'entregado' | 'cancelado';
  productos: PedidoProducto[];
  repartidorId?: number;
  repartidorNombre?: string;
  total: number;
  direccionEntrega: string;
  metodoPago: string;
  notas?: string;
}

export interface PedidoProducto {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ExportRequest {
  entities: string[];
  format: 'csv'|'excel'|'json';
  includeHeaders: boolean;
  compress: boolean;
}

export interface ImportRequest {
  dataType: string;
  updateExisting: boolean;
  skipErrors: boolean;
  hasHeaders: boolean;
}

export interface BackupRequest {
  type: 'full'|'partial';
  entities: string[];
  description: string;
}



export interface RestoreRequest {
  backupId: number;
}

export interface BackupHistory {
  id: number;
  createdAt: string;
  type: 'full'|'partial';
  description: string;
  sizeBytes: number;
}

export interface Bitacora {
  id: number;
  timestamp: string;    // ISO string
  usuarioId: number;
  evento: string;
  detalle?: string;
}




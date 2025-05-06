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
  // Ventas | GENERAL
  metodoPago?: string;
  totalGenerado?: number;
  numeroPedidos?: number;
  ticketPromedio?: number;

  // Productos | GENERAL
  categoria?: string;
  unidadesVendidasTotales?: number;

  // POR_PRODUCTO
  nombreProducto?: string;
  stock?: number;           // coincide con tu DTO `stock`
  precioUnitario?: number;
  cantidadVendida?: number;

  // POR_CLIENTE
  nombreCliente?: string;
  totalUnidades?: number;   // si usas otro campo para esto
  productosComprados?: ProductoComprado[];
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




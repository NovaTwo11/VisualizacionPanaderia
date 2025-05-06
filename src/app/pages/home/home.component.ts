import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Subscription, interval } from "rxjs";
import { PedidoService } from "../../services/pedido.service";
import { ClienteService } from "../../services/cliente.service";
import { ProductoService } from "../../services/producto.service";

interface Notification {
  id: number;
  type: "order" | "client" | "product";
  title: string;
  message: string;
  time: Date;
}

interface Activity {
  id: number;
  type: "order" | "client" | "product";
  icon: string;
  title: string;
  description: string;
  time: Date;
  isNew: boolean;
}

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  imports: [CommonModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  // Resumen del dashboard
  summaryData = { productos: 0, clientes: 0, pedidosHoy: 0, ventasMensuales: 0 };

  // Contadores para notificaciones
  newProductsCount = 0;
  newClientsCount  = 0;
  newOrdersCount   = 0;

  // Flags para indicar si hay nuevos elementos
  hasNewProducts = false;
  hasNewClients  = false;
  hasNewOrders   = false;

  // Accesos rápidos
  quickAccess = [
    {
      title: "Productos",
      icon: "🍞",
      route: "/entidades/productos",
      description: "Gestione el inventario de productos",
    },
    {
      title: "Pedidos",
      icon: "🛒",
      route: "/transacciones/pedidos",
      description: "Administre los pedidos de clientes",
    },
    {
      title: "Clientes",
      icon: "👥",
      route: "/entidades/clientes",
      description: "Gestione la información de clientes",
    },
    {
      title: "Reportes",
      icon: "📊",
      route: "/reportes-consultas/ventas",
      description: "Visualice reportes y estadísticas",
    },
  ];

  // Notificaciones y actividades
  notifications: Notification[] = [];
  recentActivities: Activity[] = [];

  // **Propiedades para tus suscripciones** (no las inyectes en el constructor)
  private dataSubscription: Subscription | null = null;
  private eventSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService
  ) { }

  ngOnInit(): void {
    this.loadSummaryData();
    // Refrescar resumen cada 30s
    this.dataSubscription = interval(30000).subscribe(() => this.loadSummaryData());
  }

  ngOnDestroy(): void {
    // @ts-ignore
    this.dataSubscription.unsubscribe();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  dismissNotification(index: number): void {
    this.notifications.splice(index, 1);
  }

  private loadSummaryData(): void {
    // Obtener conteos de productos, clientes y pedidos
    this.productoService.countAll().subscribe(count => this.summaryData.productos = count);
    this.clienteService.countAll().subscribe(count => this.summaryData.clientes = count);
    this.pedidoService.countToday().subscribe(count => this.summaryData.pedidosHoy = count);
    this.pedidoService.sumMonthlySales().subscribe(total => this.summaryData.ventasMensuales = total);
  }

  /**
   * Agrega una nueva actividad y genera su notificación asociada.
   */
  private addNewActivity(
    type: "order" | "client" | "product",
    title: string,
    description: string
  ): void {
    const icons = { order: "🛒", client: "👥", product: "🍞" };
    const now = new Date();
    const id = now.getTime();

    // Crear actividad
    const activity: Activity = { id, type, icon: icons[type], title, description, time: now, isNew: true };
    this.recentActivities.unshift(activity);
    // Limitar a 3
    if (this.recentActivities.length > 3) this.recentActivities.pop();

    // Contadores
    switch (type) {
      case 'order': this.newOrdersCount++; break;
      case 'client': this.newClientsCount++; break;
      case 'product': this.newProductsCount++; break;
    }

    // Crear notificación
    const notification: Notification = { id, type, title, message: description, time: now };
    this.notifications.unshift(notification);
    if (this.notifications.length > 5) this.notifications.pop();

    // Quitar flag de nueva actividad
    setTimeout(() => {
      const idx = this.recentActivities.findIndex(a => a.id === id);
      if (idx >= 0) this.recentActivities[idx].isNew = false;
    }, 5000);
  }

  // Ejemplo de uso: suscribir a eventos reales desde el backend
  private subscribeToBackendEvents(): void {
    // Supongamos que el servicio emite observables de eventos en tiempo real
    this.pedidoService.onNewOrder().subscribe(order => {
      this.addNewActivity('order', 'Nuevo Pedido', `Pedido #${order.id} - Total: $${order.total}`);
    });
    this.clienteService.onNewClient().subscribe(client => {
      this.addNewActivity('client', 'Nuevo Cliente', `Cliente: ${client.nombre}`);
    });
    this.productoService.onNewProduct().subscribe(product => {
      this.addNewActivity('product', 'Nuevo Producto', `Producto: ${product.nombre}`);
    });
  }

  /**
   * Marca las notificaciones de productos como leídas.
   */
  clearNewProducts(): void {
    this.newProductsCount = 0;
    this.hasNewProducts = false;
  }

  /**
   * Marca las notificaciones de clientes como leídas.
   */
  clearNewClients(): void {
    this.newClientsCount = 0;
    this.hasNewClients = false;
  }

  /**
   * Marca las notificaciones de pedidos como leídas.
   */
  clearNewOrders(): void {
    this.newOrdersCount = 0;
    this.hasNewOrders = false;
  }
}

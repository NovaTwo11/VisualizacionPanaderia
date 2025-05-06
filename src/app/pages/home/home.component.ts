import { Component, OnInit } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class HomeComponent implements OnInit {
  // Datos de resumen para el dashboard
  summaryData = {
    productos: 125,
    clientes: 350,
    pedidosHoy: 45,
    ventasMensuales: 5280
  };

  // Accesos rápidos
  quickAccess = [
    { title: 'Productos', icon: '🍞', route: '/entidades/productos', description: 'Gestione el inventario de productos' },
    { title: 'Pedidos', icon: '🛒', route: '/transacciones/pedidos', description: 'Administre los pedidos de clientes' },
    { title: 'Clientes', icon: '👥', route: '/entidades/clientes', description: 'Gestione la información de clientes' },
    { title: 'Reportes', icon: '📊', route: '/reportes-consultas/ventas', description: 'Visualice reportes y estadísticas' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('Componente Home inicializado');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}

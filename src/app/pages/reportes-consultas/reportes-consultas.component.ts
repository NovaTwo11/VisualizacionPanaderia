import { Component, OnInit } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-reportes-consultas',
  templateUrl: './reportes-consultas.component.html',
  styleUrls: ['./reportes-consultas.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ReportesConsultasComponent implements OnInit {
  // Opciones de navegación para reportes y consultas
  reportesNav = [
    { title: 'Reporte de Ventas', icon: '📊', route: '/reportes-consultas/ventas' },
    { title: 'Reporte de Productos', icon: '📈', route: '/reportes-consultas/productos' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('Componente Reportes y Consultas inicializado');
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}

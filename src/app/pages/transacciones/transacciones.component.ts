import { Component, OnInit } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.component.html',
  styleUrls: ['./transacciones.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class TransaccionesComponent implements OnInit {
  // Opciones de navegación para transacciones
  transaccionesNav = [
    { title: 'Pedidos', icon: '🛒', route: '/transacciones/pedidos' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('Componente Transacciones inicializado');
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}

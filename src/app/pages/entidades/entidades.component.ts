import { Component, OnInit } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-entidades',
  templateUrl: './entidades.component.html',
  styleUrls: ['./entidades.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class EntidadesComponent implements OnInit {
  // Opciones de navegación para entidades
  entidadesNav = [
    { title: 'Administradores', icon: '👤', route: '/entidades/administradores' },
    { title: 'Clientes', icon: '👥', route: '/entidades/clientes' },
    { title: 'Productos', icon: '🍞', route: '/entidades/productos' },
    { title: 'Repartidores', icon: '🚚', route: '/entidades/repartidores' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('Componente Entidades inicializado');
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}

import { Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';

// Auth
import { LoginComponent } from './auth/login/login.component';

// Componentes principales
import { HomeComponent } from './pages/home/home.component';
import { EntidadesComponent } from './pages/entidades/entidades.component';
import { AdministradoresComponent } from './pages/entidades/administradores/administradores.component';
import { ClientesComponent } from './pages/entidades/clientes/clientes.component';
import { ProductosComponent } from './pages/entidades/productos/productos.component';
import { RepartidoresComponent } from './pages/entidades/repartidores/repartidores.component';
import { TransaccionesComponent } from './pages/transacciones/transacciones.component';
import { PedidosComponent } from './pages/transacciones/pedidos/pedidos.component';
import { ReportesConsultasComponent } from './pages/reportes-consultas/reportes-consultas.component';
import { ReporteVentasComponent } from './pages/reportes-consultas/reporte-ventas/reporte-ventas.component';
import { ReporteProductosComponent } from './pages/reportes-consultas/reporte-productos/reporte-productos.component';
import { UtilidadesComponent } from './pages/utilidades/utilidades.component';
import { AyudaComponent } from './pages/ayuda/ayuda.component';
import {RegistroActividadComponent} from './pages/reportes-consultas/registro-actividad/registro-actividad.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },

      {
        path: 'entidades',
        component: EntidadesComponent,
        children: [
          { path: '', redirectTo: 'administradores', pathMatch: 'full' },
          { path: 'administradores', component: AdministradoresComponent },
          { path: 'clientes', component: ClientesComponent },
          { path: 'productos', component: ProductosComponent },
          { path: 'repartidores', component: RepartidoresComponent }
        ]
      },
      {
        path: 'transacciones',
        component: TransaccionesComponent,
        children: [
          { path: '', redirectTo: 'pedidos', pathMatch: 'full' },
          { path: 'pedidos', component: PedidosComponent }
        ]
      },
      {
        path: 'reportes-consultas',
        component: ReportesConsultasComponent,
        children: [
          { path: '', redirectTo: 'ventas', pathMatch: 'full' },
          { path: 'ventas', component: ReporteVentasComponent },
          { path: 'productos', component: ReporteProductosComponent },
          { path: 'actividad', component: RegistroActividadComponent}
        ]
      },
      { path: 'utilidades', component: UtilidadesComponent },
      { path: 'ayuda', component: AyudaComponent }
    ]
  },
  { path: '**', redirectTo: 'home' }
];

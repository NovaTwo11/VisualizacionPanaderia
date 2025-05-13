import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { Administrador } from '../models/models';

const BASE_URL = 'http://localhost:8080/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user: Administrador | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const savedUser = sessionStorage.getItem('current_user');
    if (savedUser) {
      try {
        this._user = JSON.parse(savedUser);
      } catch {
        sessionStorage.removeItem('current_user');
      }
    }
  }

  iniciarSesion(email: string, contrasena: string): Observable<Administrador> {
    return this.http.post<Administrador>(`${BASE_URL}/login`, { email, contrasena }, { withCredentials: true })
      .pipe(
        tap(user => {
          this._user = user;
          sessionStorage.setItem('current_user', JSON.stringify(user));
        }),
        catchError(error => {
          throw error;
        })
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${BASE_URL}/logout`,
      {},
      { withCredentials: true }    // <–– aquí
    ).pipe(
      tap(() => {
        this._user = null;
        sessionStorage.removeItem('current_user');
        this.router.navigate(['/login']);
      })
    );
  }


  estaAutenticado(): boolean {
    return !!this._user;
  }

  getUsuario(): Administrador | null {
    return this._user;
  }

  hasPermission(modulo: string): boolean {
    const permisos = [
      { modulo: 'Dashboard', admin: true, supervisor: true, operador: true },
      { modulo: 'Clientes', admin: true, supervisor: true, operador: false },
      { modulo: 'Productos', admin: true, supervisor: true, operador: true },
      { modulo: 'Pedidos', admin: true, supervisor: true, operador: true },
      { modulo: 'Repartidores', admin: true, supervisor: true, operador: false },
      { modulo: 'Administradores', admin: true, supervisor: false, operador: false },
      { modulo: 'Configuración', admin: true, supervisor: false, operador: false }
    ];
    const user = this.getUsuario();
    if (!user) return false;
    const perm = permisos.find(p => p.modulo === modulo);
    if (!perm) return false;
    switch (user.rol) {
      case 'Administrador':      return perm.admin;
      case 'Supervisor': return perm.supervisor;
      case 'Operador':   return perm.operador;
      default:           return false;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Administrador } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {
  private apiUrl = 'http://localhost:8080/api/administradores'; // URL de la API real

  constructor(private http: HttpClient) { }

  getAdministradores(): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(this.apiUrl);
  }

  getAdministrador(id: number): Observable<Administrador> {
    return this.http.get<Administrador>(`${this.apiUrl}/${id}`);
  }

  crearAdministrador(administrador: Administrador): Observable<Administrador> {
    return this.http.post<Administrador>(`${this.apiUrl}/crear`, administrador);
  }

  actualizarAdministrador(administrador: Administrador): Observable<Administrador> {
    return this.http.put<Administrador>(`${this.apiUrl}/${administrador.id}`, administrador);
  }

  eliminarAdministrador(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}

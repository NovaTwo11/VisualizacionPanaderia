// src/app/services/producto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  crearProductoFormData(formData: FormData): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, formData);
  }

  actualizarProductoFormData(formData: FormData, id: number): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, formData);
  }

  eliminarProducto(id: number|undefined): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Nuevo método para obtener la imagen como Blob */
  getImage(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/imagen`, { responseType: 'blob' });
  }
}

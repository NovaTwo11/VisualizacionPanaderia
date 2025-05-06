// src/app/services/producto.service.ts
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient,     private zone: NgZone) {}

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

  /** Retorna el número total de productos */
  countAll(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  /** Abre una conexión SSE al backend y emite cada nuevo producto */
  onNewProduct(): Observable<Producto> {
    return new Observable<Producto>(subscriber => {
      const evtSource = new EventSource(`${this.apiUrl}/stream`);
      evtSource.onmessage = event => {
        // SSE viene como texto JSON
        const prod: Producto = JSON.parse(event.data);
        // NgZone para actualizar bindings de Angular
        this.zone.run(() => subscriber.next(prod));
      };
      evtSource.onerror = err => {
        this.zone.run(() => subscriber.error(err));
        evtSource.close();
      };
      // cleanup
      return () => evtSource.close();
    });
  }
}

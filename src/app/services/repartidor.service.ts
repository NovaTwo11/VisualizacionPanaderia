import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Repartidor } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RepartidorService {
  // Asegúrate de incluir el host y el prefijo /api
  private apiUrl = 'http://localhost:8080/api/repartidores';

  constructor(private http: HttpClient) {}

  getRepartidores(): Observable<Repartidor[]> {
    return this.http.get<Repartidor[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError<Repartidor[]>('getRepartidores', []))
      );
  }

  getRepartidor(id: number): Observable<Repartidor> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Repartidor>(url)
      .pipe(
        catchError(this.handleError<Repartidor>(`getRepartidor id=${id}`))
      );
  }

  crearRepartidor(repartidor: Repartidor): Observable<Repartidor> {
    return this.http.post<Repartidor>(this.apiUrl, repartidor)
      .pipe(
        catchError(this.handleError<Repartidor>('crearRepartidor'))
      );
  }

  actualizarRepartidor(repartidor: Repartidor): Observable<Repartidor> {
    const url = `${this.apiUrl}/${repartidor.id}`;
    return this.http.put<Repartidor>(url, repartidor)
      .pipe(
        catchError(this.handleError<Repartidor>('actualizarRepartidor'))
      );
  }

  eliminarRepartidor(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url)
      .pipe(
        catchError(this.handleError<void>('eliminarRepartidor'))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return new Observable<T>(subscriber => subscriber.next(result as T));
    };
  }
}

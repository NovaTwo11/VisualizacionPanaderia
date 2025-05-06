import { Injectable, NgZone} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient, private zone: NgZone) {}

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  actualizarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${cliente.id}`, cliente);
  }

  eliminarCliente(id: number|undefined): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  /** Retorna el número total de clientes */
  countAll(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  /** Abre una conexión SSE al backend y emite cada nuevo cliente */
  onNewClient(): Observable<Cliente> {
    return new Observable<Cliente>(subscriber => {
      const evtSource = new EventSource(`${this.apiUrl}/stream`);
      evtSource.onmessage = event => {
        const cli: Cliente = JSON.parse(event.data);
        this.zone.run(() => subscriber.next(cli));
      };
      evtSource.onerror = err => {
        this.zone.run(() => subscriber.error(err));
        evtSource.close();
      };
      return () => evtSource.close();
    });
  }
}

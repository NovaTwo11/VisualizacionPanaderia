import {Component, OnInit, AfterViewInit, ViewChild, ElementRef} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Chart, registerables } from "chart.js";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SearchBarComponent } from "../../../shared/search-bar/search-bar.component";
import { BitacoraService} from "../../../services/bitacora.service";
import {Administrador, Bitacora} from '../../../models/models';
import {AdministradorService} from '../../../services/administrador.service';

Chart.register(...registerables);

interface RegistroActividad {
  id: number;
  administradorId: number;
  nombreAdmin: string;
  apellidoAdmin: string;
  rol: string;
  fechaEntrada: string;    // ISO string
  fechaSalida: string | null; // ISO string or null
}

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  administradorId: string;
  estado: string;
  duracionMinima: number | null;
  duracionMaxima: number | null;
}

@Component({
  selector: "app-registro-actividad",
  templateUrl: "./registro-actividad.component.html",
  styleUrls: ["./registro-actividad.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent],
})
export class RegistroActividadComponent implements OnInit {
  @ViewChild('actividadCanvas', { static: false }) actividadCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('duracionPromedioCanvas', { static: false }) duracionPromedioCanvas!: ElementRef<HTMLCanvasElement>;

  registros: RegistroActividad[] = [];
  registrosFiltrados: RegistroActividad[] = [];
  administradores: Administrador[] = [];
  loading = true;
  error = "";
  searchTerm = "";
  actividadChart!: Chart;
  duracionPromedioChart!: Chart;

  filtros: Filtros = {
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
    administradorId: "",
    estado: "",
    duracionMinima: null,
    duracionMaxima: null,
  };

  constructor(
    private bitacoraService: BitacoraService,
    private adminService: AdministradorService
  ) {}

  ngOnInit(): void {
    // 1) Traer admins reales
    this.adminService.getAdministradores()
      .subscribe({
        next: admins => this.administradores = admins,
        error: () => console.error('No se pudieron cargar administradores')
      });
    // 2) Cargar bitácora
    this.cargarRegistros();
  }

  private filtrarRegistros(): RegistroActividad[] {
    return this.registros.filter(r => {
      const ent = new Date(r.fechaEntrada);
      const sal = r.fechaSalida ? new Date(r.fechaSalida) : null;

      // Filtro por fechaInicio / horaInicio
      if (this.filtros.fechaInicio) {
        const desde = new Date(`${this.filtros.fechaInicio}T${this.filtros.horaInicio || '00:00'}`);
        if (ent < desde) return false;
      }
      // Filtro por fechaFin / horaFin
      if (this.filtros.fechaFin) {
        const hasta = new Date(`${this.filtros.fechaFin}T${this.filtros.horaFin || '23:59'}`);
        if (ent > hasta && (!sal || sal > hasta)) return false;
      }

      // Filtro por administrador
      if (this.filtros.administradorId && +this.filtros.administradorId !== r.administradorId) {
        return false;
      }

      // Filtro por estado: 'activo' = sin logout, 'finalizado' = con logout
      if (this.filtros.estado === 'activo' && r.fechaSalida) return false;
      if (this.filtros.estado === 'finalizado' && !r.fechaSalida) return false;

      // Filtro por duración (en minutos)
      const durMin = this.filtros.duracionMinima;
      const durMax = this.filtros.duracionMaxima;
      if (durMin != null || durMax != null) {
        if (r.fechaSalida) {
          const mins = Math.floor((new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime())/60000);
          if (durMin != null && mins < durMin) return false;
          if (durMax != null && mins > durMax) return false;
        } else {
          // sesión activa sin duración definida
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Carga los registros de bitácora del backend,
   * mapea al tipo RegistroActividad y refresca gráficos.
   */
  public cargarRegistros(): void {
    this.loading = true;
    this.error = '';
    this.registros = [];
    this.registrosFiltrados = [];

    const desdeIso = this.formatDesde();
    const hastaIso = this.formatHasta();
    const usrId = this.filtros.administradorId
      ? +this.filtros.administradorId
      : undefined;

    this.bitacoraService
      .listar(desdeIso, hastaIso, usrId)
      .subscribe({
        next: (logs: Bitacora[]) => {

          // 1) Ordena todos los eventos por timestamp ascendente
          logs.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          // 2) Para cada usuario, mantenemos una pila de timestamps de LOGIN pendientes
          const pendingLogins = new Map<number, Date[]>();
          const sessions: RegistroActividad[] = [];

          for (const log of logs) {
            const ts = new Date(log.timestamp);
            const info = log.detalle ? JSON.parse(log.detalle) : {};
            const userId = log.usuarioId;
            const rol = info.rol || '–';
            const nombre = info.nombre || '–';
            const apellido = info.apellido || '–';

            if (log.evento === 'LOGIN') {
              if (!pendingLogins.has(userId)) {
                pendingLogins.set(userId, []);
              }
              pendingLogins.get(userId)!.push(ts);

            } else if (log.evento === 'LOGOUT') {
              const stack = pendingLogins.get(userId);
              if (stack && stack.length) {
                const loginTs = stack.shift()!;
                sessions.push({
                  id: log.id,
                  administradorId: userId,
                  nombreAdmin: nombre,
                  apellidoAdmin: apellido,
                  rol: rol,
                  fechaEntrada: loginTs.toISOString(),
                  fechaSalida: ts.toISOString()
                });
              }
            }
          }

          // 3) Crea sesiones “activas” sin logout
          for (const [userId, stack] of pendingLogins.entries()) {
            for (const loginTs of stack) {
              const firstLog = logs.find(l => l.usuarioId === userId && l.evento === 'LOGIN');
              const info = firstLog?.detalle ? JSON.parse(firstLog.detalle) : {};
              sessions.push({
                id: firstLog?.id || 0,
                administradorId: userId,
                nombreAdmin: info.nombre || '–',
                apellidoAdmin: info.apellido || '–',
                rol: info.rol || '–',
                fechaEntrada: loginTs.toISOString(),
                fechaSalida: null
              });
            }
          }

          // 4) Asigna resultados y baja el loading
          this.registros = sessions;
          this.registrosFiltrados = [...sessions];
          this.loading = false;

          // 5) Espera un tick para que Angular renderice los <canvas> antes de inicializar/actualizar
          setTimeout(() => {
            if (this.registrosFiltrados.length > 0) {
              if (!this.actividadChart) {
                this.inicializarGrafico();
              }
              this.actualizarGrafico();

              if (!this.duracionPromedioChart) {
                this.inicializarGraficoDuracionPromedio();
              }
              this.actualizarGraficoDuracionPromedio();
            }
          });
        },
        error: () => {
          this.error = 'Error cargando registros de actividad';
          this.loading = false;
        }
      });
  }


  /** True si ya cargó y no hay registros que mostrar */
  get sinRegistros(): boolean {
    return !this.loading && !this.error && this.registrosFiltrados.length === 0;
  }



  /** Opcional: formatea fechaInicio+horaInicio o default -30 días */
  private formatDesde(): string {
    if (this.filtros.fechaInicio) {
      const dt = new Date(`${this.filtros.fechaInicio}T${this.filtros.horaInicio || '00:00'}`);
      return dt.toISOString();
    }
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    return hace30.toISOString();
  }

  /** Opcional: formatea fechaFin+horaFin o default ahora */
  private formatHasta(): string {
    if (this.filtros.fechaFin) {
      const dt = new Date(`${this.filtros.fechaFin}T${this.filtros.horaFin || '23:59'}`);
      return dt.toISOString();
    }
    return new Date().toISOString();
  }

  /**
   * Aplica los filtros y recarga datos
   */
  public aplicarFiltros(): void {
    // tras recargar registros (o en ngOnInit), siempre:
    this.registrosFiltrados = this.filtrarRegistros();
    this.actualizarGrafico();
    this.actualizarGraficoDuracionPromedio();
  }


  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: "",
      fechaFin: "",
      horaInicio: "",
      horaFin: "",
      administradorId: "",
      estado: "",
      duracionMinima: null,
      duracionMaxima: null,
    };
    this.cargarRegistros();
  }

  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.registrosFiltrados = [...this.registros];
      this.actualizarGrafico();
      this.actualizarGraficoDuracionPromedio();
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.registrosFiltrados = this.registros.filter(r =>
      r.nombreAdmin.toLowerCase().includes(term) ||
      r.apellidoAdmin.toLowerCase().includes(term) ||
      r.rol.toLowerCase().includes(term)
    );
    this.actualizarGrafico();
    this.actualizarGraficoDuracionPromedio();
  }

  calcularDuracion(registro: RegistroActividad): string {
    if (!registro.fechaSalida) return 'En sesión';
    const tE = new Date(registro.fechaEntrada).getTime();
    const tS = new Date(registro.fechaSalida).getTime();
    const diff = tS - tE;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  }

  obtenerTotalAdministradores(): number {
    return new Set(this.registrosFiltrados.map(r => r.administradorId)).size;
  }

  obtenerTotalSesiones(): number {
    return this.registrosFiltrados.length;
  }

  obtenerPromedioTiempo(): string {
    const finished = this.registrosFiltrados.filter(r => r.fechaSalida);
    if (!finished.length) return '0h 0m';
    const totalMs = finished
      .map(r => new Date(r.fechaSalida!).getTime() - new Date(r.fechaEntrada).getTime())
      .reduce((a,b) => a + b, 0);
    const avg = totalMs / finished.length;
    const h = Math.floor(avg / 3600000);
    const m = Math.floor((avg % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  obtenerDiaMasActivo(): string {
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const cnt = Array(7).fill(0);
    this.registrosFiltrados.forEach(r => {
      const idx = new Date(r.fechaEntrada).getDay(); cnt[idx]++;
    });
    const iMax = cnt.indexOf(Math.max(...cnt));
    return dias[iMax];
  }

  inicializarGrafico(): void {
    const ctx = this.actividadCanvas.nativeElement.getContext('2d');
    this.actividadChart = new Chart(ctx!, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Sesiones por día', data: [], backgroundColor: 'rgba(231,111,81,0.7)', borderColor: 'rgba(231,111,81,1)', borderWidth:1 }] },
      options: { responsive:true, maintainAspectRatio:false,
        scales:{ x:{ title:{ display:true, text:'Fecha' }}, y:{ beginAtZero:true, title:{ display:true, text:'Número de sesiones'} } }
      }
    });
  }

  inicializarGraficoDuracionPromedio(): void {
    const ctx = this.duracionPromedioCanvas.nativeElement.getContext('2d');
    this.duracionPromedioChart = new Chart(ctx!, {
      type:'bar',
      data:{ labels:[], datasets:[{ label:'Duración promedio (minutos)', data:[], backgroundColor:'rgba(75,192,192,0.7)', borderColor:'rgba(75,192,192,1)', borderWidth:1 }] },
      options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', scales:{ y:{ title:{ display:true, text:'Administrador' }}, x:{ beginAtZero:true, title:{ display:true, text:'Duración (minutos)' } } }}
    });
  }

  actualizarGrafico(): void {
    const map = new Map<string, number>();
    this.registrosFiltrados.forEach(r => {
      const d = new Date(r.fechaEntrada).toISOString().slice(0,10);
      map.set(d, (map.get(d)||0)+1);
    });
    const dates = Array.from(map.keys()).sort();
    const data = dates.map(d => map.get(d)!);
    const labels = dates.map(d => d.split('-').reverse().join('/'));
    this.actividadChart.data.labels = labels;
    this.actividadChart.data.datasets[0].data = data;
    this.actividadChart.update();
  }

  actualizarGraficoDuracionPromedio(): void {
    const map = new Map<string,{ total:number; count:number }>();
    this.registrosFiltrados.filter(r=>r.fechaSalida).forEach(r => {
      const name = `${r.nombreAdmin} ${r.apellidoAdmin}`;
      const mins = Math.floor((new Date(r.fechaSalida!).getTime() - new Date(r.fechaEntrada).getTime())/60000);
      const e = map.get(name) || { total:0, count:0 };
      e.total += mins; e.count++;
      map.set(name, e);
    });
    const labels = Array.from(map.keys());
    let data = labels.map(l => Math.round(map.get(l)!.total / map.get(l)!.count));
    const idx = data.map((_,i)=>i).sort((a,b)=>data[b]-data[a]);
    this.duracionPromedioChart.data.labels = idx.map(i=>labels[i]);
    this.duracionPromedioChart.data.datasets[0].data = idx.map(i=>data[i]);
    this.duracionPromedioChart.update();
  }

  exportarPDF(): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // 1) Título
    doc.setFontSize(18);
    doc.text('Registro de Actividad de Administradores', 40, 50);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 40, 70);

    // 2) Añadir Gráfico de Sesiones
    const actCanvas = this.actividadCanvas.nativeElement;
    const actImg = actCanvas.toDataURL('image/png');
    doc.addImage(actImg, 'PNG', 40, 90, 250, 150);

    // 3) Añadir Gráfico de Duración Promedio
    const durCanvas = this.duracionPromedioCanvas.nativeElement;
    const durImg = durCanvas.toDataURL('image/png');
    doc.addImage(durImg, 'PNG', 320, 90, 250, 150);

    // 4) Tabla
    const startY = 260;
    const cols = ['Administrador','Rol','Fecha Ent','Hora Ent','Fecha Sal','Hora Sal','Duración'];
    const rows = this.registrosFiltrados.map(r => {
      const ent = new Date(r.fechaEntrada);
      const sal = r.fechaSalida ? new Date(r.fechaSalida) : null;
      return [
        `${r.nombreAdmin} ${r.apellidoAdmin}`,
        r.rol,
        ent.toISOString().slice(0,10),
        ent.toLocaleTimeString(),
        sal ? sal.toISOString().slice(0,10) : '-',
        sal ? sal.toLocaleTimeString() : '-',
        this.calcularDuracion(r)
      ];
    });

    autoTable(doc, {
      head: [cols],
      body: rows,
      startY,
      margin: { left: 40, right: 40, bottom: 40 },
      styles: { fontSize: 8 },
      bodyStyles: { valign: 'top' },
      didDrawPage: data => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 20
        );
      }
    });

    doc.save('registro-actividad.pdf');
  }

}

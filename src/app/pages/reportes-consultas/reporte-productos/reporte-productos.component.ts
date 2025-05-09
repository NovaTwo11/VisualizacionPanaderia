import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../../services/reporte.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReporteDetalle } from '../../../models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-reporte-productos',
  templateUrl: './reporte-productos.component.html',
  styleUrls: ['./reporte-productos.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ReporteProductosComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  detalles: ReporteDetalle[] = [];
  loading = false;
  error: string | null = null;

  filtroTiempo: 'diario' | 'semanal' | 'mensual' | 'siempre' = 'siempre';
  filtroTipoReporte: 'GENERAL' | 'POR_PRODUCTO' | 'POR_CLIENTE' =
    'POR_PRODUCTO';
  periodoInicio: string = '';
  periodoFin:    string = '';


  private chart!: Chart;
  private dataSub?: Subscription;
  @ViewChild('productosCanvas') productosCanvas!: ElementRef<
    HTMLCanvasElement
  >;

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.setPeriod();
    this.cargarReporte();
  }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.chart?.destroy();
  }

  cambiarFiltroTiempo(event: Event): void {
    this.filtroTiempo = (event.target as HTMLSelectElement).value as any;
    this.setPeriod();
    this.cargarReporte();
  }

  private setPeriod(): void {
    const now = new Date();

    if (this.filtroTiempo === 'siempre') {
      this.periodoInicio = '';
      this.periodoFin    = '';
      return;
    }

    let start: Date;
    let end: Date;
    switch (this.filtroTiempo) {
      case 'diario':
        // inicio: hoy 00:00:00, fin: hoy 23:59:59
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;

      case 'semanal':
        // Lunes a domingo de la semana actual
        const day = now.getDay() || 7;  // domingo -> 7
        start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        start.setHours(0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59);
        break;

      case 'mensual':
      default:
        // 1º del mes 00:00:00 hasta último día del mes 23:59:59
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        // calcula último día: día 0 del mes siguiente
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59);
        break;
    }

    this.periodoInicio = this.formatDate(start);
    this.periodoFin    = this.formatDate(end);
  }

  cambiarTipoReporte(event: Event): void {
    this.filtroTipoReporte = (event.target as HTMLSelectElement).value as any;
    this.cargarReporte();
  }

  private formatDate(date: Date): string {
    // Formato yyyy-MM-ddTHH:mm:ss en hora local
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + 'T' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds())
    );
  }

  /** Llamada simple al service */
  private fetchProductos(
    start?: string,
    end?: string
  ) {
    return this.reporteService.getReporteProductos(
      start,
      end,
      this.filtroTipoReporte
    );
  }

  cargarReporte(): void {
    this.loading = true;
    this.error   = null;
    this.dataSub?.unsubscribe();

    const s = this.periodoInicio || undefined;
    const e = this.periodoFin    || undefined;

    this.dataSub = this.reporteService
      .getReporteProductos(s, e, this.filtroTipoReporte)
      .subscribe({
        next: data => {
          this.detalles = data;
          this.loading  = false;
          setTimeout(() => this.renderChart(), 0);
        },
        error: () => {
          this.error   = 'No se pudo cargar el reporte de productos.';
          this.loading = false;
        }
      });
  }


  private renderChart(): void {
    const ctx = this.productosCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.chart?.destroy();

    const bg = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    let type: 'pie' | 'bar';
    let labels: string[] = [];
    let data: number[] = [];

    if (this.filtroTipoReporte === 'GENERAL') {
      type = 'pie';
      labels = this.detalles.map(d => d.categoria ?? 'Sin categoría');
      data = this.detalles.map(d => (d as any).unidadesVendidasTotales);
    } else if (this.filtroTipoReporte === 'POR_PRODUCTO') {
      type = 'bar';
      labels = this.detalles.map(d => (d as any).nombreProducto ?? '—');
      data = this.detalles.map(d => (d as any).cantidadVendida);
    } else {
      type = 'bar';
      labels = this.detalles.map(d => (d as any).nombreCliente ?? '—');
      data = this.detalles.map(d => (d as any).totalUnidades);
    }

    this.chart = new Chart(ctx, {
      type,
      data: { labels, datasets: [{ label: this.getChartLabel(), data, backgroundColor: bg }] },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
  }

  private getChartLabel(): string {
    switch (this.filtroTipoReporte) {
      case 'GENERAL': return 'Unidades Vendidas por Categoría';
      case 'POR_PRODUCTO': return 'Cantidad Vendida por Producto';
      default: return 'Total Unidades por Cliente';
    }
  }

  exportarReporte(): void {
    const doc      = new jsPDF('p','mm','a4')
    const title    = `Reporte de Productos (${this.filtroTipoReporte})`
    const fecha    = `Período: ${this.periodoInicio || '—'} → ${this.periodoFin || '—'}`

    // 1) Encabezado
    doc.setFontSize(18)
    doc.text(title, 14, 20)
    doc.setFontSize(11)
    doc.text(fecha, 14, 28)

    // 2) Auto-table a partir del elemento DOM #tablaProductos
    autoTable(doc, {
      html: '#tablaProductos',
      startY: 35,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [220,220,220] },
    })

    // 3) Gráfico
    const pdfW      = doc.internal.pageSize.getWidth() - 28
    const tableEndY = (doc as any).lastAutoTable.finalY + 10

    html2canvas(this.productosCanvas.nativeElement, { scale: 2 })
      .then(canvas => {
        const imgData = canvas.toDataURL('image/png')
        const props   = (doc as any).getImageProperties(imgData)
        const h       = (props.height * pdfW) / props.width
        const y       = tableEndY + h > doc.internal.pageSize.getHeight() - 20
          ? (doc.addPage(), 20)
          : tableEndY

        doc.addImage(imgData, 'PNG', 14, y, pdfW, h)
        doc.save(`reporte-productos-${Date.now()}.pdf`)
      })
  }

}

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteService } from '../../../services/reporte.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';


Chart.register(...registerables);

@Component({
  selector: 'app-reporte-ventas',
  templateUrl: './reporte-ventas.component.html',
  styleUrls: ['./reporte-ventas.component.css'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class ReporteVentasComponent implements OnInit, OnDestroy {
  detalles: any[] = [];
  loading = true;
  error: string | null = null;

  // Filtros
  filtroTiempo: 'diario' | 'semanal' | 'mensual' | 'siempre' = 'siempre';
  filtroTipoReporte: 'GENERAL' | 'POR_PRODUCTO' | 'POR_CLIENTE' = 'GENERAL';
  filtroMetodoPago: 'TODOS' | 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' = 'TODOS';

  periodoInicio: string = '';
  periodoFin:    string = '';

  private chart!: Chart;
  private dataSub?: Subscription;
  @ViewChild('ventasCanvas') ventasCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.setPeriod();
    this.cargarReporte();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    if (this.chart) this.chart.destroy();
  }

  cambiarFiltro(event: Event): void {
    this.filtroTiempo = (event.target as HTMLSelectElement).value as any;
    this.setPeriod();
    this.cargarReporte();
  }

  cambiarTipoReporte(event: Event): void {
    this.filtroTipoReporte = (event.target as HTMLSelectElement).value as any;
    this.cargarReporte();
  }

  cambiarMetodoPago(event: Event): void {
    this.filtroMetodoPago = (event.target as HTMLSelectElement).value as any;
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
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;

      case 'semanal':
        const day = now.getDay() || 7;
        start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        start.setHours(0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59);
        break;

      case 'mensual':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59);
        break;
    }

    this.periodoInicio = this.formatDate(start);
    this.periodoFin    = this.formatDate(end);
  }

  private formatDate(date: Date): string {
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

  /** Llama al service con todos o solo tipoReporte+métodoPago */
  private fetchVentas(start?: string, end?: string) {
    return this.reporteService.getReporteVentas({
      periodoInicio: start,
      periodoFin: end,
      tipoReporte: this.filtroTipoReporte,
      metodoPago: this.filtroMetodoPago
    });
  }

  private cargarReporte(): void {
    this.loading = true;
    this.error   = null;
    this.dataSub?.unsubscribe();

    const s = this.periodoInicio || undefined;
    const e = this.periodoFin    || undefined;

    this.dataSub = this.reporteService
      .getReporteVentas({
        periodoInicio: s,
        periodoFin:    e,
        tipoReporte:   this.filtroTipoReporte,
        metodoPago:    this.filtroMetodoPago
      })
      .subscribe({
        next: data => {
          this.detalles = data.map(d => ({
            ...d,
            totalUnidades:     (d as any).cantidadVendida,
            detalleProductos: (d as any).productosComprados
          }));
          this.loading = false;
          setTimeout(() => this.renderChart(), 0);
        },
        error: () => {
          this.error   = 'No se pudo cargar el reporte de ventas.';
          this.loading = false;
        }
      });
  }


  /**
   * Renderiza el gráfico según el tipo de reporte.
   */
  private renderChart() {
    const ctx = this.ventasCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    let chartType: 'bar' | 'pie' | 'horizontalBar' = 'bar';
    let labels: string[] = [];
    let data: number[] = [];
    let backgroundColor: string[] = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
    ];

    if (this.filtroTipoReporte === 'GENERAL') {
      // Gráfico de barras apiladas por método de pago
      chartType = 'bar';
      labels = this.detalles.map(d => d.metodoPago || 'Sin método');
      data = this.detalles.map(d => d.totalGenerado);
    } else if (this.filtroTipoReporte === 'POR_PRODUCTO') {
      // Gráfico de pastel por participación de productos
      chartType = 'pie';
      labels = this.detalles.map(d => d.nombreProducto || 'Sin nombre');
      data = this.detalles.map(d => d.cantidadVendida);
    } else if (this.filtroTipoReporte === 'POR_CLIENTE') {
      // Gráfico de barras horizontales por cliente
      chartType = 'bar'; // Usamos bar con indexAxis: 'y' para barras horizontales
      labels = this.detalles.map(d => d.nombreCliente || 'Sin cliente');
      data = this.detalles.map(d => d.totalUnidades);
    }

    // Configuración específica para cada tipo de gráfico
    let options: any = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
      }
    };

    // Para barras horizontales en POR_CLIENTE
    if (this.filtroTipoReporte === 'POR_CLIENTE') {
      options.indexAxis = 'y';
    }

    // Para barras apiladas en GENERAL
    if (this.filtroTipoReporte === 'GENERAL') {
      options.scales = {
        x: {
          stacked: true
        },
        y: {
          stacked: true
        }
      };
    }

    this.chart = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: this.getChartLabel(),
          data,
          backgroundColor
        }]
      },
      options
    });
  }

  /**
   * Obtiene la etiqueta adecuada para el gráfico según el tipo de reporte.
   */
  private getChartLabel(): string {
    switch (this.filtroTipoReporte) {
      case 'GENERAL': return 'Total Generado';
      case 'POR_PRODUCTO': return 'Cantidad Vendida';
      case 'POR_CLIENTE': return 'Total Unidades';
      default: return 'Valor';
    }
  }

  exportarReporte(): void {
    const doc = new jsPDF('p','mm','a4');
    const title  = `Reporte de Ventas (${this.filtroTipoReporte})`;
    const fecha  = `Período: ${this.periodoInicio || '—'} → ${this.periodoFin || '—'}`;
    const metodo = this.filtroTipoReporte === 'GENERAL'
      ? `Método Pago: ${this.filtroMetodoPago}`
      : '';

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.text(fecha, 14, 28);
    if (metodo) doc.text(metodo, 14, 34);

    // autoTable
    autoTable(doc, {
      startY: 38,
      html: '#tablaVentas',      // o define head/body igual que antes
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });

    const pdfWidth  = doc.internal.pageSize.getWidth() - 28;
    const tableEndY = (doc as any).lastAutoTable.finalY + 10;
    html2canvas(this.ventasCanvas.nativeElement, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const props   = (doc as any).getImageProperties(imgData);
      const h       = (props.height * pdfWidth) / props.width;
      if (tableEndY + h > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        doc.addImage(imgData, 'PNG', 14, 20, pdfWidth, h);
      } else {
        doc.addImage(imgData, 'PNG', 14, tableEndY, pdfWidth, h);
      }
      doc.save(`reporte-ventas-${Date.now()}.pdf`);
    });
  }

}

import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Pedido, Cliente, Repartidor, Producto } from '../../../models/models';
import { PedidoService } from '../../../services/pedido.service';
import { ClienteService } from '../../../services/cliente.service';
import { RepartidorService } from '../../../services/repartidor.service';
import { ProductoService } from '../../../services/producto.service';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  animations: [
    trigger('formAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  clientes: Cliente[] = [];
  repartidores: Repartidor[] = [];
  productos: Producto[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Formulario
  pedidoForm: FormGroup;
  formMode: 'crear' | 'editar' | 'oculto' = 'oculto';
  submitted: boolean = false;

  // Modal de eliminación
  showDeleteModal: boolean = false;
  pedidoSeleccionado: Pedido | null = null;

  // Filtros
  searchTerm: string = '';
  filtroEstado: string = 'todos';

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private repartidorService: RepartidorService,
    private productoService: ProductoService,
    private formBuilder: FormBuilder
  ) {
    this.pedidoForm = this.formBuilder.group({
      id: [null],
      clienteId: ['', Validators.required],
      clienteNombre: [''],
      fecha: [ this.formatLocalDate(new Date()), Validators.required ],
      estado: ['pendiente', Validators.required],
      repartidorId: [''],
      repartidorNombre: [''],
      direccionEntrega: ['', Validators.required],
      metodoPago: ['', Validators.required],
      notas: [''],
      total: [0],
      productos: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.getPedidos();
    this.getClientes();
    this.getRepartidores();
    this.getProductos();
    this.agregarProducto();
    this.pedidoForm.get('clienteId')!.valueChanges.subscribe(rawId => {
      const id = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      const cliente = this.clientes.find(c => c.id === id);
      if (cliente) {
        this.pedidoForm.patchValue({
          clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
          direccionEntrega: cliente.direccion
        });
      } else {
        this.pedidoForm.patchValue({
          clienteNombre: '',
          direccionEntrega: ''
        });
      }
    });
  }

  // Getter para acceder fácilmente a los controles del formulario
  get f() { return this.pedidoForm.controls; }

  // Getter para acceder al FormArray de productos
  get productosFormArray() {
    return this.pedidoForm.get('productos') as FormArray;
  }

  getPedidos(): void {
    this.loading = true;
    this.pedidoService.getPedidos()
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos.map(p => ({
            ...p,
            fecha: new Date(p.fecha)   // <-- aquí
          }));
          this.filteredPedidos = [...pedidos];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar pedidos', err);
          this.error = 'Error al cargar los pedidos. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

  getClientes(): void {
    this.clienteService.getClientes()
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes;
        },
        error: (err) => {
          console.error('Error al cargar clientes', err);
        }
      });
  }

  getRepartidores(): void {
    this.repartidorService.getRepartidores()
      .subscribe({
        next: (repartidores) => {
          this.repartidores = repartidores;
        },
        error: (err) => {
          console.error('Error al cargar repartidores', err);
        }
      });
  }

  getProductos(): void {
    this.productoService.getProductos()
      .subscribe({
        next: (productos) => {
          this.productos = productos;
        },
        error: (err) => {
          console.error('Error al cargar productos', err);
        }
      });
  }

  toggleFormMode(mode: 'crear' | 'editar' | 'oculto'): void {
    this.formMode = mode;
    this.submitted = false;

    if (mode === 'crear') {
      this.pedidoForm.reset({
        fecha: new Date(),
        estado: 'pendiente',
        total: 0
      });

      // Limpiar el array de productos y agregar uno nuevo
      this.productosFormArray.clear();
      this.agregarProducto();
    }
  }

  agregarProducto(): void {
    const productoForm = this.formBuilder.group({
      productoId: ['', Validators.required],
      nombre: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0],
      subtotal: [0]
    });

    this.productosFormArray.push(productoForm);
  }

  eliminarProducto(index: number): void {
    this.productosFormArray.removeAt(index);
    this.calcularTotal();
  }

  onProductoChange(index: number): void {
    const productoFormGroup = this.productosFormArray.at(index);
    const productoId = productoFormGroup.get('productoId')?.value;

    if (productoId) {
      const productoSeleccionado = this.productos.find(p => p.id == productoId);

      if (productoSeleccionado) {
        productoFormGroup.patchValue({
          nombre: productoSeleccionado.nombre,
          precioUnitario: productoSeleccionado.precio
        });

        this.calcularSubtotal(index);
      }
    }
  }

  calcularSubtotal(index: number): void {
    const productoFormGroup = this.productosFormArray.at(index);
    const cantidad = productoFormGroup.get('cantidad')?.value || 0;
    const precioUnitario = productoFormGroup.get('precioUnitario')?.value || 0;

    const subtotal = cantidad * precioUnitario;
    productoFormGroup.patchValue({ subtotal });

    this.calcularTotal();
  }

  calcularTotal(): number {
    let total = 0;

    for (let i = 0; i < this.productosFormArray.length; i++) {
      const subtotal = this.productosFormArray.at(i).get('subtotal')?.value || 0;
      total += subtotal;
    }

    this.pedidoForm.patchValue({ total });
    return total;
  }

  editarPedido(pedido: Pedido): void {
    // Limpiar el array de productos
    this.productosFormArray.clear();

    // Agregar cada producto del pedido al FormArray
    pedido.productos.forEach(producto => {
      const productoForm = this.formBuilder.group({
        productoId: [producto.productoId, Validators.required],
        nombre: [producto.nombre],
        cantidad: [producto.cantidad, [Validators.required, Validators.min(1)]],
        precioUnitario: [producto.precioUnitario],
        subtotal: [producto.subtotal]
      });

      this.productosFormArray.push(productoForm);
    });

    // Actualizar el resto del formulario
    this.pedidoForm.patchValue({
      id: pedido.id,
      clienteId: pedido.clienteId,
      clienteNombre: pedido.clienteNombre,
      fecha: this.formatLocalDate(new Date(pedido.fecha)),
      estado: pedido.estado,
      repartidorId: pedido.repartidorId || '',
      repartidorNombre: pedido.repartidorNombre || '',
      direccionEntrega: pedido.direccionEntrega,
      metodoPago: pedido.metodoPago,
      notas: pedido.notas || '',
      total: pedido.total
    });

    this.toggleFormMode('editar');
  }

  guardarPedido(): void {
    this.submitted = true;

    if (this.isFormInvalid()) return;
    if (this.hasStockErrors()) return;

    const payload = this.buildPayload();

    if (this.formMode === 'crear') {
      this.sendCreate(payload);
    } else {
      this.sendUpdate(payload);
    }
  }

  /** 1. Valida que el formulario esté correcto */
  private isFormInvalid(): boolean {
    if (this.pedidoForm.valid) {
      return false;
    }

    // 1.1. Marcar todos los controles como 'touched' y 'dirty'
    this.markAllControls(this.pedidoForm);

    // 1.2. Opcional: desplazarse al primer campo inválido
    setTimeout(() => {
      const firstInvalid: HTMLElement | null = document.querySelector(
        '.ng-invalid[formControlName]'
      );
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
    });

    // 1.3. Opcional: recopilar errores para un resumen
    const errorSummary: string[] = [];
    Object.keys(this.pedidoForm.controls).forEach(key => {
      const control = this.pedidoForm.get(key)!;
      if (control.invalid) {
        const errs = control.errors!;
        Object.keys(errs).forEach(errKey => {
          errorSummary.push(`${key}: ${errKey}`);
        });
      }
    });
    console.warn('Errores de validación en el formulario:', errorSummary);

    return true;
  }

  /** Recorre recursivamente un FormGroup/FormArray y marca sus controles */
  private markAllControls(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markAllControls(control);
      } else {
        control.markAsTouched();
        control.markAsDirty();
      }
    });
  }


  /** 2. Revisa stock y muestra alert si hay problemas */
  private hasStockErrors(): boolean {
    const faltantes = this.tieneStockInsuficiente();
    if (faltantes.length === 0) return false;

    const mensajes = faltantes
      .map(f => `– ${f.nombre}: solicitó ${f.solicitado}, pero sólo hay ${f.disponible}.`)
      .join('\n');
    alert(`No se puede procesar el pedido por falta de stock:\n${mensajes}`);
    return true;
  }

  /** 3. Construye el objeto payload, quitando campos de solo lectura y completando nombres */
  private buildPayload(): any {
    const raw = { ...this.pedidoForm.value } as any;
    delete raw.fecha;
    delete raw.total;

    this.completeClienteFields(raw);
    this.completeRepartidorFields(raw);

    // Asegura que venga el ID si es actualización
    if (this.formMode === 'editar') {
      raw.id = this.pedidoForm.value.id;
    }

    return raw;
  }

  private completeClienteFields(raw: any): void {
    if (!raw.clienteId) return;
    const c = this.clientes.find(x => x.id === raw.clienteId);
    if (!c) return;
    raw.clienteNombre    = `${c.nombre} ${c.apellido}`;
    raw.direccionEntrega = c.direccion;
  }

  private completeRepartidorFields(raw: any): void {
    if (!raw.repartidorId) return;
    const r = this.repartidores.find(x => x.id === raw.repartidorId);
    if (!r) return;
    raw.repartidorNombre = `${r.nombre} ${r.apellido}`;
  }

  /** 4a. Envía la petición de creación */
  private sendCreate(payload: any): void {
    this.pedidoService.crearPedido(payload)
      .subscribe({
        next: nuevo => {
          this.pedidos.push(nuevo);
          this.filtrarPedidos();
          this.toggleFormMode('oculto');
        },
        error: err => {
          console.error('Error al crear pedido:', err);
          alert(`Error al crear pedido: ${err.message || err.status}`);
        }
      });
  }

  /** 4b. Envía la petición de actualización */
  private sendUpdate(payload: any): void {
    this.pedidoService.actualizarPedido(payload)
      .subscribe({
        next: actualizado => {
          const idx = this.pedidos.findIndex(p => p.id === actualizado.id);
          if (idx !== -1) {
            this.pedidos[idx] = actualizado;
            this.filtrarPedidos();
          }
          this.toggleFormMode('oculto');
        },
        error: err => {
          console.error('Error al actualizar pedido:', err);
          const msg = err.error?.message || err.message;
          alert(`No se pudo actualizar el pedido: ${msg}`);
        }
      });
  }



  /** Revisa cada línea de producto y devuelve las que tienen stock insuficiente */
  private tieneStockInsuficiente(): Array<{
    index: number;
    productoId: number;
    nombre: string;
    solicitado: number;
    disponible: number;
  }> {
    const faltantes = [];

    // Asegurarnos de que la lista de productos está cargada
    if (!this.productos || this.productos.length === 0) {
      alert('Error interno: la lista de productos no está cargada.');
      return [{ index: -1, productoId: 0, nombre: 'N/A', solicitado: 0, disponible: 0 }];
    }

    for (let i = 0; i < this.productosFormArray.length; i++) {
      const grupo     = this.productosFormArray.at(i);
      const rawId     = grupo.get('productoId')!.value;
      const solicitado= grupo.get('cantidad')!.value;

      // 1) Parsear bien el ID a número
      const productoId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

      // 2) Si no hay producto seleccionado, ignoramos esta línea
      if (!productoId) {
        // Opcional: podrías alertar, pero a veces es normal tener líneas vacías
        console.warn(`Línea ${i+1}: aún no se ha seleccionado un producto.`);
        continue;
      }

      // 3) Buscarlo en el array de productos
      const prod = this.productos.find(p => p.id === productoId);
      if (!prod) {
        alert(`Error interno: el producto con ID ${productoId} no está cargado.`);
        return [{ index: i, productoId, nombre: 'Desconocido', solicitado, disponible: 0 }];
      }

      // 4) Verificar que stock esté definido
      if (prod.stock == null) {
        alert(`El producto "${prod.nombre}" no tiene stock definido.`);
        return [{ index: i, productoId, nombre: prod.nombre, solicitado, disponible: 0 }];
      }

      const disponible = prod.stock;
      console.log(
        `Línea ${i+1}: Validando stock para ${prod.nombre} ` +
        `(solicitado=${solicitado}, disponible=${disponible})`
      );

      // 5) Agregar a faltantes si excede
      if (solicitado > disponible) {
        faltantes.push({
          index: i,
          productoId,
          nombre: prod.nombre,
          solicitado,
          disponible
        });
      }
    }

    return faltantes;
  }

  confirmarEliminar(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.showDeleteModal = true;
  }

  eliminarPedido(): void {
    if (!this.pedidoSeleccionado) return;

    this.pedidoService.eliminarPedido(this.pedidoSeleccionado.id!)
      .subscribe({
        next: (success) => {
          if (success) {
            this.pedidos = this.pedidos.filter(p => p.id !== this.pedidoSeleccionado!.id);
            this.filtrarPedidos();
            this.showDeleteModal = false;
            this.pedidoSeleccionado = null;
            // Aquí se podría mostrar un mensaje de éxito
          }
        },
        error: (err) => {
          console.error('Error al eliminar pedido', err);
          // Aquí se podría mostrar un mensaje de error
        }
      });
  }

  onSearchChange(): void {
    this.filtrarPedidos();
  }

  filtrarPedidos(): void {
    // Aplicar filtros de búsqueda y estado
    let filtered = [...this.pedidos];

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(pedido =>
        pedido.clienteNombre?.toLowerCase().includes(term) ||
        pedido.direccionEntrega.toLowerCase().includes(term) ||
        (pedido.repartidorNombre && pedido.repartidorNombre.toLowerCase().includes(term)) ||
        pedido.id!.toString().includes(term)
      );
    }

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      filtered = filtered.filter(pedido => pedido.estado === this.filtroEstado);
    }

    this.filteredPedidos = filtered;
  }

  private formatLocalDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds())
    );
  }
}

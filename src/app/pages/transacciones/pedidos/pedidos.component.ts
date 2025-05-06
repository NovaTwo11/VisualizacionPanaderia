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

    // Agregar al menos un producto al iniciar
    this.agregarProducto();
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

    if (this.pedidoForm.invalid) {
      return;
    }
    const payload = this.pedidoForm.value as any;

    const pedidoData = this.pedidoForm.value;

    // Obtener nombres de cliente y repartidor
    if (pedidoData.clienteId) {
      const clienteSeleccionado = this.clientes.find(c => c.id == pedidoData.clienteId);
      if (clienteSeleccionado) {
        pedidoData.clienteNombre = `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`;
      }
    }

    if (pedidoData.repartidorId) {
      const repartidorSeleccionado = this.repartidores.find(r => r.id == pedidoData.repartidorId);
      if (repartidorSeleccionado) {
        pedidoData.repartidorNombre = `${repartidorSeleccionado.nombre} ${repartidorSeleccionado.apellido}`;
      }
    }

    if (this.formMode === 'crear') {
      this.pedidoService.crearPedido(payload)
        .subscribe({
          next: (pedido) => {
            this.pedidos.push(pedido);
            this.filtrarPedidos();
            this.toggleFormMode('oculto');
            // Aquí se podría mostrar un mensaje de éxito
          },
          error: (err) => {
            console.error('Error al crear pedido', err);
            // Aquí se podría mostrar un mensaje de error
          }
        });
    } else {
      this.pedidoService.actualizarPedido(pedidoData)
        .subscribe({
          next: (pedido) => {
            const index = this.pedidos.findIndex(p => p.id === pedido.id);
            if (index !== -1) {
              this.pedidos[index] = pedido;
              this.filtrarPedidos();
            }
            this.toggleFormMode('oculto');
            // Aquí se podría mostrar un mensaje de éxito
          },
          error: (err) => {
            console.error('Error al actualizar pedido', err);
            // Aquí se podría mostrar un mensaje de error
          }
        });
    }
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

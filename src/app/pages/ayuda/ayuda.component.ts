import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class AyudaComponent implements OnInit {
  activeTab: string = 'manual';
  activeFaq: number | null = null;
  contactForm: FormGroup;
  submitted: boolean = false;

  constructor(private formBuilder: FormBuilder) {
    this.contactForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      asunto: ['', Validators.required],
      mensaje: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }

  enviarMensaje(): void {
    this.submitted = true;

    if (this.contactForm.invalid) {
      return;
    }

    console.log('Mensaje enviado:', this.contactForm.value);
    // Aquí iría la lógica para enviar el mensaje

    alert('Su mensaje ha sido enviado. Nos pondremos en contacto con usted pronto.');
    this.contactForm.reset();
    this.submitted = false;
  }
}

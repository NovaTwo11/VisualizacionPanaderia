import { Component, EventEmitter, Input, Output } from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent {
  @Input() placeholder: string = 'Buscar...';
  @Input() searchValue: string = '';
  @Output() searchValueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  onInputChange(): void {
    this.searchValueChange.emit(this.searchValue);
    this.search.emit(this.searchValue);
  }
}

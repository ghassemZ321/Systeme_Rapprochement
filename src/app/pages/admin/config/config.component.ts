import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Config } from '../../../models/models';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  configs: Config[] = [];
  loading = true;
  saving: string | null = null;
  error = '';
  success = '';
  editValues: { [key: string]: string } = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading = true;
    this.api.getConfigs().subscribe({
      next: (c: Config[]) => {
        this.configs = c;
        c.forEach(cfg => this.editValues[cfg.configKey] = cfg.configValue);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  saveConfig(cfg: Config): void {
  this.saving = cfg.configKey;
  this.error = '';
  this.success = '';

  this.api.updateConfig(cfg.configKey, this.editValues[cfg.configKey]).subscribe({
    next: () => {
      this.success = `Paramètre "${cfg.configKey}" mis à jour.`;
      this.saving = null;
      this.loadConfigs();
    },
    error: (err: any) => {
      this.error = err.error?.message || 'Erreur lors de la mise à jour.';
      this.saving = null;
    }
  });
}


  hasChanged(cfg: Config): boolean {
    return this.editValues[cfg.configKey] !== cfg.configValue;
  }
}

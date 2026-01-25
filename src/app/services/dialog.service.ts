import { Injectable, signal } from '@angular/core';

export type DialogType = 'info' | 'success' | 'warning' | 'error';
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface DialogButton {
  label: string;
  variant?: ButtonVariant;
  action?: () => void | Promise<void>;
}

export interface DialogConfig {
  id: string;
  type: DialogType;
  title?: string;
  message: string;
  buttons?: DialogButton[];
  userType?: 'actor' | 'producer'; // For theme matching
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogs = signal<DialogConfig[]>([]);

  // Expose dialogs as a readonly signal
  readonly dialogs$ = this.dialogs.asReadonly();

  private generateId(): string {
    return `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show a dialog with custom configuration
   */
  show(config: Omit<DialogConfig, 'id'>): string {
    const id = this.generateId();
    const dialog: DialogConfig = {
      id,
      ...config,
      buttons: config.buttons || [
        { label: 'OK', variant: 'primary', action: () => this.close(id) }
      ]
    };

    this.dialogs.set([...this.dialogs(), dialog]);
    return id;
  }

  /**
   * Show a simple info dialog
   */
  info(message: string, userType?: 'actor' | 'producer', title?: string): string {
    return this.show({
      type: 'info',
      title,
      message,
      userType,
    });
  }

  /**
   * Show a success dialog
   */
  success(message: string, userType?: 'actor' | 'producer', title?: string): string {
    return this.show({
      type: 'success',
      title,
      message,
      userType,
    });
  }

  /**
   * Show a warning dialog
   */
  warning(message: string, userType?: 'actor' | 'producer', title?: string): string {
    return this.show({
      type: 'warning',
      title,
      message,
      userType,
    });
  }

  /**
   * Show an error dialog
   */
  error(message: string, userType?: 'actor' | 'producer', title?: string): string {
    return this.show({
      type: 'error',
      title,
      message,
      userType,
    });
  }

  /**
   * Show a confirmation dialog with custom actions
   */
  confirm(
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      title?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      confirmVariant?: ButtonVariant;
      userType?: 'actor' | 'producer';
    }
  ): string {
    const id = this.generateId();
    return this.show({
      type: 'warning',
      title: options?.title,
      message,
      userType: options?.userType,
      buttons: [
        {
          label: options?.cancelLabel || 'Cancel',
          variant: 'secondary',
          action: () => this.close(id)
        },
        {
          label: options?.confirmLabel || 'Confirm',
          variant: options?.confirmVariant || 'primary',
          action: async () => {
            await onConfirm();
            this.close(id);
          }
        }
      ]
    });
  }

  /**
   * Close a specific dialog
   */
  close(id: string): void {
    this.dialogs.set(this.dialogs().filter(dialog => dialog.id !== id));
  }

  /**
   * Close all dialogs
   */
  closeAll(): void {
    this.dialogs.set([]);
  }
}

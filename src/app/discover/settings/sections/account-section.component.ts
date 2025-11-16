import { Component, input, signal, computed, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div
        class="text-xs font-medium uppercase tracking-wide mb-6"
        [ngClass]="{
          'text-purple-300/50': isActor(),
          'text-neutral-500': !isActor()
        }"
      >
        Basic Information
      </div>

      <!-- Edit User Information -->
      <div class="space-y-4">
        <!-- Username -->
        <div class="space-y-2">
          <label
            class="text-sm font-medium"
            [ngClass]="{
              'text-purple-200/80': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            Username
          </label>
          <div class="flex gap-3">
            <input
              type="text"
              [value]="localEditableData().name"
              (input)="updateField('name', $event)"
              [disabled]="!isEditingField('name')"
              class="flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
              [ngClass]="{
                'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20':
                  isActor(),
                'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20':
                  !isActor(),
                'opacity-60': !isEditingField('name')
              }"
            />
            <button
              (click)="onToggleEditField('name')"
              class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
              [ngClass]="{
                'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                  isActor() && isEditingField('name'),
                'border-purple-900/30 text-purple-300 hover:bg-purple-950/20':
                  isActor() && !isEditingField('name'),
                'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                  !isActor() && isEditingField('name'),
                'border-neutral-700 text-neutral-300 hover:bg-black/20':
                  !isActor() && !isEditingField('name')
              }"
            >
              {{ isEditingField('name') ? 'Save' : 'Edit' }}
            </button>
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label
            class="text-sm font-medium"
            [ngClass]="{
              'text-purple-200/80': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            Email
          </label>
          <div class="flex gap-3">
            <input
              type="email"
              [value]="localEditableData().email"
              (input)="updateField('email', $event)"
              [disabled]="!isEditingField('email')"
              class="flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
              [ngClass]="{
                'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20':
                  isActor(),
                'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20':
                  !isActor(),
                'opacity-60': !isEditingField('email')
              }"
            />
            <button
              (click)="onToggleEditField('email')"
              class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
              [ngClass]="{
                'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                  isActor() && isEditingField('email'),
                'border-purple-900/30 text-purple-300 hover:bg-purple-950/20':
                  isActor() && !isEditingField('email'),
                'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                  !isActor() && isEditingField('email'),
                'border-neutral-700 text-neutral-300 hover:bg-black/20':
                  !isActor() && !isEditingField('email')
              }"
            >
              {{ isEditingField('email') ? 'Save' : 'Edit' }}
            </button>
          </div>
        </div>

        <!-- Mobile Number -->
        <div class="space-y-2">
          <label
            class="text-sm font-medium"
            [ngClass]="{
              'text-purple-200/80': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            Mobile Number
          </label>
          <div class="flex gap-3">
            <input
              type="tel"
              [value]="localEditableData().phone"
              (input)="updateField('phone', $event)"
              [disabled]="!isEditingField('phone')"
              class="flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
              [ngClass]="{
                'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20':
                  isActor(),
                'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20':
                  !isActor(),
                'opacity-60': !isEditingField('phone')
              }"
            />
            <button
              (click)="onToggleEditField('phone')"
              class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
              [ngClass]="{
                'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                  isActor() && isEditingField('phone'),
                'border-purple-900/30 text-purple-300 hover:bg-purple-950/20':
                  isActor() && !isEditingField('phone'),
                'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                  !isActor() && isEditingField('phone'),
                'border-neutral-700 text-neutral-300 hover:bg-black/20':
                  !isActor() && !isEditingField('phone')
              }"
            >
              {{ isEditingField('phone') ? 'Save' : 'Edit' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Account Type Section -->
      <div
        class="pt-6 border-t"
        [ngClass]="{
          'border-purple-900/20': isActor(),
          'border-neutral-700/50': !isActor()
        }"
      >
        <div
          class="text-xs font-medium uppercase tracking-wide mb-4"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Account Type
        </div>

        <div class="space-y-3">
          <!-- Current Roles Display -->
          <div class="flex flex-wrap gap-2 items-center">
            @for (role of userData()?.roles || []; track role) {
            <span
              class="px-3 py-1.5 text-xs rounded-full font-medium"
              [ngClass]="{
                'bg-purple-600/20 text-purple-300 border border-purple-600/30':
                  role === userData()?.currentRole && isActor(),
                'bg-neutral-600/20 text-neutral-300 border border-neutral-600/30':
                  role === userData()?.currentRole && !isActor(),
                'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50':
                  role !== userData()?.currentRole
              }"
            >
              {{ role | titlecase }}
              @if (role === userData()?.currentRole) {
                <span class="ml-1.5 text-[10px] opacity-75">(Active)</span>
              }
            </span>
            }
          </div>

          <!-- Switch Role Button (shown when user has multiple roles) -->
          @if (canSwitchRole()) {
          <button
            (click)="onSwitchRole()"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all duration-200"
            [ngClass]="{
              'border-purple-600/30 text-purple-300 hover:bg-purple-600/10':
                isActor(),
              'border-neutral-600/30 text-neutral-300 hover:bg-neutral-600/10':
                !isActor()
            }"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Switch to {{ getOtherRoleText() | titlecase }}
          </button>
          }

          <!-- Add Account Button -->
          @if (canAddAccountCheck()) {
          <button
            (click)="onAddAccount()"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                isActor(),
              'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                !isActor()
            }"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add {{ getMissingRoleText() | titlecase }} Account
          </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class AccountSectionComponent {
  isActor = input.required<boolean>();
  userData = input.required<any>();
  editableUserData = input.required<any>();
  editingFields = input.required<Set<string>>();
  toggleEditField =
    input.required<(field: 'name' | 'email' | 'phone') => void>();
  canAddAccount = input.required<() => boolean>();
  getMissingRole = input.required<() => string>();
  addAccount = input.required<() => void>();
  switchRole = input.required<() => void>();

  // Output for data changes
  dataChange = output<{ name: string; email: string; phone: string }>();

  // Local editable data signals for two-way binding
  localEditableData = signal<{ name: string; email: string; phone: string }>({
    name: '',
    email: '',
    phone: '',
  });

  constructor() {
    // Sync local data with input when editableUserData changes
    effect(() => {
      const data = this.editableUserData();
      if (data) {
        this.localEditableData.set({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    }, { allowSignalWrites: true });
  }

  isEditingField(field: string): boolean {
    return this.editingFields().has(field);
  }

  updateField(field: 'name' | 'email' | 'phone', event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    const currentData = this.localEditableData();
    const newData = {
      ...currentData,
      [field]: value
    };
    
    this.localEditableData.set(newData);
    
    // Emit the changes to the parent
    this.dataChange.emit(newData);
  }

  onToggleEditField(field: 'name' | 'email' | 'phone') {
    this.toggleEditField()(field);
  }

  canAddAccountCheck(): boolean {
    return this.canAddAccount()();
  }

  getMissingRoleText(): string {
    return this.getMissingRole()();
  }

  onAddAccount() {
    this.addAccount()();
  }

  canSwitchRole(): boolean {
    const roles = this.userData()?.roles || [];
    return roles.length > 1;
  }

  getOtherRoleText(): string {
    const roles = this.userData()?.roles || [];
    const currentRole = this.userData()?.currentRole;
    const otherRole = roles.find((role: string) => role !== currentRole);
    return otherRole || '';
  }

  onSwitchRole() {
    this.switchRole()();
  }
}

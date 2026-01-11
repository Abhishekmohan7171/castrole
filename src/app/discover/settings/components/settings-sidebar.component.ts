import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SettingsTab =
  | 'account'
  | 'privacy'
  | 'subscriptions'
  | 'analytics'
  | 'support'
  | 'legal';

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-sidebar.component.html',
  styleUrls: ['./settings-sidebar.component.css'],
})
export class SettingsSidebarComponent {
  // Inputs
  availableTabs = input.required<SettingsTab[]>();
  activeTab = input.required<SettingsTab>();
  isActor = input.required<boolean>();

  // Outputs
  tabChange = output<SettingsTab>();

  // Tab configuration methods
  getTabLabel(tab: SettingsTab): string {
    const labels: Record<SettingsTab, string> = {
      account: 'account',
      privacy: 'privacy & security',
      subscriptions: 'subscriptions',
      analytics: 'analytics',
      support: 'support & feedback',
      legal: 'legal',
    };
    return labels[tab];
  }

  getTabIcon(tab: SettingsTab): string {
    const icons: Record<SettingsTab, string> = {
      account:
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      privacy:
        '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      subscriptions:
        '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
      analytics:
        '<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M2 12h20"/>',
      support:
        '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      legal:
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>',
    };
    return icons[tab];
  }

  getTabDescription(tab: SettingsTab): string {
    const descriptions: Record<SettingsTab, string> = {
      account: 'email, phone number, account type',
      privacy: 'visibility, password, activity status, 2fa, blocked users',
      subscriptions: 'manage subscription, plans, payments, history',
      analytics: 'profile views, reach, media library insights',
      support: 'help, bugs, feedback, contact',
      legal: 'terms & conditions, privacy policy, guidelines, about us',
    };
    return descriptions[tab];
  }

  // Event handlers
  onTabClick(tab: SettingsTab): void {
    this.tabChange.emit(tab);
  }
}

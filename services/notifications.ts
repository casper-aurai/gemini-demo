import { InventoryItem, Machine, Notification, NotificationLink, NotificationSource, Vendor, ViewMode } from '../types';

export type NotificationInput = {
  inventory: InventoryItem[];
  machines: Machine[];
  vendors: Vendor[];
};

export class NotificationService {
  private notifications: Notification[] = [];
  private subscribers: ((notifications: Notification[]) => void)[] = [];

  subscribe(handler: (notifications: Notification[]) => void): () => void {
    this.subscribers.push(handler);
    handler(this.notifications);

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== handler);
    };
  }

  markRead(id: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    this.emit();
  }

  markAllRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.emit();
  }

  recompute(data: NotificationInput) {
    this.notifications = this.buildNotifications(data, this.notifications);
    this.emit();
  }

  private emit() {
    this.subscribers.forEach((cb) => cb([...this.notifications]));
  }

  private buildNotifications(
    data: NotificationInput,
    previous: Notification[],
  ): Notification[] {
    const inventoryAlerts = this.inventoryThresholds(
      data.inventory,
      previous,
    );
    const maintenanceAlerts = this.maintenanceSchedules(
      data.machines,
      previous,
    );
    const vendorAlerts = this.vendorDelays(data.vendors, previous);

    return [...inventoryAlerts, ...maintenanceAlerts, ...vendorAlerts].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  private inventoryThresholds(
    items: InventoryItem[],
    previous: Notification[],
  ): Notification[] {
    return items
      .filter((item) => item.quantity <= item.minLevel)
      .map((item) =>
        this.createNotification(
          `inv-${item.id}`,
          'alert',
          'inventory',
          `Low stock: ${item.name} (${item.quantity} ${item.unit})`,
          { view: 'stockroom' satisfies ViewMode, id: item.id },
          previous,
        ),
      );
  }

  private maintenanceSchedules(
    machines: Machine[],
    previous: Notification[],
  ): Notification[] {
    const now = Date.now();
    const soon = now + 7 * 24 * 60 * 60 * 1000;

    return machines
      .flatMap((machine) => {
        const alerts: Notification[] = [];

        if (machine.nextService <= now) {
          alerts.push(
            this.createNotification(
              `maint-${machine.id}`,
              'alert',
              'maintenance',
              `Maintenance overdue: ${machine.name}`,
              { view: 'machines' satisfies ViewMode, id: machine.id },
              previous,
            ),
          );
        } else if (machine.nextService <= soon || machine.status === 'maintenance') {
          alerts.push(
            this.createNotification(
              `maint-${machine.id}`,
              'info',
              'maintenance',
              `Service due soon: ${machine.name}`,
              { view: 'machines' satisfies ViewMode, id: machine.id },
              previous,
            ),
          );
        }

        if (machine.status === 'degraded') {
          alerts.push(
            this.createNotification(
              `maint-status-${machine.id}`,
              'alert',
              'maintenance',
              `Machine degraded: ${machine.name} requires attention`,
              { view: 'machines' satisfies ViewMode, id: machine.id },
              previous,
            ),
          );
        }

        return alerts;
      })
      .filter(Boolean);
  }

  private vendorDelays(
    vendors: Vendor[],
    previous: Notification[],
  ): Notification[] {
    return vendors
      .map((vendor) => {
        const leadTimeDays = this.parseLeadTimeDays(vendor.leadTime);
        if (leadTimeDays === null || leadTimeDays <= 5) return null;

        const type = leadTimeDays > 10 ? 'alert' : 'info';
        const descriptor = leadTimeDays ? `${leadTimeDays} day${leadTimeDays > 1 ? 's' : ''}` : vendor.leadTime;

        return this.createNotification(
          `vendor-${vendor.id}`,
          type,
          'vendor',
          `Vendor delay: ${vendor.name} lead time ${descriptor}`,
          { view: 'supply' satisfies ViewMode, id: vendor.id },
          previous,
        );
      })
      .filter((v): v is Notification => Boolean(v));
  }

  private parseLeadTimeDays(leadTime?: string): number | null {
    if (!leadTime) return null;
    const daysMatch = leadTime.match(/(\d+)(?=\s*day|\s*d)/i);
    const weeksMatch = leadTime.match(/(\d+)(?=\s*week|\s*w)/i);

    if (weeksMatch) return parseInt(weeksMatch[1], 10) * 7;
    if (daysMatch) return parseInt(daysMatch[1], 10);
    return null;
  }

  private createNotification(
    id: string,
    type: Notification['type'],
    source: NotificationSource,
    message: string,
    link: NotificationLink,
    previous: Notification[],
  ): Notification {
    const existing = previous.find((n) => n.id === id);

    return {
      id,
      type,
      source,
      message,
      link,
      timestamp: existing?.timestamp ?? Date.now(),
      read: existing?.read ?? false,
    };
  }
}

export const notificationService = new NotificationService();

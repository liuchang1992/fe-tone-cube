export interface MaintenanceNotice {
  message: string;
  retryAfter: number;
}

type MaintenanceListener = (notice: MaintenanceNotice) => void;

let currentNotice: MaintenanceNotice | null = null;
const listeners = new Set<MaintenanceListener>();

export class MaintenanceError extends Error {
  readonly code = 'maintenance';

  constructor(readonly notice: MaintenanceNotice) {
    super(notice.message);
    this.name = 'MaintenanceError';
  }
}

export const isMaintenanceError = (error: unknown): error is MaintenanceError => (
  error instanceof MaintenanceError
);

export const publishMaintenanceNotice = (notice: MaintenanceNotice) => {
  currentNotice = notice;
  document.documentElement.classList.add('maintenance-mode-active');
  listeners.forEach((listener) => listener(notice));
};

export const getMaintenanceNotice = () => currentNotice;

export const subscribeMaintenanceNotice = (listener: MaintenanceListener) => {
  listeners.add(listener);
  if (currentNotice) listener(currentNotice);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Configuração central — VEHICLE STATUS 2.2 (4 sites)
 */
export const CONFIG = {
  APP_NAME: 'VEHICLE STATUS',
  VERSION: '2.2.0',
  DB_NAME: 'VehicleStatusDB',
  DB_VERSION: 2,
  STORE_NAME: 'clientes',
  META_STORE: 'meta',
  USERS_STORE: 'users',
  ALERT_DAYS: 30,
  CRITICAL_DAYS: 7,
  PAGE_SIZE: 100,
  DEBOUNCE_MS: 280,
  SESSION_KEY: 'vs_session',
};

export const ROLES = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
  USUARIO: 'usuario',
  CLIENTE: 'cliente',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.TECNICO]: 'Técnico',
  [ROLES.USUARIO]: 'Usuário',
  [ROLES.CLIENTE]: 'Cliente',
};

/** Permissões fixas por papel (cada site força o seu) */
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    view: true,
    create: true,
    edit: true,
    editOwnOnly: false,
    delete: true,
    importExport: true,
    manageUsers: true,
  },
  [ROLES.TECNICO]: {
    view: true,
    create: true,
    edit: true,
    editOwnOnly: true,
    delete: false,
    importExport: false,
    manageUsers: false,
  },
  [ROLES.USUARIO]: {
    view: true,
    create: false,
    edit: false,
    editOwnOnly: false,
    delete: false,
    importExport: false,
    manageUsers: false,
  },
  [ROLES.CLIENTE]: {
    view: true,
    create: false,
    edit: false,
    editOwnOnly: false,
    delete: false,
    importExport: false,
    manageUsers: false,
    ownRecordsOnly: true,
  },
};

export const STATUS = {
  LIBERADO: 'LIBERADO',
  AVENCER: 'A VENCER',
  VENCIDO: 'VENCIDO',
  REVISAO: 'REVISÃO',
};

export const STATUS_CLASS = {
  [STATUS.LIBERADO]: 'status-liberado',
  [STATUS.AVENCER]: 'status-avencer',
  [STATUS.VENCIDO]: 'status-vencido',
  [STATUS.REVISAO]: 'status-revisao',
};

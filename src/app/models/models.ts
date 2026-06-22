// ── Auth ────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  mustChangePwd: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ── User ────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: number;
  mustChangePwd: number;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

// ── Import ──────────────────────────────────────────────
export interface ImportResponse {
  batchId: number;
  cutOffId: string;
  fileName: string;
  totalRows: number;
  status: string;
  message: string;
}

export interface BatchSummary {
  id: number;
  fileName: string;
  cutOffId: string;
  totalRows: number;
  status: string;
  importedBy: string;
  importedAt: string;
}

// ── Reconciliation ──────────────────────────────────────
export interface ReconciliationSummary {
  jobId: number;
  batchId: number;
  cutOffId: string;
  totalExcel: number;
  totalCore: number;
  totalConforme: number;
  totalNonConforme: number;
  totalMissingCore: number;
  totalMissingExcel: number;
  launchedBy: string;
  launchedAt: string;
  jobStatus: string;
}

export interface ReconResult {
  id: number;
  switchRef: string;
  montantExcel: number | null;
  montantCore: number | null;
  trxStatus: string | null;
  trxSettled: number | null;
  presence: string;
  conformite: string;
  anomalyCode: string | null;
  anomalySeverity: string | null;
  details: string;
}

// ── Config ──────────────────────────────────────────────
export interface Config {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
}

export interface UpdateConfigRequest {
  configValue: string;
}

// ── Audit ───────────────────────────────────────────────
export interface AuditLog {
  id: number;
  username: string;
  action: string;
  details: string;
  createdAt: string;
}

// ── Dashboard ───────────────────────────────────────────
export interface DashboardStats {
  totalBatches: number;
  totalTransactions: number;
  totalConformes: number;
  totalNonConformes: number;
  totalMissingCore: number;
  totalMissingExcel: number;
  tauxConformite: number;
  batchsReconcilies: number;
  batchsImportes: number;
  dernierBatchCutOff: string;
  dernierBatchDate: string;
  anomaliesCritiques: number;
  anomaliesMajeures: number;
  anomaliesMoyennes: number;
  anomaliesMineurs: number;
}
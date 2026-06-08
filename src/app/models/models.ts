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

export interface ImportResponse {
  importFileId: number;
  fileName: string;
  totalRows: number;
  message: string;
}

export interface ReconciliationResponse {
  jobId: number;
  importFileId: number;
  totalProcessed: number;
  totalMatched: number;
  totalAnomalies: number;
  amountMismatch: number;
  excelOnly: number;
  oracleOnly: number;
  message: string;
}

export interface ResultDetail {
  id: number;
  cutOffId: string;
  refeNumb: string;
  montantExcel: number | null;
  montantOracle: number | null;
  trxStatus: string | null;
  trxSettled: string | null;
  matchStatus: string;
}

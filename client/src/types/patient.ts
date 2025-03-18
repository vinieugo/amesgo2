export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface Patient {
  id?: number;
  name: string;             // Nome completo
  full_name?: string;       // Nome completo (campo alternativo na DB)
  cpf: string;              // CPF
  contact_number: string;   // Número de contato
  authorizer: string;       // Autorizador
  breakfast: boolean;       // Café da manhã (sim/não)
  lunch: boolean;           // Almoço (sim/não)
  dinner: boolean;          // Janta (sim/não)
  has_coffee?: boolean;     // Café da manhã (campo alternativo na DB)
  has_lunch?: boolean;      // Almoço (campo alternativo na DB)
  municipality?: string;    // Município (opcional)
  stay_date?: string;       // Data de estadia (opcional) - será substituído
  start_date?: string;      // Data inicial da hospedagem
  end_date?: string;        // Data final prevista da hospedagem
  status?: PatientStatus;   // Status (opcional)
  observation?: string;     // Observações adicionadas após o cadastro
  initial_observation?: string; // Observações feitas durante o cadastro inicial
  created_at?: string;
  updated_at?: string;
  created_by?: number;      // ID do usuário que cadastrou
  created_by_current_user?: boolean; // Indica se o paciente foi cadastrado pelo usuário atual
  creator_username?: string; // Nome do usuário que cadastrou o paciente
}

export interface PatientFormData {
  name: string;
  cpf: string;
  contact_number: string;
  authorizer: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  observation?: string;     // Observações sobre o paciente (durante cadastro = initial_observation)
  status: PatientStatus;    // Status (obrigatório)
  municipality?: string;    // Município (opcional)
  stay_date?: string;       // Data de estadia (opcional) - será substituído
  start_date?: string;      // Data inicial da hospedagem
  end_date?: string;        // Data final prevista da hospedagem
}

export interface PatientListResponse {
  patients: Patient[];
}

export interface PatientResponse {
  patient: Patient;
  message: string;
} 
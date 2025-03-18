import pool from '../config/db';

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface Patient {
  id?: number;
  name: string;                // Nome completo (novo campo)
  full_name: string;           // Nome completo (campo existente)
  cpf: string;                 // CPF
  contact_number: string;      // Número de contato
  municipality?: string;       // Município
  authorizer: string;          // Autorizador
  has_coffee?: boolean;        // Café da manhã (campo existente)
  has_lunch?: boolean;         // Almoço (campo existente)
  breakfast: boolean;          // Café da manhã (novo campo)
  lunch: boolean;              // Almoço (novo campo)
  dinner: boolean;             // Janta (novo campo)
  start_date?: Date;           // Data de início da estadia
  end_date?: Date;             // Data de término da estadia
  stay_date?: Date;            // Data de estadia (campo legado)
  status?: PatientStatus;      // Status (ACTIVE/INACTIVE)
  observation?: string;        // Observações adicionadas após o cadastro
  initial_observation?: string; // Observações feitas durante o cadastro inicial
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;         // ID do usuário que cadastrou
}

export const createPatient = async (patient: Patient): Promise<number> => {
  // Garantir que tanto os campos novos quanto os existentes sejam preenchidos
  const fullName = patient.full_name || patient.name;
  const hasCoffee = patient.has_coffee !== undefined ? patient.has_coffee : patient.breakfast;
  const hasLunch = patient.has_lunch !== undefined ? patient.has_lunch : patient.lunch;
  
  const [result] = await pool.execute(
    `INSERT INTO patients 
    (name, full_name, cpf, contact_number, authorizer, municipality, 
     breakfast, lunch, dinner, has_coffee, has_lunch, 
     status, stay_date, start_date, end_date, observation, initial_observation, created_at, updated_at, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
    [
      patient.name,
      fullName,
      patient.cpf,
      patient.contact_number,
      patient.authorizer,
      patient.municipality || '',
      patient.breakfast ? 1 : 0,
      patient.lunch ? 1 : 0,
      patient.dinner ? 1 : 0,
      hasCoffee ? 1 : 0,
      hasLunch ? 1 : 0,
      patient.status || PatientStatus.ACTIVE,
      patient.stay_date || new Date(),
      patient.start_date || new Date(),
      patient.end_date || null,
      patient.observation || '',
      patient.initial_observation || patient.observation || '',
      patient.created_by || null
    ]
  );
  return (result as any).insertId;
};

export const getPatientById = async (id: number): Promise<Patient | null> => {
  const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
  return (rows as Patient[])[0] || null;
};

export const getPatientByCpf = async (cpf: string): Promise<Patient | null> => {
  const [rows] = await pool.execute('SELECT * FROM patients WHERE cpf = ?', [cpf]);
  return (rows as Patient[])[0] || null;
};

export const getAllPatients = async (): Promise<Patient[]> => {
  const [rows] = await pool.execute('SELECT * FROM patients ORDER BY created_at DESC');
  return rows as Patient[];
};

export const getAllPatientsIncludingInactive = async (): Promise<Patient[]> => {
  const [rows] = await pool.execute('SELECT * FROM patients ORDER BY created_at DESC');
  return rows as Patient[];
};

export const getActivePatients = async (): Promise<Patient[]> => {
  const [rows] = await pool.execute('SELECT * FROM patients WHERE status = "ACTIVE" ORDER BY created_at DESC');
  return rows as Patient[];
};

export const getInactivePatients = async (): Promise<Patient[]> => {
  const [rows] = await pool.execute('SELECT * FROM patients WHERE status = "INACTIVE" ORDER BY updated_at DESC');
  return rows as Patient[];
};

export const getPatientsByDate = async (date: string): Promise<Patient[]> => {
  const [rows] = await pool.execute(
    'SELECT * FROM patients WHERE DATE(created_at) = ? ORDER BY created_at DESC',
    [date]
  );
  return rows as Patient[];
};

/**
 * Obtém pacientes cadastrados em uma data específica por um usuário específico
 * @param date Data de cadastro no formato 'YYYY-MM-DD'
 * @param userId ID do usuário que cadastrou os pacientes
 * @returns Lista de pacientes cadastrados pelo usuário na data especificada
 */
export const getPatientsByDateAndCreator = async (date: string, userId: number): Promise<Patient[]> => {
  const [rows] = await pool.execute(
    'SELECT * FROM patients WHERE DATE(created_at) = ? AND created_by = ? ORDER BY created_at DESC',
    [date, userId]
  );
  return rows as Patient[];
};

/**
 * Obtém todos os pacientes cadastrados por um usuário específico
 * @param userId ID do usuário que cadastrou os pacientes
 * @returns Lista de pacientes cadastrados pelo usuário
 */
export const getPatientsByCreator = async (userId: number): Promise<Patient[]> => {
  const [rows] = await pool.execute(
    'SELECT * FROM patients WHERE created_by = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows as Patient[];
};

/**
 * Obtém pacientes ativos cadastrados por um usuário específico
 */
export const getActivePatientsByCreator = async (userId: number): Promise<Patient[]> => {
  const [rows] = await pool.execute(
    `SELECT * FROM patients 
     WHERE created_by = ? AND status = ? 
     ORDER BY created_at DESC`,
    [userId, PatientStatus.ACTIVE]
  );
  
  return rows as Patient[];
};

export const updatePatient = async (id: number, patient: Partial<Patient>): Promise<boolean> => {
  try {
    console.log('Iniciando atualização do paciente:', { id, fieldsToUpdate: Object.keys(patient) });
    
    // Verificar se há campos para atualizar
    const fields = Object.keys(patient)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'created_by')
      .map(key => `${key} = ?`);
    
    if (fields.length === 0) {
      console.log('Nenhum campo para atualizar');
      return false;
    }
    
    // Preparar os valores para atualização
    const values = Object.keys(patient)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'created_by')
      .map(key => {
        // Converter valores booleanos para 0 ou 1
        if (['breakfast', 'lunch', 'dinner', 'has_coffee', 'has_lunch'].includes(key)) {
          const boolValue = (patient as any)[key] ? 1 : 0;
          console.log(`Convertendo campo booleano ${key}:`, { original: (patient as any)[key], converted: boolValue });
          return boolValue;
        }
        
        // Verificar se o status é válido
        if (key === 'status') {
          const statusValue = (patient as any)[key];
          console.log(`Verificando valor de status:`, { status: statusValue });
          if (statusValue !== PatientStatus.ACTIVE && statusValue !== PatientStatus.INACTIVE) {
            console.error('Valor de status inválido:', statusValue);
            throw new Error(`Valor de status inválido: ${statusValue}`);
          }
          return statusValue;
        }
        
        // Tratar o campo observation
        if (key === 'observation') {
          const observationValue = (patient as any)[key];
          console.log(`Atualizando campo observation:`, { observation: observationValue });
          // Se for null ou undefined, usar string vazia
          return observationValue === null || observationValue === undefined ? '' : observationValue;
        }
        
        // Tratar o campo initial_observation
        if (key === 'initial_observation') {
          const initialObservationValue = (patient as any)[key];
          console.log(`Atualizando campo initial_observation:`, { initial_observation: initialObservationValue });
          // Se for null ou undefined, usar string vazia
          return initialObservationValue === null || initialObservationValue === undefined ? '' : initialObservationValue;
        }
        
        return (patient as any)[key];
      });
    
    // Adicionar o ID como último parâmetro
    values.push(id);
    
    // Construir a query
    const query = `UPDATE patients SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    console.log('Query de atualização:', { query, values });
    
    // Executar a query
    const [result] = await pool.execute(query, values);
    const affectedRows = (result as any).affectedRows;
    
    console.log('Resultado da atualização:', { id, affectedRows });
    return affectedRows > 0;
  } catch (error) {
    console.error('Erro ao atualizar paciente no modelo:', error);
    throw error;
  }
};

export const deletePatient = async (id: number): Promise<boolean> => {
  try {
    console.log('Iniciando soft delete do paciente:', id);
    
    // Verificar se o paciente existe
    const patient = await getPatientById(id);
    if (!patient) {
      console.error('Paciente não encontrado para soft delete:', id);
      return false;
    }
    
    console.log('Paciente encontrado, atualizando status para INACTIVE:', id);
    
    // Soft delete - apenas atualiza o status para INACTIVE
    const [result] = await pool.execute(
      'UPDATE patients SET status = ?, updated_at = NOW() WHERE id = ?',
      [PatientStatus.INACTIVE, id]
    );
    
    const affectedRows = (result as any).affectedRows;
    console.log('Resultado do soft delete:', { id, affectedRows });
    
    return affectedRows > 0;
  } catch (error) {
    console.error('Erro ao realizar soft delete do paciente:', error);
    throw error;
  }
}; 
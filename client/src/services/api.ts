import axios from 'axios';
import { 
  Patient, 
  PatientFormData, 
  PatientListResponse, 
  PatientResponse,
  PatientStatus
} from '../types/patient';

import { User, UserRole } from '../types/auth';

// Base URL para a API
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Configurar axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adicionar token de autenticação ao header de todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Enviando requisição com token:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('Enviando requisição sem token de autenticação - ATENÇÃO: Isso pode causar erros 403');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Serviço de API para pacientes
export const patientService = {
  // Criar um novo paciente
  createPatient: async (patientData: PatientFormData): Promise<Patient> => {
    try {
      // Verificar se o token está presente
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('API: Tentativa de criar paciente sem token de autenticação!');
        throw new Error('Você precisa estar autenticado para cadastrar pacientes');
      }

      // Garantir que o status seja definido como ACTIVE
      const dataToSend = {
        ...patientData,
        status: patientData.status || PatientStatus.ACTIVE
      };
      
      console.log('API: Enviando dados do paciente para o servidor:', dataToSend);
      console.log('API: Headers da requisição:', {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });
      
      const response = await api.post<PatientResponse>('/v1/patients', dataToSend);
      console.log('API: Resposta do servidor após criar paciente:', response.data);
      return response.data.patient;
    } catch (error: any) {
      console.error('API: Erro ao criar paciente:', error);
      
      // Tratar erros específicos
      if (error.response) {
        console.error('API: Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Tratar erro de autenticação
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Sua sessão expirou ou você não tem permissão para cadastrar pacientes. Por favor, faça login novamente.');
        }
        
        // Tratar erro de validação
        if (error.response.status === 422) {
          throw new Error(error.response.data.message || 'Dados inválidos. Verifique os campos e tente novamente.');
        }
      }
      
      // Erro genérico
      throw error;
    }
  },

  // Obter todos os pacientes ativos
  getAllPatients: async (date?: string): Promise<Patient[]> => {
    try {
      console.log('Chamando API para obter pacientes ativos...');
      const url = date ? `/v1/patients/date/${date}` : '/v1/patients/active';
      const response = await api.get<any>(url);
      console.log('Resposta da API (pacientes ativos):', response.data);
      
      // Verificar se a resposta contém a propriedade 'patients' ou se os dados estão diretamente em 'data'
      const patients = response.data.patients || response.data.data || response.data;
      
      if (!patients || !Array.isArray(patients)) {
        console.error('Formato de resposta inesperado:', response.data);
        return [];
      }
      
      return patients;
    } catch (error: any) {
      console.error('Erro ao obter pacientes ativos:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },

  // Obter todos os pacientes (incluindo inativos)
  getAllPatientsIncludingInactive: async (): Promise<Patient[]> => {
    try {
      console.log('Chamando API para obter todos os pacientes (incluindo inativos)...');
      const response = await api.get<any>('/v1/patients?includeInactive=true');
      console.log('Resposta da API (todos os pacientes):', response.data);
      
      // Verificar se a resposta contém a propriedade 'patients' ou se os dados estão diretamente em 'data'
      const patients = response.data.patients || response.data.data || response.data;
      
      if (!patients || !Array.isArray(patients)) {
        console.error('Formato de resposta inesperado:', response.data);
        return [];
      }
      
      // Verificar se há pacientes com status indefinido
      const undefinedStatusPatients = patients.filter(
        patient => patient.status === undefined
      );
      
      if (undefinedStatusPatients.length > 0) {
        console.warn('Pacientes com status indefinido:', undefinedStatusPatients);
      }
      
      return patients;
    } catch (error: any) {
      console.error('Erro ao obter todos os pacientes:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Erro na requisição (sem resposta):', error.request);
      } else {
        console.error('Erro ao configurar requisição:', error.message);
      }
      throw error;
    }
  },

  // Obter apenas pacientes inativos
  getInactivePatients: async (): Promise<Patient[]> => {
    try {
      console.log('Chamando API para obter pacientes inativos...');
      const response = await api.get<any>('/v1/patients?onlyInactive=true');
      console.log('Resposta da API (pacientes inativos):', response.data);
      
      // Verificar se a resposta contém a propriedade 'patients' ou se os dados estão diretamente em 'data'
      const patients = response.data.patients || response.data.data || response.data;
      
      if (!patients || !Array.isArray(patients)) {
        console.error('Formato de resposta inesperado:', response.data);
        return [];
      }
      
      return patients;
    } catch (error: any) {
      console.error('Erro ao obter pacientes inativos:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },

  // Obter paciente por ID
  getPatientById: async (id: number): Promise<Patient> => {
    const response = await api.get<PatientResponse>(`/v1/patients/${id}`);
    return response.data.patient;
  },

  // Atualizar paciente
  updatePatient: async (id: number, patientData: Partial<Patient>): Promise<Patient> => {
    try {
      console.log(`Atualizando paciente ID ${id} com dados:`, patientData);
      
      // Verificar se o ID é válido
      if (!id) {
        console.error('Erro: Tentativa de atualizar paciente com ID inválido');
        throw new Error('ID de paciente inválido');
      }
      
      const response = await api.put<PatientResponse>(`/v1/patients/${id}`, patientData);
      
      // Verificar se a resposta contém um paciente válido
      if (!response.data || !response.data.patient) {
        console.error('Erro: API retornou uma resposta sem paciente', response);
        throw new Error('Resposta da API inválida');
      }
      
      // Garantir que o paciente retornado tenha um ID
      const patient = response.data.patient;
      if (!patient.id) {
        console.warn('Aviso: API retornou paciente sem ID, adicionando ID manualmente', patient);
        patient.id = id;
      }
      
      console.log(`Paciente ID ${id} atualizado com sucesso:`, patient);
      return patient;
    } catch (error: any) {
      console.error(`Erro ao atualizar paciente ID ${id}:`, error);
      
      // Tratar erros específicos
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Tratar erro de autenticação
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Sua sessão expirou ou você não tem permissão para atualizar pacientes. Por favor, faça login novamente.');
        }
        
        // Tratar erro de validação
        if (error.response.status === 422) {
          throw new Error(error.response.data.message || 'Dados inválidos. Verifique os campos e tente novamente.');
        }
      }
      
      // Erro genérico
      throw error;
    }
  },

  // Excluir paciente
  deletePatient: async (id: number): Promise<void> => {
    await api.delete(`/v1/patients/${id}`);
  },

  // Resetar todos os pacientes (apenas admin)
  resetAllPatients: async (): Promise<{ success: boolean; deletedRows: number }> => {
    try {
      console.log('Solicitando reset de todos os pacientes...');
      const response = await api.post('/v1/patients/reset-all');
      console.log('Resposta do reset de pacientes:', response.data);
      return response.data.data || { success: true, deletedRows: 0 };
    } catch (error: any) {
      console.error('Erro ao resetar pacientes:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  }
};

// Serviço de API para o dashboard
export const dashboardService = {
  // Obter estatísticas gerais
  getStats: async (date?: string, includeInactive: boolean = true) => {
    try {
      let url = '/v1/reports/dashboard/stats?includeInactive=true';
      if (date) {
        url = `/v1/reports/dashboard/stats?date=${date}&includeInactive=true`;
      }
      
      console.log('Buscando estatísticas do dashboard:', url);
      const response = await api.get(url);
      const data = response.data.data || response.data;
      
      // Formatar os dados para o formato esperado pelo componente Dashboard
      return {
        patientStats: {
          total: data.total || 0
        },
        mealStats: {
          breakfastToday: data.meals?.breakfast || 0,
          lunchToday: data.meals?.lunch || 0,
          dinnerToday: data.meals?.dinner || 0
        },
        dailyStats: data.dailyStats || []
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas do dashboard:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },

  // Obter estatísticas detalhadas de refeições
  getMealStats: async (period?: string, includeInactive: boolean = true) => {
    try {
      let url = '/v1/reports/dashboard/meals?includeInactive=true';
      if (period) {
        url = `/v1/reports/dashboard/meals?period=${period}&includeInactive=true`;
      }
      
      console.log('Buscando estatísticas de refeições:', url);
      const response = await api.get(url);
      return response.data.data?.mealStats || response.data.mealStats || response.data;
    } catch (error: any) {
      console.error('Erro ao obter estatísticas de refeições:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  }
};

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

interface CreateUserResponse {
  message: string;
  user: User;
}

// Serviço de API para usuários
export const userService = {
  // Criar um novo usuário (somente admin)
  createUser: async (userData: CreateUserData): Promise<CreateUserResponse> => {
    try {
      console.log('Enviando dados para criar usuário:', userData);
      
      // Obter o token de autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Tentando criar usuário sem token de autenticação');
      }
      
      // Configurar cabeçalhos com o token de autenticação
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.post<any>('/v1/auth/register', userData, { headers });
      console.log('Resposta do servidor ao criar usuário:', response.data);
      
      // Verificar se a resposta contém a propriedade user
      if (response.data && response.data.user) {
        return response.data as CreateUserResponse;
      } else if (response.data && response.data.data) {
        // Tentar extrair o usuário de data.data
        return {
          message: response.data.message || 'Usuário criado com sucesso',
          user: response.data.data
        };
      } else {
        console.error('Formato de resposta inesperado:', response.data);
        throw new Error('Resposta inválida do servidor ao criar usuário');
      }
    } catch (error: any) {
      console.error('Erro detalhado ao criar usuário:', error);
      
      if (error.response) {
        console.error('Detalhes da resposta de erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        if (error.response.status === 400) {
          throw new Error(error.response.data.message || 'Dados inválidos');
        } else if (error.response.status === 401) {
          throw new Error('Não autorizado');
        } else if (error.response.status === 403) {
          throw new Error('Permissão negada');
        } else if (error.response.status === 500) {
          console.error('Erro interno do servidor:', error.response.data);
          throw new Error('Erro interno do servidor ao criar usuário');
        }
      }
      
      throw new Error('Erro ao criar usuário');
    }
  },

  // Obter todos os usuários
  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log('Chamando API para obter todos os usuários...');
      
      // Tentar obter a lista de usuários
      let response;
      try {
        // Primeiro, tentar a rota de administrador
        console.log('Tentando rota de admin para obter usuários...');
        response = await api.get<any>('/auth/users');
        console.log('Resposta da rota de admin:', response.status);
      } catch (adminError) {
        console.log('Erro ao acessar rota de admin, tentando rota alternativa:', adminError);
        // Se falhar, tentar a rota alternativa
        console.log('Tentando rota alternativa para obter usuários...');
        response = await api.get<any>('/auth/all-users');
        console.log('Resposta da rota alternativa:', response.status);
      }
      
      console.log('Resposta completa da API de usuários:', response.status, response.statusText);
      
      // Verificar o formato da resposta e extrair os usuários
      if (response.data) {
        console.log('Dados da resposta:', response.data);
        
        // Verificar se os usuários estão em data.users
        if (response.data.users && Array.isArray(response.data.users)) {
          console.log('Usuários encontrados em response.data.users:', response.data.users.length);
          return response.data.users;
        }
        // Verificar se os usuários estão em data.data
        else if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Usuários encontrados em response.data.data:', response.data.data.length);
          return response.data.data;
        }
        // Verificar se a resposta já é um array
        else if (Array.isArray(response.data)) {
          console.log('Resposta já é um array:', response.data.length);
          return response.data;
        }
        // Logar a resposta para debug
        console.error('Formato de resposta inesperado:', response.data);
        return [];
      } else {
        console.error('Resposta vazia da API');
        return [];
      }
    } catch (error: any) {
      console.error('Erro detalhado ao listar usuários:', error);
      if (error.response) {
        console.error('Detalhes da resposta de erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      // Retornar array vazio em caso de erro para não quebrar a aplicação
      console.warn('Retornando array vazio devido a erro');
      return [];
    }
  }
};

export default api; 
import { Request, Response } from 'express';
import { ApiError } from '../../core/api-error';
import { ApiResponse } from '../../core/api-response';
import { 
  createPatient, 
  getPatientById, 
  getAllPatients, 
  updatePatient, 
  deletePatient, 
  getInactivePatients,
  getAllPatientsIncludingInactive,
  getPatientsByDate,
  getPatientByCpf,
  PatientStatus,
  getPatientsByCreator,
  getPatientsByDateAndCreator,
  getActivePatientsByCreator
} from '../../models/patient.model';
import { UserRole } from '../../models/user.model';
import { getAllUsers } from '../../models/user.model';
import resetAllPatients from '../../utils/reset-patients';

/**
 * Controlador de Pacientes
 * Implementa a lógica de negócios para operações de pacientes
 */
export class PatientsController {
  /**
   * Cadastra um novo paciente
   */
  public createPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        name, 
        cpf, 
        contact_number, 
        authorizer, 
        municipality, 
        breakfast, 
        lunch, 
        dinner, 
        start_date, 
        end_date, 
        observation, 
        status 
      } = req.body;
      
      // Validar campos obrigatórios
      if (!name || !cpf || !contact_number || !authorizer) {
        throw new ApiError('Campos obrigatórios não preenchidos', 422, true);
      }
      
      // Obter o nome do usuário que está cadastrando
      const userId = (req as any).user?.id;
      let creatorUsername = 'Usuário desconhecido';
      
      if (userId) {
        const users = await getAllUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
          creatorUsername = user.username;
        }
      }
      
      // Verificar se já existe um paciente com este CPF
      const existingPatient = await getPatientByCpf(cpf);
      
      // Se encontrou um paciente com o mesmo CPF
      if (existingPatient) {
        // Verificar se o paciente está inativo (pode ser reativado)
        if (existingPatient.status === PatientStatus.INACTIVE) {
          // Reativar o paciente
          const updatedData = {
            status: PatientStatus.ACTIVE,
            name,
            full_name: name,
            contact_number,
            authorizer,
            municipality: creatorUsername, // Usar o nome do usuário que está cadastrando
            breakfast: breakfast || false,
            lunch: lunch || false,
            dinner: dinner || false,
            has_coffee: breakfast || false,
            has_lunch: lunch || false,
            start_date: start_date ? new Date(start_date) : undefined,
            end_date: end_date ? new Date(end_date) : undefined,
            observation,
            updated_at: new Date()
          };
          
          const updated = await updatePatient(existingPatient.id!, updatedData);
          
          if (!updated) {
            throw new ApiError('Erro ao reativar paciente', 500, true);
          }
          
          // Retornar sucesso
          ApiResponse.success(res, { id: existingPatient.id }, 'Paciente reativado com sucesso');
          return;
        } else {
          // Paciente já existe e está ativo
          throw new ApiError('Paciente com este CPF já está cadastrado e ativo', 409, true);
        }
      }
      
      // Criar novo paciente
      const patientData = {
        name,
        full_name: name,
        cpf,
        contact_number,
        authorizer,
        municipality: creatorUsername, // Usar o nome do usuário que está cadastrando
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        has_coffee: breakfast || false,
        has_lunch: lunch || false,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        observation,
        initial_observation: observation,
        status: status || PatientStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId
      };
      
      // Inserir no banco de dados
      const patientId = await createPatient(patientData);
      
      // Retornar resposta
      ApiResponse.created(res, { id: patientId }, 'Paciente cadastrado com sucesso');
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Obtém um paciente pelo ID
   */
  public getPatient = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError('ID inválido', 400, true);
    }
    
    const patient = await getPatientById(id);
    
    if (!patient) {
      throw new ApiError('Paciente não encontrado', 404, true);
    }
    
    ApiResponse.success(res, patient);
  };
  
  /**
   * Obtém todos os pacientes
   */
  public getAllPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      console.log(`[getAllPatients] Usuário: ${userId}, Papel: ${userRole}`);
      
      let patients;
      
      // Se o usuário for do tipo REGISTER, retornar apenas os pacientes cadastrados por ele
      if (userRole === UserRole.REGISTER && userId) {
        console.log(`[getAllPatients] Buscando pacientes cadastrados pelo usuário ${userId} (tipo REGISTER)`);
        patients = await getPatientsByCreator(userId);
      } else {
        console.log(`[getAllPatients] Buscando todos os pacientes (usuário ${userId} é ${userRole})`);
        patients = await getAllPatients();
      }
      
      // Buscar nomes de usuários para incluir nos dados do paciente
      const users = await getAllUsers();
      const usersMap = users.reduce((map: Record<number, string>, user) => {
        if (user && user.id) {
          map[user.id] = user.username;
        }
        return map;
      }, {});
      
      // Adicionar a propriedade created_by_current_user e creator_username aos pacientes
      const patientsWithCreatorInfo = patients.map(patient => ({
        ...patient,
        created_by_current_user: patient.created_by === userId,
        creator_username: patient.created_by ? usersMap[patient.created_by] || 'Usuário desconhecido' : 'Usuário desconhecido'
      }));
      
      console.log(`[getAllPatients] Total de pacientes encontrados: ${patients.length}`);
      res.status(200).json(patientsWithCreatorInfo);
    } catch (error) {
      console.error('[getAllPatients] Erro:', error);
      res.status(500).json({ message: 'Erro ao buscar pacientes' });
    }
  };
  
  /**
   * Obtém todos os pacientes, incluindo inativos
   */
  public getAllPatientsIncludingInactive = async (req: Request, res: Response): Promise<void> => {
    const patients = await getAllPatientsIncludingInactive();
    ApiResponse.success(res, patients);
  };
  
  /**
   * Obtém pacientes ativos
   */
  public getActivePatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      console.log(`[getActivePatients] Usuário: ${userId}, Papel: ${userRole}`);
      
      let patients;
      
      // Se o usuário for do tipo REGISTER, retornar apenas os pacientes cadastrados por ele
      if (userRole === UserRole.REGISTER && userId) {
        console.log(`[getActivePatients] Buscando pacientes ativos cadastrados pelo usuário ${userId} (tipo REGISTER)`);
        patients = await getActivePatientsByCreator(userId);
      } else {
        console.log(`[getActivePatients] Buscando todos os pacientes ativos (usuário ${userId} é ${userRole})`);
        patients = await getAllPatients();
      }
      
      // Buscar nomes de usuários para incluir nos dados do paciente
      const users = await getAllUsers();
      const usersMap = users.reduce((map: Record<number, string>, user) => {
        if (user && user.id) {
          map[user.id] = user.username;
        }
        return map;
      }, {});
      
      // Adicionar a propriedade created_by_current_user e creator_username aos pacientes
      const patientsWithCreatorInfo = patients.map(patient => ({
        ...patient,
        created_by_current_user: patient.created_by === userId,
        creator_username: patient.created_by ? usersMap[patient.created_by] || 'Usuário desconhecido' : 'Usuário desconhecido'
      }));
      
      console.log(`[getActivePatients] Total de pacientes ativos encontrados: ${patients.length}`);
      res.status(200).json(patientsWithCreatorInfo);
    } catch (error) {
      console.error('[getActivePatients] Erro:', error);
      res.status(500).json({ message: 'Erro ao buscar pacientes ativos' });
    }
  };
  
  /**
   * Obtém pacientes inativos
   */
  public getInactivePatients = async (req: Request, res: Response): Promise<void> => {
    const patients = await getInactivePatients();
    ApiResponse.success(res, patients);
  };
  
  /**
   * Obtém pacientes por município
   */
  public getPatientsByMunicipality = async (req: Request, res: Response): Promise<void> => {
    const { municipality } = req.params;
    // Filtrar pacientes pelo município
    const allPatients = await getAllPatients();
    const patients = allPatients.filter(p => 
      p.municipality && p.municipality.toLowerCase() === municipality.toLowerCase()
    );
    ApiResponse.success(res, patients);
  };
  
  /**
   * Obtém pacientes por data
   */
  public getPatientsByDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      console.log(`[getPatientsByDate] Data: ${date}, Usuário: ${userId}, Papel: ${userRole}`);
      
      if (!date) {
        res.status(400).json({ message: 'Data não fornecida' });
        return;
      }
      
      let patients;
      
      // Se o usuário for do tipo REGISTER, retornar apenas os pacientes cadastrados por ele
      if (userRole === UserRole.REGISTER && userId) {
        console.log(`[getPatientsByDate] Buscando pacientes da data ${date} cadastrados pelo usuário ${userId} (tipo REGISTER)`);
        patients = await getPatientsByDateAndCreator(date, userId);
      } else {
        console.log(`[getPatientsByDate] Buscando todos os pacientes da data ${date} (usuário ${userId} é ${userRole})`);
        patients = await getPatientsByDate(date);
      }
      
      // Buscar nomes de usuários para incluir nos dados do paciente
      const users = await getAllUsers();
      const usersMap = users.reduce((map: Record<number, string>, user) => {
        if (user && user.id) {
          map[user.id] = user.username;
        }
        return map;
      }, {});
      
      // Adicionar a propriedade created_by_current_user e creator_username aos pacientes
      const patientsWithCreatorInfo = patients.map(patient => ({
        ...patient,
        created_by_current_user: patient.created_by === userId,
        creator_username: patient.created_by ? usersMap[patient.created_by] || 'Usuário desconhecido' : 'Usuário desconhecido'
      }));
      
      console.log(`[getPatientsByDate] Total de pacientes encontrados para a data ${date}: ${patients.length}`);
      res.status(200).json(patientsWithCreatorInfo);
    } catch (error) {
      console.error('[getPatientsByDate] Erro:', error);
      res.status(500).json({ message: 'Erro ao buscar pacientes por data' });
    }
  };
  
  /**
   * Atualiza um paciente
   */
  public updatePatient = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError('ID inválido', 400, true);
    }
    
    // Verificar se o paciente existe
    const patient = await getPatientById(id);
    
    if (!patient) {
      throw new ApiError('Paciente não encontrado', 404, true);
    }
    
    // Dados para atualização
    const updatedData = {
      ...req.body,
      updated_at: new Date()
    };
    
    // Remover campos que não devem ser atualizados
    delete updatedData.id;
    delete updatedData.created_at;
    delete updatedData.created_by;
    delete updatedData.cpf; // CPF não deve ser alterado
    
    // Converter datas se fornecidas
    if (req.body.start_date) {
      updatedData.start_date = new Date(req.body.start_date);
    }
    if (req.body.end_date) {
      updatedData.end_date = new Date(req.body.end_date);
    }
    
    // Garantir que os campos de refeição sejam atualizados corretamente
    if (req.body.breakfast !== undefined) {
      updatedData.breakfast = req.body.breakfast;
      updatedData.has_coffee = req.body.breakfast;
    }
    if (req.body.lunch !== undefined) {
      updatedData.lunch = req.body.lunch;
      updatedData.has_lunch = req.body.lunch;
    }
    
    // Atualizar no banco de dados
    const updated = await updatePatient(id, updatedData);
    
    if (!updated) {
      throw new ApiError('Erro ao atualizar paciente', 500, true);
    }
    
    // Buscar o paciente atualizado
    const updatedPatient = await getPatientById(id);
    
    if (!updatedPatient) {
      throw new ApiError('Erro ao buscar paciente atualizado', 500, true);
    }
    
    // Retornar resposta
    res.status(200).json({
      message: 'Paciente atualizado com sucesso',
      patient: updatedPatient
    });
  };
  
  /**
   * Exclui um paciente (exclusão lógica)
   */
  public deletePatient = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError('ID inválido', 400, true);
    }
    
    // Verificar se o paciente existe
    const patient = await getPatientById(id);
    
    if (!patient) {
      throw new ApiError('Paciente não encontrado', 404, true);
    }
    
    // Exclusão lógica (marcar como inativo)
    const updated = await updatePatient(id, { 
      status: PatientStatus.INACTIVE,
      updated_at: new Date()
    });
    
    if (!updated) {
      throw new ApiError('Erro ao excluir paciente', 500, true);
    }
    
    // Retornar resposta
    ApiResponse.success(res, null, 'Paciente excluído com sucesso');
  };
  
  /**
   * Busca pacientes por CPF
   */
  public searchPatientByCPF = async (req: Request, res: Response): Promise<void> => {
    const { cpf } = req.params;
    const patient = await getPatientByCpf(cpf);
    ApiResponse.success(res, patient ? [patient] : []);
  };
  
  /**
   * Busca avançada de pacientes
   */
  public searchPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, cpf, municipality, status, startDate, endDate } = req.body;
      
      // Obter todos os pacientes
      const allPatients = await getAllPatientsIncludingInactive();
      
      // Filtrar com base nos critérios de busca
      let filteredPatients = allPatients;
      
      // Filtrar por nome
      if (name) {
        filteredPatients = filteredPatients.filter(p => 
          p.name.toLowerCase().includes(name.toLowerCase())
        );
      }
      
      // Filtrar por CPF
      if (cpf) {
        filteredPatients = filteredPatients.filter(p => 
          p.cpf.includes(cpf)
        );
      }
      
      // Filtrar por município
      if (municipality) {
        filteredPatients = filteredPatients.filter(p => 
          p.municipality && p.municipality.toLowerCase().includes(municipality.toLowerCase())
        );
      }
      
      // Filtrar por status
      if (status) {
        filteredPatients = filteredPatients.filter(p => 
          p.status === status
        );
      }
      
      // Filtrar por data de início
      if (startDate) {
        const start = new Date(startDate);
        filteredPatients = filteredPatients.filter(p => 
          p.start_date && new Date(p.start_date) >= start
        );
      }
      
      // Filtrar por data de término
      if (endDate) {
        const end = new Date(endDate);
        filteredPatients = filteredPatients.filter(p => 
          p.end_date && new Date(p.end_date) <= end
        );
      }
      
      ApiResponse.success(res, filteredPatients, 'Busca realizada com sucesso');
    } catch (error) {
      console.error('Erro ao realizar busca de pacientes:', error);
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
  
  /**
   * Reseta todos os pacientes (apenas para administradores)
   * Esta operação é irreversível e remove todos os pacientes do banco de dados
   */
  public resetAllPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[resetAllPatients] Iniciando reset de todos os pacientes');
      
      // Verificar se o usuário é administrador
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || userRole !== 'admin') {
        console.error('[resetAllPatients] Acesso negado. Usuário não é administrador:', { userId, userRole });
        throw new ApiError('Apenas administradores podem resetar todos os pacientes', 403);
      }
      
      // Executar o reset
      const result = await resetAllPatients();
      
      console.log('[resetAllPatients] Reset concluído com sucesso:', result);
      
      ApiResponse.success(
        res,
        { 
          message: 'Todos os pacientes foram removidos com sucesso',
          ...result
        },
        'Reset de pacientes concluído'
      );
    } catch (error) {
      console.error('[resetAllPatients] Erro ao resetar pacientes:', error);
      
      if (error instanceof ApiError) {
        ApiResponse.error(res, error);
      } else {
        ApiResponse.serverError(res, error as Error);
      }
    }
  };
}

// Exportar uma instância do controlador
export const patientsController = new PatientsController(); 
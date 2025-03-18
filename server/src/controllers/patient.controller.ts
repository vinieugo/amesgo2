import { Request, Response } from 'express';
import { 
  Patient, 
  PatientStatus,
  createPatient, 
  getPatientById, 
  getPatientByCpf,
  getAllPatients,
  getPatientsByDate, 
  updatePatient,
  deletePatient,
  getAllPatientsIncludingInactive,
  getInactivePatients
} from '../models/patient.model';
import ApiError from '../utils/apiError';

// Criar um novo paciente
export const createPatientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, cpf, contact_number, authorizer, 
      municipality, breakfast, lunch, dinner, 
      start_date, end_date, stay_date, observation, status 
    } = req.body;

    console.log('Dados recebidos para cadastro de paciente:', req.body);

    // Verificações básicas de dados
    if (!name || !cpf || !contact_number || !authorizer) {
      res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
      return;
    }

    // Verificar se o paciente já existe
    const existingPatient = await getPatientByCpf(cpf);
    if (existingPatient) {
      // Verificar se o paciente existente está inativo
      if (existingPatient.status === PatientStatus.INACTIVE) {
        console.log('Paciente com CPF já cadastrado, mas inativo. Reativando paciente:', cpf);
        
        // Atualizar o paciente existente para ativo com os novos dados
        const updatedPatient = {
          ...existingPatient,
          name,
          full_name: name,
          contact_number,
          authorizer,
          municipality: municipality || '',
          breakfast: breakfast || false,
          lunch: lunch || false,
          dinner: dinner || false,
          has_coffee: breakfast || false,
          has_lunch: lunch || false,
          start_date: start_date ? new Date(start_date) : new Date(),
          end_date: end_date ? new Date(end_date) : undefined,
          stay_date: stay_date ? new Date(stay_date) : new Date(),
          initial_observation: observation || existingPatient.initial_observation || '',
          status: PatientStatus.ACTIVE, // Garantir que o status seja ACTIVE
          updated_at: new Date()
        };
        
        console.log('Dados do paciente para reativação:', updatedPatient);
        
        await updatePatient(existingPatient.id as number, updatedPatient);
        
        res.status(200).json({
          message: 'Paciente reativado com sucesso',
          patient: updatedPatient
        });
        return;
      }
      
      // Se o paciente já estiver ativo, apenas atualizar os dados
      console.log('Paciente com CPF já cadastrado e ativo. Atualizando dados:', cpf);
      
      const updatedPatient = {
        ...existingPatient,
        name,
        full_name: name,
        contact_number,
        authorizer,
        municipality: municipality || '',
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        has_coffee: breakfast || false,
        has_lunch: lunch || false,
        start_date: start_date ? new Date(start_date) : existingPatient.start_date || new Date(),
        end_date: end_date ? new Date(end_date) : existingPatient.end_date,
        stay_date: stay_date ? new Date(stay_date) : existingPatient.stay_date,
        initial_observation: observation || existingPatient.initial_observation || '',
        status: PatientStatus.ACTIVE, // Garantir que o status seja ACTIVE
        updated_at: new Date()
      };
      
      console.log('Dados do paciente para atualização:', updatedPatient);
      
      await updatePatient(existingPatient.id as number, updatedPatient);
      
      res.status(200).json({
        message: 'Dados do paciente atualizados com sucesso',
        patient: updatedPatient
      });
      return;
    }

    // Criar o novo paciente
    const newPatient: Patient = {
      name,
      full_name: name, // Usar o mesmo valor para ambos os campos
      cpf,
      contact_number,
      authorizer,
      municipality: municipality || '',
      breakfast: breakfast || false,
      lunch: lunch || false,
      dinner: dinner || false,
      has_coffee: breakfast || false, // Sincronizar com o campo breakfast
      has_lunch: lunch || false,      // Sincronizar com o campo lunch
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : undefined,
      stay_date: stay_date ? new Date(stay_date) : new Date(),
      initial_observation: observation || '', // Usar a observação do cadastro como observação inicial
      observation: '', // Iniciar com observação vazia para atualizações futuras
      status: PatientStatus.ACTIVE, // Garantir que o status seja ACTIVE
      created_at: new Date(),
      updated_at: new Date(),
      created_by: req.user?.id // Adicionar o ID do usuário que está criando o paciente
    };

    console.log('Dados do novo paciente para criação:', newPatient);

    const patientId = await createPatient(newPatient);

    console.log('Paciente criado com sucesso. ID:', patientId);

    res.status(201).json({
      message: 'Paciente cadastrado com sucesso',
      patient: {
        id: patientId,
        ...newPatient
      }
    });
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    res.status(500).json({ message: 'Erro ao cadastrar paciente' });
  }
};

// Obter paciente por ID
export const getPatientByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await getPatientById(Number(id));

    if (!patient) {
      res.status(404).json({ message: 'Paciente não encontrado' });
      return;
    }

    res.status(200).json({ patient });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({ message: 'Erro ao buscar paciente' });
  }
};

// Listar todos os pacientes
export const getAllPatientsController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se há um filtro de data ou status
    const { date, includeInactive, onlyInactive } = req.query;

    let patients;
    if (date && typeof date === 'string') {
      // Filtrar por data
      patients = await getPatientsByDate(date);
    } else if (onlyInactive === 'true') {
      // Listar apenas inativos
      patients = await getInactivePatients();
    } else {
      // Listar todos os pacientes, incluindo inativos, por padrão
      patients = await getAllPatientsIncludingInactive();
    }

    res.status(200).json({ patients });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({ message: 'Erro ao listar pacientes' });
  }
};

// Atualizar paciente
export const updatePatientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Atualizando paciente:', { id, updateData });

    // Verificar se o ID é válido
    if (!id || isNaN(Number(id))) {
      console.error('ID de paciente inválido:', id);
      res.status(400).json({ message: 'ID de paciente inválido' });
      return;
    }

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    // Sincronizar campos duplicados
    if ('name' in updateData && !('full_name' in updateData)) {
      updateData.full_name = updateData.name;
    }
    if ('breakfast' in updateData && !('has_coffee' in updateData)) {
      updateData.has_coffee = updateData.breakfast;
    }
    if ('lunch' in updateData && !('has_lunch' in updateData)) {
      updateData.has_lunch = updateData.lunch;
    }

    // Converter valores booleanos
    if ('breakfast' in updateData) {
      updateData.breakfast = Boolean(updateData.breakfast);
    }
    if ('lunch' in updateData) {
      updateData.lunch = Boolean(updateData.lunch);
    }
    if ('dinner' in updateData) {
      updateData.dinner = Boolean(updateData.dinner);
    }
    if ('has_coffee' in updateData) {
      updateData.has_coffee = Boolean(updateData.has_coffee);
    }
    if ('has_lunch' in updateData) {
      updateData.has_lunch = Boolean(updateData.has_lunch);
    }

    const patient = await getPatientById(Number(id));
    if (!patient) {
      console.error('Paciente não encontrado:', id);
      res.status(404).json({ message: 'Paciente não encontrado' });
      return;
    }

    // Verificar se o status está sendo atualizado
    if ('status' in updateData) {
      console.log('Atualizando status do paciente:', { 
        id,
        oldStatus: patient.status, 
        newStatus: updateData.status 
      });
      
      // Garantir que o status seja um valor válido
      if (updateData.status !== 'ACTIVE' && updateData.status !== 'INACTIVE') {
        console.error('Valor de status inválido:', updateData.status);
        res.status(400).json({ message: 'Valor de status inválido' });
        return;
      }
    }

    console.log('Dados do paciente antes da atualização:', patient);

    try {
      const updated = await updatePatient(Number(id), updateData);
      
      if (!updated) {
        throw new ApiError(500, 'Erro ao atualizar paciente');
      }
      
      // Buscar o paciente atualizado
      const updatedPatient = await getPatientById(Number(id));
      
      if (!updatedPatient) {
        throw new ApiError(500, 'Erro ao buscar paciente atualizado');
      }
      
      // Retornar resposta
      res.status(200).json({
        message: 'Paciente atualizado com sucesso',
        patient: updatedPatient
      });
    } catch (updateError) {
      console.error('Erro durante a atualização do paciente:', updateError);
      res.status(500).json({ message: 'Erro ao atualizar paciente no banco de dados' });
    }
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({ message: 'Erro ao atualizar paciente' });
  }
};

// Excluir paciente (soft delete)
export const deletePatientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await getPatientById(Number(id));
    if (!patient) {
      res.status(404).json({ message: 'Paciente não encontrado' });
      return;
    }

    const success = await deletePatient(Number(id));
    if (!success) {
      res.status(400).json({ message: 'Não foi possível excluir o paciente' });
      return;
    }

    res.status(200).json({ message: 'Paciente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    res.status(500).json({ message: 'Erro ao excluir paciente' });
  }
}; 
import pool from '../config/db';
import { PatientStatus } from '../models/patient.model';

/**
 * Script para verificar o status do banco de dados e os pacientes cadastrados
 */
const checkDatabase = async () => {
  try {
    console.log('Verificando conexão com o banco de dados...');
    const connection = await pool.getConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar tabela de pacientes
    console.log('Verificando tabela de pacientes...');
    const [patientsResult] = await connection.query('SELECT COUNT(*) as count FROM patients');
    const patientsCount = (patientsResult as any)[0].count;
    console.log(`Total de pacientes cadastrados: ${patientsCount}`);
    
    // Verificar pacientes ativos
    const [activeResult] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE status = ?',
      [PatientStatus.ACTIVE]
    );
    const activeCount = (activeResult as any)[0].count;
    console.log(`Total de pacientes ativos: ${activeCount}`);
    
    // Verificar pacientes inativos
    const [inactiveResult] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE status = ?',
      [PatientStatus.INACTIVE]
    );
    const inactiveCount = (inactiveResult as any)[0].count;
    console.log(`Total de pacientes inativos: ${inactiveCount}`);
    
    // Verificar pacientes sem status definido
    const [undefinedResult] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE status IS NULL OR status = ""'
    );
    const undefinedCount = (undefinedResult as any)[0].count;
    console.log(`Total de pacientes sem status definido: ${undefinedCount}`);
    
    // Se houver pacientes sem status definido, atualizá-los para ACTIVE
    if (undefinedCount > 0) {
      console.log('Atualizando pacientes sem status definido para ACTIVE...');
      const [updateResult] = await connection.query(
        'UPDATE patients SET status = ? WHERE status IS NULL OR status = ""',
        [PatientStatus.ACTIVE]
      );
      console.log(`Pacientes atualizados: ${(updateResult as any).affectedRows}`);
    }
    
    // Liberar a conexão
    connection.release();
    console.log('Verificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar o banco de dados:', error);
  }
};

// Executar a verificação
checkDatabase();

export default checkDatabase; 
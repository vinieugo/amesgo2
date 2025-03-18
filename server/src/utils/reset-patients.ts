import pool from '../config/db';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para resetar todos os pacientes no banco de dados
 * Este script pode ser executado diretamente com: ts-node src/utils/reset-patients.ts
 * Ou através do comando npm: npm run reset-patients
 */
async function resetAllPatients() {
  console.log('Iniciando processo de reset de todos os pacientes...');
  
  try {
    // Verificar se estamos em ambiente de produção
    if (process.env.NODE_ENV === 'production') {
      // Solicitar confirmação adicional para ambiente de produção
      console.error('ATENÇÃO: Você está tentando resetar pacientes em ambiente de PRODUÇÃO!');
      console.error('Esta operação não pode ser desfeita e resultará na perda de todos os dados de pacientes.');
      console.error('Para continuar, defina a variável de ambiente FORCE_RESET=true');
      
      if (process.env.FORCE_RESET !== 'true') {
        console.error('Operação cancelada. Defina FORCE_RESET=true para continuar.');
        process.exit(1);
      }
    }
    
    // Opção 1: Excluir todos os registros (hard delete)
    const [deleteResult] = await pool.execute('DELETE FROM patients');
    const deletedRows = (deleteResult as any).affectedRows;
    
    // Opção 2: Resetar o auto-incremento da tabela
    await pool.execute('ALTER TABLE patients AUTO_INCREMENT = 1');
    
    console.log(`Reset concluído com sucesso! ${deletedRows} pacientes foram removidos.`);
    console.log('O auto-incremento da tabela foi resetado para 1.');
    
    // Fechar a conexão com o banco de dados
    await pool.end();
    
    return { success: true, deletedRows };
  } catch (error) {
    console.error('Erro ao resetar pacientes:', error);
    
    // Fechar a conexão com o banco de dados mesmo em caso de erro
    try {
      await pool.end();
    } catch (closeError) {
      console.error('Erro ao fechar conexão com o banco de dados:', closeError);
    }
    
    throw error;
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  resetAllPatients()
    .then(result => {
      console.log('Resultado do reset:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Falha ao executar reset:', error);
      process.exit(1);
    });
}

export default resetAllPatients; 
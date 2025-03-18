import fs from 'fs';
import path from 'path';
import pool from './db';

async function updateDatabase() {
  try {
    console.log('Iniciando atualização do banco de dados...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'update-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim() !== '');
    
    // Executar cada comando
    for (const command of commands) {
      try {
        await pool.execute(command);
        console.log('Comando SQL executado com sucesso:', command.substring(0, 50) + '...');
      } catch (error) {
        console.error('Erro ao executar comando SQL:', command);
        console.error('Detalhes do erro:', error);
      }
    }
    
    console.log('Atualização do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar o banco de dados:', error);
  } finally {
    // Encerrar o pool de conexões
    await pool.end();
  }
}

// Executar a função
updateDatabase(); 
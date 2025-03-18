import fs from 'fs';
import path from 'path';
import pool from './db';

async function addColumns() {
  try {
    console.log('Iniciando adição de colunas...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'add-columns.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim() !== '');
    
    // Executar cada comando
    for (const command of commands) {
      try {
        await pool.execute(command);
        console.log('Comando SQL executado com sucesso:', command.substring(0, 50) + '...');
      } catch (error: any) {
        // Ignorar erro se a coluna já existir
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('Coluna já existe:', command.substring(0, 50) + '...');
        } else {
          console.error('Erro ao executar comando SQL:', command);
          console.error('Detalhes do erro:', error);
        }
      }
    }
    
    console.log('Adição de colunas concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    // Encerrar o pool de conexões
    await pool.end();
  }
}

// Executar a função
addColumns(); 
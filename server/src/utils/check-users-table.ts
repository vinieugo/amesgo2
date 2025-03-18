import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsersTable() {
  try {
    // Verificar a estrutura da tabela
    const [columns] = await pool.execute('DESCRIBE users');
    console.log('Estrutura da tabela users:');
    console.log(columns);
    
    // Verificar se existem usuários
    const [users] = await pool.execute('SELECT * FROM users');
    const usersArray = users as any[];
    console.log(`Total de usuários: ${usersArray.length}`);
    
    if (usersArray.length > 0) {
      console.log('Primeiro usuário:');
      console.log(usersArray[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao verificar tabela de usuários:', error);
    process.exit(1);
  }
}

checkUsersTable(); 
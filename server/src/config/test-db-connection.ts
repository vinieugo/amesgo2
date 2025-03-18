import pool, { testConnection } from '../config/db';

// Testar a conexão com o banco de dados
const testDb = async () => {
  try {
    await testConnection();
    console.log('Conexão com o banco de dados bem-sucedida!');
    
    // Testar os usuários
    const [users] = await pool.query('SELECT * FROM users LIMIT 5');
    console.log('Usuários encontrados:', users);
    
    // Testar as outras tabelas
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tabelas no banco de dados:', tables);

  } catch (error) {
    console.error('Erro ao testar a conexão com o banco de dados:', error);
  } finally {
    process.exit(0);
  }
};

testDb(); 
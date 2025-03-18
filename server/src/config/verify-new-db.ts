import pool, { testConnection } from '../config/db';

// Testar a conexão com o banco de dados
const testNewDb = async () => {
  try {
    await testConnection();
    console.log('Conexão com o novo banco de dados bem-sucedida!');
    
    // Testar as tabelas
    console.log('\nVerificando tabelas existentes:');
    const [tables] = await pool.query('SHOW TABLES');
    console.log(tables);
    
    // Testar os usuários
    console.log('\nVerificando usuários:');
    const [users] = await pool.query('SELECT * FROM users');
    console.log(users);
    
    // Verificar estrutura da tabela de usuários
    console.log('\nEstrutura da tabela de usuários:');
    const [userStructure] = await pool.query('DESCRIBE users');
    console.log(userStructure);
    
    // Verificar estrutura da tabela de pacientes
    console.log('\nEstrutura da tabela de pacientes:');
    const [patientStructure] = await pool.query('DESCRIBE patients');
    console.log(patientStructure);

  } catch (error) {
    console.error('Erro ao testar a conexão com o banco de dados:', error);
  } finally {
    process.exit(0);
  }
};

testNewDb(); 
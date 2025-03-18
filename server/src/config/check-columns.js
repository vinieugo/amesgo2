const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
  try {
    // Criar conexão com o banco de dados
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amesgo'
    });

    console.log('Conectado ao banco de dados');

    // Verificar todas as colunas da tabela patients
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'patients'",
      [process.env.DB_NAME || 'amesgo']
    );

    console.log('Colunas da tabela patients:');
    columns.forEach(column => {
      console.log(`- ${column.COLUMN_NAME}`);
    });

    await connection.end();
    console.log('Conexão encerrada');
  } catch (error) {
    console.error('Erro ao verificar colunas:', error);
  }
}

checkColumns(); 
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addColumns() {
  try {
    // Criar conexão com o banco de dados
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amesgo'
    });

    console.log('Conectado ao banco de dados');

    // Verificar se a coluna start_date já existe
    const [startDateColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'start_date'",
      [process.env.DB_NAME || 'amesgo']
    );

    if (startDateColumns.length === 0) {
      console.log('Adicionando coluna start_date');
      await connection.execute(
        "ALTER TABLE patients ADD COLUMN start_date DATETIME DEFAULT CURRENT_TIMESTAMP"
      );
      console.log('Coluna start_date adicionada com sucesso');
    } else {
      console.log('Coluna start_date já existe');
    }

    // Verificar se a coluna end_date já existe
    const [endDateColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'end_date'",
      [process.env.DB_NAME || 'amesgo']
    );

    if (endDateColumns.length === 0) {
      console.log('Adicionando coluna end_date');
      await connection.execute(
        "ALTER TABLE patients ADD COLUMN end_date DATETIME DEFAULT NULL"
      );
      console.log('Coluna end_date adicionada com sucesso');
    } else {
      console.log('Coluna end_date já existe');
    }

    // Copiar valores de stay_date para start_date para manter compatibilidade
    console.log('Atualizando valores de start_date com base em stay_date');
    await connection.execute(
      "UPDATE patients SET start_date = stay_date WHERE start_date IS NULL AND stay_date IS NOT NULL"
    );
    console.log('Valores atualizados com sucesso');

    await connection.end();
    console.log('Conexão encerrada');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  }
}

addColumns(); 
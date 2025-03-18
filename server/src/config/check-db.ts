import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  let connection;

  try {
    // Carregar variáveis de ambiente
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || 'root';
    const dbName = process.env.DB_NAME || 'amesgo';

    console.log(`Conectando ao MySQL em ${dbHost} com usuário ${dbUser}`);

    // Conectar ao servidor MySQL
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName
    });

    console.log(`Conectado ao banco de dados ${dbName}`);

    // Verificar tabelas existentes
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tabelas existentes:');
    console.log(tables);

    // Verificar estrutura da tabela users
    console.log('\nEstrutura da tabela users:');
    const [userColumns] = await connection.query('DESCRIBE users');
    console.log(userColumns);

    // Tentar inserir o usuário admin manualmente
    try {
      const adminQuery = `
        INSERT INTO users (username, password, email, role)
        VALUES ('admin', '$2a$10$9/XlyCGhHn4JKM4WzX78p.xU4HLKSCn0Ixy.kCcwD4nKlXa5e8lXu', 'admin@amesgo.com', 'admin')
        ON DUPLICATE KEY UPDATE username = 'admin'`;
      
      await connection.query(adminQuery);
      console.log('Usuário admin inserido com sucesso.');
    } catch (insertError) {
      console.error('Erro ao inserir usuário admin:', insertError);
      
      // Recriar a tabela de usuários
      console.log('\nTentando recriar a tabela users...');
      await connection.query('DROP TABLE IF EXISTS users');
      await connection.query(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          role ENUM('admin', 'client', 'register') NOT NULL DEFAULT 'register',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabela users recriada. Inserindo usuário admin...');
      
      await connection.query(`
        INSERT INTO users (username, password, email, role)
        VALUES ('admin', '$2a$10$9/XlyCGhHn4JKM4WzX78p.xU4HLKSCn0Ixy.kCcwD4nKlXa5e8lXu', 'admin@amesgo.com', 'admin')
      `);
      console.log('Usuário admin inserido com sucesso após recriar a tabela.');
    }

  } catch (error) {
    console.error('Erro ao verificar o banco de dados:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados fechada');
    }
  }
}

// Executar a verificação
checkDatabase(); 
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function initializeDatabase() {
  let connection;

  try {
    // Carregar variáveis de ambiente
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || 'root';
    const dbName = process.env.DB_NAME || 'amesgonew';

    console.log(`Conectando ao MySQL em ${dbHost} com usuário ${dbUser}`);

    // Primeiro conecta sem especificar um banco de dados
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true // Necessário para executar múltiplas consultas
    });

    console.log('Conectado ao servidor MySQL');

    // Criar o banco de dados se não existir
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Banco de dados ${dbName} criado ou já existente`);

    // Conectar ao banco de dados específico
    await connection.query(`USE ${dbName}`);
    console.log(`Usando banco de dados ${dbName}`);

    // Criar tabela de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        role ENUM('admin', 'client', 'register') NOT NULL DEFAULT 'register',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela de usuários criada ou já existente');

    // Dropar e recriar tabela de pacientes
    await connection.query('DROP TABLE IF EXISTS patients');
    console.log('Tabela de pacientes removida (se existia)');

    // Criar tabela de pacientes
    await connection.query(`
      CREATE TABLE patients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        cpf VARCHAR(14) NOT NULL UNIQUE,
        contact_number VARCHAR(20) NOT NULL,
        municipality VARCHAR(100) DEFAULT '',
        authorizer VARCHAR(100) NOT NULL,
        breakfast BOOLEAN NOT NULL DEFAULT 0,
        lunch BOOLEAN NOT NULL DEFAULT 0,
        dinner BOOLEAN NOT NULL DEFAULT 0,
        has_coffee BOOLEAN NOT NULL DEFAULT 0,
        has_lunch BOOLEAN NOT NULL DEFAULT 0,
        stay_date DATE DEFAULT (CURRENT_DATE),
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Tabela de pacientes recriada');

    // Criar tabela de logs de atividades
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Tabela de logs de atividades criada ou já existente');

    // Inserir usuário administrador padrão
    try {
      await connection.query(`
        INSERT INTO users (username, password, email, role)
        VALUES ('admin', '$2a$10$9/XlyCGhHn4JKM4WzX78p.xU4HLKSCn0Ixy.kCcwD4nKlXa5e8lXu', 'admin@amesgo.com', 'admin')
        ON DUPLICATE KEY UPDATE username = 'admin'
      `);
      console.log('Usuário administrador padrão criado ou atualizado');
    } catch (insertError) {
      console.error('Erro ao inserir usuário admin:', insertError);
    }

    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados fechada');
    }
  }
}

// Executa a inicialização se o script for executado diretamente
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase; 
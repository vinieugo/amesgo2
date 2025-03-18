-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS amesgo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE amesgo;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  role ENUM('admin', 'client', 'register') NOT NULL DEFAULT 'register',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  contact_number VARCHAR(20) NOT NULL,
  authorizer VARCHAR(100) NOT NULL,
  municipality VARCHAR(100) DEFAULT '',
  breakfast BOOLEAN NOT NULL DEFAULT 0,
  lunch BOOLEAN NOT NULL DEFAULT 0,
  dinner BOOLEAN NOT NULL DEFAULT 0,
  has_coffee BOOLEAN NOT NULL DEFAULT 0,
  has_lunch BOOLEAN NOT NULL DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  observation TEXT,
  stay_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de logs de atividades
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Inserir usuário administrador padrão (senha: admin123)
INSERT INTO users (username, password, email, role)
VALUES ('admin', '$2a$10$9/XlyCGhHn4JKM4WzX78p.xU4HLKSCn0Ixy.kCcwD4nKlXa5e8lXu', 'admin@amesgo.com', 'admin')
ON DUPLICATE KEY UPDATE username = 'admin'; 
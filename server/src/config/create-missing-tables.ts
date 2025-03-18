import pool from '../config/db';

// Criar as tabelas que estão faltando
const createMissingTables = async () => {
  try {
    console.log('Criando tabelas ausentes no banco de dados...');
    
    // Verificar tabelas existentes
    const [existingTables] = await pool.query('SHOW TABLES');
    console.log('Tabelas existentes:', existingTables);
    
    const tableNames = (existingTables as any[]).map(t => Object.values(t)[0]);
    
    // Criar tabela de pacientes se não existir
    if (!tableNames.includes('patients')) {
      console.log('Criando tabela de pacientes...');
      await pool.query(`
        CREATE TABLE patients (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          cpf VARCHAR(14) NOT NULL UNIQUE,
          contact_number VARCHAR(20) NOT NULL,
          authorizer VARCHAR(100) NOT NULL,
          breakfast BOOLEAN NOT NULL DEFAULT 0,
          lunch BOOLEAN NOT NULL DEFAULT 0,
          dinner BOOLEAN NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_by INT,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      console.log('Tabela de pacientes criada com sucesso!');
    } else {
      console.log('Tabela de pacientes já existe');
    }
    
    // Criar tabela de logs de atividades se não existir
    if (!tableNames.includes('activity_logs')) {
      console.log('Criando tabela de logs de atividades...');
      await pool.query(`
        CREATE TABLE activity_logs (
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
      console.log('Tabela de logs de atividades criada com sucesso!');
    } else {
      console.log('Tabela de logs de atividades já existe');
    }
    
    console.log('Todas as tabelas necessárias foram verificadas/criadas!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    process.exit(0);
  }
};

createMissingTables(); 
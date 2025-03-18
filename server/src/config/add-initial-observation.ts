import pool from '../config/db';

async function addInitialObservationColumn() {
  console.log('Iniciando adição da coluna initial_observation...');
  
  try {
    // Verificar se a coluna já existe
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM patients LIKE 'initial_observation'
    `);
    
    // Se a coluna não existir, adicioná-la
    if (Array.isArray(columns) && columns.length === 0) {
      console.log('Coluna initial_observation não encontrada. Adicionando...');
      
      await pool.execute(`
        ALTER TABLE patients ADD COLUMN initial_observation TEXT AFTER observation
      `);
      
      console.log('Coluna initial_observation adicionada com sucesso!');
      
      // Copiar dados da coluna observation para initial_observation
      await pool.execute(`
        UPDATE patients 
        SET initial_observation = observation 
        WHERE initial_observation IS NULL AND observation IS NOT NULL
      `);
      
      console.log('Dados copiados de observation para initial_observation com sucesso!');
    } else {
      console.log('Coluna initial_observation já existe. Nenhuma ação necessária.');
    }
    
    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar coluna initial_observation:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    pool.end();
  }
}

// Executar a função
addInitialObservationColumn(); 
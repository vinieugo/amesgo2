import pool from '../config/db';

const addColumns = async () => {
  try {
    console.log('Iniciando adição de colunas...');
    
    // Verificar se a coluna start_date existe
    const [startDateExists] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'patients'
      AND COLUMN_NAME = 'start_date'
    `);
    
    // Adicionar coluna start_date se não existir
    if ((startDateExists as any)[0].count === 0) {
      await pool.execute(`
        ALTER TABLE patients 
        ADD COLUMN start_date DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('Coluna start_date adicionada');
    } else {
      console.log('Coluna start_date já existe');
    }
    
    // Verificar se a coluna end_date existe
    const [endDateExists] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'patients'
      AND COLUMN_NAME = 'end_date'
    `);
    
    // Adicionar coluna end_date se não existir
    if ((endDateExists as any)[0].count === 0) {
      await pool.execute(`
        ALTER TABLE patients 
        ADD COLUMN end_date DATETIME DEFAULT NULL
      `);
      console.log('Coluna end_date adicionada');
    } else {
      console.log('Coluna end_date já existe');
    }
    
    // Inicialmente, copiar os valores de stay_date para start_date para manter compatibilidade
    await pool.execute(`
      UPDATE patients 
      SET start_date = stay_date 
      WHERE start_date IS NULL AND stay_date IS NOT NULL
    `);
    console.log('Valores de stay_date copiados para start_date');
    
    console.log('Adição de colunas concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    process.exit(0);
  }
};

addColumns(); 
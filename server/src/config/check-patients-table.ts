import pool from '../config/db';

const checkPatientsTable = async () => {
  try {
    console.log('Verificando tabela de pacientes...');
    
    // Verificar estrutura da tabela
    const [columns] = await pool.query('DESCRIBE patients');
    console.log('Estrutura da tabela de pacientes:');
    console.log(columns);
    
    // Verificar campos necessários
    const fieldNames = (columns as any[]).map(col => col.Field);
    const requiredFields = ['name', 'cpf', 'contact_number', 'authorizer', 'breakfast', 'lunch', 'dinner'];
    
    const missingFields = requiredFields.filter(field => !fieldNames.includes(field));
    
    if (missingFields.length > 0) {
      console.log('Campos ausentes na tabela de pacientes:', missingFields);
      
      // Adicionar campos ausentes
      for (const field of missingFields) {
        console.log(`Adicionando campo ausente: ${field}`);
        
        let sqlType = 'VARCHAR(100)';
        if (['breakfast', 'lunch', 'dinner'].includes(field)) {
          sqlType = 'BOOLEAN NOT NULL DEFAULT 0';
        }
        
        await pool.query(`ALTER TABLE patients ADD COLUMN ${field} ${sqlType}`);
        console.log(`Campo ${field} adicionado com sucesso!`);
      }
    } else {
      console.log('Todos os campos necessários estão presentes na tabela de pacientes.');
    }
    
    // Verificar se já existem pacientes
    const [patients] = await pool.query('SELECT COUNT(*) as count FROM patients');
    console.log('Número de pacientes:', (patients as any[])[0].count);
    
  } catch (error) {
    console.error('Erro ao verificar tabela de pacientes:', error);
  } finally {
    process.exit(0);
  }
};

checkPatientsTable(); 
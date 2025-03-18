import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

dotenv.config();

async function resetAdminPassword() {
  let connection;

  try {
    // Carregar variáveis de ambiente
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || 'root';
    const dbName = process.env.DB_NAME || 'amesgonew';

    console.log(`Conectando ao MySQL em ${dbHost} com usuário ${dbUser}`);

    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName
    });

    console.log('Conectado ao banco de dados');

    // Gerar o hash da nova senha 'admin123'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('Hash gerado para a nova senha');

    // Atualizar a senha do usuário admin
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );

    const updateResult = result as { affectedRows: number };
    if (updateResult.affectedRows > 0) {
      console.log('Senha do admin atualizada com sucesso!');
      console.log('Nova senha: admin123');
    } else {
      console.log('Usuário admin não encontrado');
    }

  } catch (error) {
    console.error('Erro ao redefinir a senha:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados fechada');
    }
  }
}

// Executar o script
resetAdminPassword(); 
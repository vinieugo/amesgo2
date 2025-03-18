import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: Date;
}

dotenv.config();

async function checkUser() {
  let connection;

  try {
    // Carregar variáveis de ambiente
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || 'root';
    const dbName = process.env.DB_NAME || 'amesgonew';

    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName
    });

    console.log('Conectado ao banco de dados');

    // Buscar usuário pelo email
    const [rows] = await connection.execute<UserRow[]>(
      'SELECT id, username, email, role, created_at FROM users WHERE email = ?',
      ['caçu@amesgo.org']
    );

    if (rows.length > 0) {
      console.log('Usuário encontrado:');
      console.log(rows[0]);
    } else {
      console.log('Usuário não encontrado com este email');
      
      // Listar todos os usuários para verificar
      const [allUsers] = await connection.execute<UserRow[]>(
        'SELECT id, username, email, role, created_at FROM users'
      );
      console.log('\nLista de todos os usuários:');
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.username})`);
      });
    }

  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados fechada');
    }
  }
}

// Executar o script
checkUser(); 
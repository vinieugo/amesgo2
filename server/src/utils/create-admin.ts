import { createUser, UserRole } from '../models/user.model';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  try {
    // Senha já criptografada para 'admin123'
    const hashedPassword = '$2a$10$XGeGTepRT4Hb/YW4kzcUce4aSNzLp/qiCehShtnhAhnpIyAx.QCBe';
    
    const userId = await createUser({
      username: 'admin',
      email: 'admin@amesgo.com',
      password: hashedPassword,
      role: UserRole.ADMIN
    });
    
    console.log(`Usuário administrador criado com ID: ${userId}`);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

createAdminUser(); 
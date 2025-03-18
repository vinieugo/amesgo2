import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, createUser, getUserByUsername, getUserByEmail, getAllUsers, updateUser, deleteUser } from '../models/user.model';

// Registrar um novo usuário (somente admin pode criar usuários)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, role, name } = req.body;

    // Verificações básicas de dados
    if (!username || !password || !email || !role || !name) {
      res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      return;
    }

    // Verificar se o usuário atual é admin (apenas admins podem registrar novos usuários)
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Apenas administradores podem criar novos usuários' });
      return;
    }

    // Verificar se o papel (role) é válido
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ message: 'Tipo de usuário inválido' });
      return;
    }

    // Verificar se o usuário já existe
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ message: 'Nome de usuário já existe' });
      return;
    }

    // Verificar se o email já existe
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      res.status(400).json({ message: 'Email já está em uso' });
      return;
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar o novo usuário
    const newUser: User = {
      username,
      password: hashedPassword,
      email,
      role: role as UserRole,
      created_at: new Date(),
      updated_at: new Date()
    };

    const userId = await createUser(newUser);
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: userId,
        username,
        name,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

// Login de usuário
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Verificações básicas de dados
    if (!username || !password) {
      res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios' });
      return;
    }

    console.log('Tentativa de login com:', { username, password });
    // Buscar usuário por nome de usuário
    const user = await getUserByUsername(username);
    console.log('Usuário encontrado:', user);
    if (!user) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Senha válida:', isPasswordValid);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    // Gerar token JWT
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    
    // Usando as tipagens corretas para JWT sign
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role } as Object,
      secretKey,
      { expiresIn } as jwt.SignOptions
    );

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

// Obter perfil do usuário atual
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Usuário não autenticado' });
      return;
    }

    res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro ao obter perfil de usuário' });
  }
};

// Listar todos os usuários (somente admin)
export const getAllUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se o usuário atual é admin
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Apenas administradores podem listar usuários' });
      return;
    }

    const users = await getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
}; 
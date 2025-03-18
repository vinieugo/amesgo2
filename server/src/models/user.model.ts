import pool from '../config/db';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  GUEST = 'guest',
  SUPPORT = 'support',
  CLIENT = 'client',
  REGISTER = 'register'
}

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  reset_password_token?: string;
  reset_password_expire?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export const createUser = async (user: User): Promise<number> => {
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [user.username, user.email, user.password, user.role]
  );
  return (result as any).insertId;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return (rows as User[])[0] || null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  return (rows as User[])[0] || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return (rows as User[])[0] || null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const [rows] = await pool.execute('SELECT id, username, email, role, created_at, updated_at FROM users');
  return rows as User[];
};

export const updateUser = async (id: number, user: Partial<User>): Promise<boolean> => {
  const fields = Object.keys(user)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => `${key} = ?`);
  
  const values = Object.keys(user)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => (user as any)[key]);
  
  if (fields.length === 0) return false;
  
  values.push(id);
  
  const [result] = await pool.execute(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    values
  );
  
  return (result as any).affectedRows > 0;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}; 
import fs from 'fs';
import path from 'path';
import pool from './db';

async function fixDatabase() {
  try {
    console.log('Iniciando correção do banco de dados...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'fix-database.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim() !== '');
    
    // Executar cada comando
    for (const command of commands) {
      try {
        if (command.trim().startsWith('--')) {
          // Ignorar comentários
          continue;
        }
        
        if (command.trim().toLowerCase().startsWith('select')) {
          // Para comandos SELECT, mostrar os resultados
          const [rows] = await pool.execute(command);
          console.log('Resultado da consulta:', command.substring(0, 50) + '...');
          console.log(rows);
        } else {
          // Para outros comandos, apenas executar
          await pool.execute(command);
          console.log('Comando SQL executado com sucesso:', command.substring(0, 50) + '...');
        }
      } catch (error: any) {
        console.error('Erro ao executar comando SQL:', command);
        console.error('Detalhes do erro:', error);
      }
    }
    
    console.log('Correção do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao corrigir banco de dados:', error);
  } finally {
    // Encerrar o pool de conexões
    await pool.end();
  }
}

// Executar a função
fixDatabase(); 
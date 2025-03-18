-- Script para verificar e corrigir problemas no banco de dados

-- Verificar a estrutura da tabela de pacientes
DESCRIBE patients;

-- Verificar se a coluna status existe e tem o tipo correto
ALTER TABLE patients MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- Verificar se a coluna observation existe
ALTER TABLE patients ADD COLUMN IF NOT EXISTS observation TEXT;

-- Garantir que todos os pacientes tenham um status válido
UPDATE patients SET status = 'ACTIVE' WHERE status IS NULL OR status = '';

-- Verificar se há pacientes com dados inconsistentes
SELECT id, name, full_name, cpf, status FROM patients WHERE name IS NULL OR name = '' OR cpf IS NULL OR cpf = '';

-- Sincronizar campos duplicados
UPDATE patients SET full_name = name WHERE full_name IS NULL OR full_name = '';
UPDATE patients SET has_coffee = breakfast WHERE has_coffee IS NULL;
UPDATE patients SET has_lunch = lunch WHERE has_lunch IS NULL;

-- Converter valores booleanos para 0 ou 1
UPDATE patients SET breakfast = 0 WHERE breakfast IS NULL;
UPDATE patients SET lunch = 0 WHERE lunch IS NULL;
UPDATE patients SET dinner = 0 WHERE dinner IS NULL;
UPDATE patients SET has_coffee = 0 WHERE has_coffee IS NULL;
UPDATE patients SET has_lunch = 0 WHERE has_lunch IS NULL;

-- Verificar se há pacientes com IDs duplicados
SELECT id, COUNT(*) as count FROM patients GROUP BY id HAVING count > 1;

-- Verificar se há pacientes com CPFs duplicados
SELECT cpf, COUNT(*) as count FROM patients GROUP BY cpf HAVING count > 1;

-- Verificar e corrigir a coluna status
-- Primeiro, verificar se há valores inválidos
SELECT id, status FROM patients WHERE status NOT IN ('ACTIVE', 'INACTIVE');

-- Corrigir valores inválidos
UPDATE patients SET status = 'ACTIVE' WHERE status NOT IN ('ACTIVE', 'INACTIVE');

-- Verificar se a coluna observation é NULL e corrigi-la
UPDATE patients SET observation = '' WHERE observation IS NULL;

-- Verificar se há problemas com a coluna created_at
SELECT id, created_at FROM patients WHERE created_at IS NULL;

-- Corrigir created_at se for NULL
UPDATE patients SET created_at = NOW() WHERE created_at IS NULL;

-- Verificar se há problemas com a coluna updated_at
SELECT id, updated_at FROM patients WHERE updated_at IS NULL;

-- Corrigir updated_at se for NULL
UPDATE patients SET updated_at = NOW() WHERE updated_at IS NULL;

-- Verificar se a coluna observation existe e tem o tipo correto
ALTER TABLE patients MODIFY COLUMN observation TEXT;

-- Mostrar todos os pacientes para verificação
SELECT id, name, cpf, status, observation FROM patients; 
-- Adicionar coluna status se não existir
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- Adicionar coluna observation se não existir
ALTER TABLE patients ADD COLUMN IF NOT EXISTS observation TEXT;

-- Adicionar coluna start_date se não existir
ALTER TABLE patients ADD COLUMN IF NOT EXISTS start_date DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Adicionar coluna end_date se não existir
ALTER TABLE patients ADD COLUMN IF NOT EXISTS end_date DATETIME DEFAULT NULL;

-- Adicionar nova coluna initial_observation se não existir
ALTER TABLE patients ADD COLUMN IF NOT EXISTS initial_observation TEXT AFTER observation;

-- Atualizar os valores de status para ACTIVE se forem NULL
UPDATE patients SET status = 'ACTIVE' WHERE status IS NULL;

-- Inicialmente, copiar os valores de stay_date para start_date para manter compatibilidade
UPDATE patients SET start_date = stay_date WHERE start_date IS NULL AND stay_date IS NOT NULL;

-- Atualizar existing records to copy observation to initial_observation if needed
UPDATE patients 
SET initial_observation = observation 
WHERE initial_observation IS NULL AND observation IS NOT NULL; 
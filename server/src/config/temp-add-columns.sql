-- Adicionar coluna start_date se não existir
ALTER TABLE patients ADD COLUMN start_date DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Adicionar coluna end_date se não existir
ALTER TABLE patients ADD COLUMN end_date DATETIME DEFAULT NULL;

-- Inicialmente, copiar os valores de stay_date para start_date para manter compatibilidade
UPDATE patients SET start_date = stay_date WHERE start_date IS NULL AND stay_date IS NOT NULL; 
-- Verificar se a coluna status existe e adicioná-la se não existir
SET @existsStatus = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'status'
);

SET @addStatusSQL = IF(@existsStatus = 0,
  'ALTER TABLE patients ADD COLUMN status ENUM(\'ACTIVE\', \'INACTIVE\') NOT NULL DEFAULT \'ACTIVE\' AFTER dinner',
  'SELECT \'Column status already exists\''
);

PREPARE addStatusStmt FROM @addStatusSQL;
EXECUTE addStatusStmt;
DEALLOCATE PREPARE addStatusStmt;

-- Verificar se a coluna has_coffee existe e adicioná-la se não existir
SET @existsHasCoffee = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'has_coffee'
);

SET @addHasCoffeeSQL = IF(@existsHasCoffee = 0,
  'ALTER TABLE patients ADD COLUMN has_coffee BOOLEAN NOT NULL DEFAULT 0 AFTER dinner',
  'SELECT \'Column has_coffee already exists\''
);

PREPARE addHasCoffeeStmt FROM @addHasCoffeeSQL;
EXECUTE addHasCoffeeStmt;
DEALLOCATE PREPARE addHasCoffeeStmt;

-- Verificar se a coluna has_lunch existe e adicioná-la se não existir
SET @existsHasLunch = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'has_lunch'
);

SET @addHasLunchSQL = IF(@existsHasLunch = 0,
  'ALTER TABLE patients ADD COLUMN has_lunch BOOLEAN NOT NULL DEFAULT 0 AFTER has_coffee',
  'SELECT \'Column has_lunch already exists\''
);

PREPARE addHasLunchStmt FROM @addHasLunchSQL;
EXECUTE addHasLunchStmt;
DEALLOCATE PREPARE addHasLunchStmt;

-- Verificar se a coluna full_name existe e adicioná-la se não existir
SET @existsFullName = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'full_name'
);

SET @addFullNameSQL = IF(@existsFullName = 0,
  'ALTER TABLE patients ADD COLUMN full_name VARCHAR(100) NOT NULL DEFAULT \'\' AFTER name',
  'SELECT \'Column full_name already exists\''
);

PREPARE addFullNameStmt FROM @addFullNameSQL;
EXECUTE addFullNameStmt;
DEALLOCATE PREPARE addFullNameStmt;

-- Verificar se a coluna municipality existe e adicioná-la se não existir
SET @existsMunicipality = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'municipality'
);

SET @addMunicipalitySQL = IF(@existsMunicipality = 0,
  'ALTER TABLE patients ADD COLUMN municipality VARCHAR(100) DEFAULT \'\' AFTER authorizer',
  'SELECT \'Column municipality already exists\''
);

PREPARE addMunicipalityStmt FROM @addMunicipalitySQL;
EXECUTE addMunicipalityStmt;
DEALLOCATE PREPARE addMunicipalityStmt;

-- Verificar se a coluna observation existe e adicioná-la se não existir
SET @existsObservation = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'observation'
);

SET @addObservationSQL = IF(@existsObservation = 0,
  'ALTER TABLE patients ADD COLUMN observation TEXT AFTER status',
  'SELECT \'Column observation already exists\''
);

PREPARE addObservationStmt FROM @addObservationSQL;
EXECUTE addObservationStmt;
DEALLOCATE PREPARE addObservationStmt;

-- Verificar se a coluna stay_date existe e adicioná-la se não existir
SET @existsStayDate = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'stay_date'
);

SET @addStayDateSQL = IF(@existsStayDate = 0,
  'ALTER TABLE patients ADD COLUMN stay_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER observation',
  'SELECT \'Column stay_date already exists\''
);

PREPARE addStayDateStmt FROM @addStayDateSQL;
EXECUTE addStayDateStmt;
DEALLOCATE PREPARE addStayDateStmt;

-- Atualizar os valores de full_name para corresponder ao name se estiverem vazios
UPDATE patients SET full_name = name WHERE full_name = '';

-- Atualizar os valores de has_coffee para corresponder ao breakfast
UPDATE patients SET has_coffee = breakfast WHERE 1;

-- Atualizar os valores de has_lunch para corresponder ao lunch
UPDATE patients SET has_lunch = lunch WHERE 1;

-- Atualizar os valores de status para ACTIVE se forem NULL
UPDATE patients SET status = 'ACTIVE' WHERE status IS NULL; 
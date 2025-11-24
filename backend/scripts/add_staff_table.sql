-- Adds the staff table and indexes without touching existing data

CREATE TABLE IF NOT EXISTS staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  department_id INT,
  position VARCHAR(255),
  shift VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staff_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Add index on staff.user_id when missing
SET @schema := DATABASE();
SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @schema
    AND table_name = 'staff'
    AND index_name = 'idx_staff_user'
);
SET @ddl := IF(
  @index_exists = 0,
  'ALTER TABLE staff ADD INDEX idx_staff_user (user_id);',
  'DO 0;'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on staff.department_id when missing
SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @schema
    AND table_name = 'staff'
    AND index_name = 'idx_staff_department'
);
SET @ddl := IF(
  @index_exists = 0,
  'ALTER TABLE staff ADD INDEX idx_staff_department (department_id);',
  'DO 0;'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unique constraint on user_id when missing
SET @constraint_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @schema
    AND table_name = 'staff'
    AND index_name = 'unique_staff_user'
);
SET @ddl := IF(
  @constraint_exists = 0,
  'ALTER TABLE staff ADD UNIQUE INDEX unique_staff_user (user_id);',
  'DO 0;'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

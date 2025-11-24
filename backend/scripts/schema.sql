-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'patient', 'staff', 'pharmacist', 'lab_technician') NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  blood_type VARCHAR(5),
  phone VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  head_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (head_id) REFERENCES users(id)
);

-- Create Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  specialization VARCHAR(255),
  license_number VARCHAR(255) UNIQUE,
  department_id INT,
  availability JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT,
  status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Create Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  prescription_date DATE NOT NULL,
  notes TEXT,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Create Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  batch_number VARCHAR(255),
  expiry_date DATE,
  quantity INT DEFAULT 0,
  unit_price DECIMAL(10, 2),
  supplier_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Dispensing Records Table
CREATE TABLE IF NOT EXISTS dispensing_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity_dispensed INT,
  dispensed_by INT,
  dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (dispensed_by) REFERENCES users(id)
);

-- Create Test Requests Table
CREATE TABLE IF NOT EXISTS test_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  test_type VARCHAR(255),
  description TEXT,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Create Lab Reports Table
CREATE TABLE IF NOT EXISTS lab_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_request_id INT NOT NULL,
  report_data LONGTEXT,
  report_file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_request_id) REFERENCES test_requests(id) ON DELETE CASCADE
);

-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  amount DECIMAL(10, 2),
  description TEXT,
  due_date DATE,
  status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  amount_paid DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create Staff Table
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

-- Create Indexes 
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_user_email (email);
ALTER TABLE patients ADD INDEX IF NOT EXISTS idx_patient_user (user_id);
ALTER TABLE doctors ADD INDEX IF NOT EXISTS idx_doctor_user (user_id);
ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appointment_patient (patient_id);
ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appointment_doctor (doctor_id);
ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appointment_date (appointment_date);
ALTER TABLE prescriptions ADD INDEX IF NOT EXISTS idx_prescription_patient (patient_id);
ALTER TABLE test_requests ADD INDEX IF NOT EXISTS idx_test_request_patient (patient_id);
ALTER TABLE invoices ADD INDEX IF NOT EXISTS idx_invoice_patient (patient_id);
ALTER TABLE staff ADD INDEX IF NOT EXISTS idx_staff_user (user_id);
ALTER TABLE staff ADD INDEX IF NOT EXISTS idx_staff_department (department_id);

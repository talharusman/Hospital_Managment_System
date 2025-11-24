-- Demo dataset for the healthcare management system
-- Password for every inserted user = "password123"

-- Optional reset (uncomment when you need a clean slate)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE lab_reports;
-- TRUNCATE TABLE test_requests;
-- TRUNCATE TABLE dispensing_records;
-- TRUNCATE TABLE prescriptions;
-- TRUNCATE TABLE appointments;
-- TRUNCATE TABLE medicines;
-- TRUNCATE TABLE payments;
-- TRUNCATE TABLE invoices;
-- TRUNCATE TABLE patients;
-- TRUNCATE TABLE doctors;
-- TRUNCATE TABLE departments;
-- TRUNCATE TABLE users;
-- SET FOREIGN_KEY_CHECKS = 1;

-- Base users
INSERT INTO users (id, email, password, name, role, phone, created_at)
VALUES
  (1, 'admin@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Alex Morgan', 'admin', '555-1000', NOW()),
  (2, 'dr.cardiology@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Dr. Emily Carter', 'doctor', '555-2001', NOW()),
  (3, 'dr.neuro@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Dr. Miguel Alvarez', 'doctor', '555-2002', NOW()),
  (4, 'dr.peds@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Dr. Priya Sharma', 'doctor', '555-2003', NOW()),
  (5, 'jane.doe@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Jane Doe', 'patient', '555-3001', NOW()),
  (6, 'peter.parker@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Peter Parker', 'patient', '555-3002', NOW()),
  (7, 'mary.jane@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Mary Jane', 'patient', '555-3003', NOW()),
  (8, 'tony.stark@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Tony Stark', 'patient', '555-3004', NOW()),
  (9, 'labtech@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Sarah Kim', 'lab_technician', '555-4001', NOW()),
  (10, 'pharma@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Michael Chen', 'pharmacist', '555-5001', NOW()),
  (11, 'staff@hospital.com', '$2a$10$HyFd/jP/3kZ11kUYR5EiP.MsVVpr5lH0iZyFGckk7vBNHVcljOkZG', 'Linh Tran', 'staff', '555-6001', NOW());

-- Departments
INSERT INTO departments (id, name, description, head_id, created_at)
VALUES
  (1, 'Cardiology', 'Heart and vascular care', 2, NOW()),
  (2, 'Neurology', 'Brain and nervous system treatments', 3, NOW()),
  (3, 'Pediatrics', 'Child health services', 4, NOW());

-- Doctors
INSERT INTO doctors (id, user_id, specialization, license_number, department_id, availability, created_at)
VALUES
  (1, 2, 'Interventional Cardiologist', 'CARD-12345', 1, '[{"day":"Monday","startTime":"09:00","endTime":"17:00","isAvailable":true},{"day":"Wednesday","startTime":"09:00","endTime":"17:00","isAvailable":true},{"day":"Friday","startTime":"09:00","endTime":"17:00","isAvailable":true}]', NOW()),
  (2, 3, 'Neurologist', 'NEUR-67890', 2, '[{"day":"Tuesday","startTime":"10:00","endTime":"18:00","isAvailable":true},{"day":"Thursday","startTime":"10:00","endTime":"18:00","isAvailable":true}]', NOW()),
  (3, 4, 'Pediatrician', 'PEDS-24680', 3, '[{"day":"Monday","startTime":"08:00","endTime":"14:00","isAvailable":true},{"day":"Wednesday","startTime":"08:00","endTime":"14:00","isAvailable":true},{"day":"Saturday","startTime":"09:00","endTime":"12:00","isAvailable":true}]', NOW());

-- Patients
INSERT INTO patients (id, user_id, date_of_birth, gender, blood_type, phone, address, emergency_contact, created_at)
VALUES
  (1, 5, '1988-03-15', 'female', 'O+', '555-3001', '123 Maple St, Springfield', 'John Doe - 555-7001', NOW()),
  (2, 6, '1995-08-10', 'male', 'A+', '555-3002', '78 Queens Blvd, NYC', 'May Parker - 555-7002', NOW()),
  (3, 7, '1992-06-22', 'female', 'B-', '555-3003', '56 Elm St, Metropolis', 'Anna Watson - 555-7003', NOW()),
  (4, 8, '1975-05-29', 'male', 'AB+', '555-3004', '200 Park Ave, NYC', 'Pepper Potts - 555-7004', NOW());

-- Appointments
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes, created_at)
VALUES
  (1, 1, 1, '2025-11-22', '09:30:00', 'Routine cardiac checkup', 'completed', 'Blood pressure stabilized.', NOW()),
  (2, 2, 1, '2025-11-23', '11:00:00', 'Chest discomfort evaluation', 'scheduled', 'Bring previous ECG reports.', NOW()),
  (3, 3, 2, '2025-11-24', '14:00:00', 'Migraine follow-up', 'scheduled', 'Assess response to new medication.', NOW()),
  (4, 4, 2, '2025-11-20', '16:30:00', 'Post-concussion assessment', 'completed', 'Symptoms improving.', NOW()),
  (5, 1, 3, '2025-11-26', '10:15:00', 'Pediatric wellness visit for child', 'scheduled', 'Mother attending with child.', NOW()),
  (6, 2, 2, '2025-11-18', '09:00:00', 'Sleep disturbance', 'cancelled', 'Patient rescheduled due to travel.', NOW()),
  (7, 3, 1, '2025-11-21', '13:45:00', 'Stress test review', 'completed', 'Recommend lifestyle changes.', NOW()),
  (8, 4, 3, '2025-11-28', '08:30:00', 'Vaccination update', 'scheduled', 'Check vaccine inventory.', NOW());

-- Prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, appointment_id, prescription_date, notes, status, created_at)
VALUES
  (1, 1, 1, 1, '2025-11-22', '{"notes":"Maintain current regimen","medications":[{"name":"Atorvastatin","dosage":"20mg","frequency":"Once daily","duration":"90 days"},{"name":"Aspirin","dosage":"75mg","frequency":"Once daily","duration":"90 days"}]}', 'active', NOW()),
  (2, 2, 1, 2, '2025-11-23', '{"notes":"Adjust dosage if dizziness occurs","medications":[{"name":"Metoprolol","dosage":"50mg","frequency":"Twice daily","duration":"60 days"}]}', 'active', NOW()),
  (3, 3, 2, 3, '2025-11-24', '{"notes":"Reassess after 2 weeks","medications":[{"name":"Sumatriptan","dosage":"100mg","frequency":"As needed","duration":"14 days"}]}', 'active', NOW()),
  (4, 4, 2, 4, '2025-11-20', '{"notes":"Continue therapy","medications":[{"name":"Gabapentin","dosage":"300mg","frequency":"Three times daily","duration":"30 days"}]}', 'completed', NOW());

-- Medicines catalog
INSERT INTO medicines (id, name, generic_name, batch_number, expiry_date, quantity, unit_price, supplier_id, created_at, updated_at)
VALUES
  (1, 'Atorvastatin', 'Atorvastatin Calcium', 'AT-2025-01', '2026-01-31', 250, 0.85, NULL, NOW(), NOW()),
  (2, 'Aspirin', 'Acetylsalicylic Acid', 'AS-2025-02', '2025-09-30', 400, 0.25, NULL, NOW(), NOW()),
  (3, 'Metoprolol', 'Metoprolol Tartrate', 'MT-2024-11', '2026-07-31', 180, 0.95, NULL, NOW(), NOW()),
  (4, 'Sumatriptan', 'Sumatriptan Succinate', 'SU-2025-05', '2025-12-31', 90, 5.50, NULL, NOW(), NOW()),
  (5, 'Gabapentin', 'Gabapentin', 'GA-2025-03', '2027-03-31', 120, 1.75, NULL, NOW(), NOW());

-- Dispensing records
INSERT INTO dispensing_records (id, prescription_id, medicine_id, quantity_dispensed, dispensed_by, dispensed_at)
VALUES
  (1, 1, 1, 30, 10, NOW()),
  (2, 1, 2, 30, 10, NOW()),
  (3, 2, 3, 60, 10, NOW()),
  (4, 3, 4, 20, 10, NOW()),
  (5, 4, 5, 90, 10, NOW());

-- Lab test requests
INSERT INTO test_requests (id, patient_id, doctor_id, test_type, description, status, created_at)
VALUES
  (1, 1, 1, 'Lipid Profile', 'Annual cholesterol screening', 'completed', NOW()),
  (2, 2, 1, 'Echocardiogram', 'Evaluate chest discomfort', 'pending', NOW()),
  (3, 3, 2, 'MRI Brain', 'Investigate chronic migraines', 'in-progress', NOW());

-- Lab reports
INSERT INTO lab_reports (id, test_request_id, report_data, report_file_path, created_at)
VALUES
  (1, 1, 'Total Cholesterol: 180 mg/dL\nHDL: 55 mg/dL\nLDL: 100 mg/dL', '/reports/lipid_profile_1.pdf', NOW());

-- Billing data
INSERT INTO invoices (id, patient_id, amount, description, due_date, status, created_at)
VALUES
  (1, 1, 250.00, 'Cardiology consultation and tests', '2025-12-05', 'paid', NOW()),
  (2, 2, 175.00, 'Chest pain evaluation visit', '2025-12-07', 'pending', NOW()),
  (3, 3, 320.00, 'Neurology diagnostic imaging', '2025-12-10', 'paid', NOW()),
  (4, 4, 95.00, 'Pediatric vaccination', '2025-12-12', 'pending', NOW());

INSERT INTO payments (id, invoice_id, amount_paid, payment_method, payment_date)
VALUES
  (1, 1, 250.00, 'credit_card', '2025-11-22 15:45:00'),
  (2, 3, 320.00, 'online', '2025-11-21 10:20:00');

-- Staff roster
INSERT INTO staff (user_id, department_id, position, shift, created_at, updated_at)
VALUES
  (11, 1, 'Front Desk Coordinator', 'Day', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  position = VALUES(position),
  shift = VALUES(shift),
  updated_at = VALUES(updated_at);

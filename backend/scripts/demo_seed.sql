-- Staff roster
INSERT INTO staff (user_id, department_id, position, shift, created_at, updated_at)
VALUES
  (11, 1, 'Front Desk Coordinator', 'Day', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  position = VALUES(position),
  shift = VALUES(shift),
  updated_at = VALUES(updated_at);

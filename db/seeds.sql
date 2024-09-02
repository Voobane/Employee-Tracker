-- Insert sample data into department table
INSERT INTO department (name) VALUES 
('Engineering'),
('Finance'),
('Human Resources'),
('Marketing');

-- Insert sample data into role table
INSERT INTO role (title, salary, department_id) VALUES
('Software Engineer', 90000, (SELECT id FROM department WHERE name = 'Engineering')),
('Data Analyst', 75000, (SELECT id FROM department WHERE name = 'Finance')),
('HR Manager', 80000, (SELECT id FROM department WHERE name = 'Human Resources')),
('Marketing Specialist', 70000, (SELECT id FROM department WHERE name = 'Marketing'));

-- Insert sample data into employee table
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
('John', 'Doe', (SELECT id FROM role WHERE title = 'Software Engineer'), NULL),
('Jane', 'Smith', (SELECT id FROM role WHERE title = 'Data Analyst'), NULL),
('Jim', 'Brown', (SELECT id FROM role WHERE title = 'HR Manager'), NULL),
('Lisa', 'White', (SELECT id FROM role WHERE title = 'Marketing Specialist'), NULL),
('Alice', 'Johnson', (SELECT id FROM role WHERE title = 'Software Engineer'), 1),
('Bob', 'Williams', (SELECT id FROM role WHERE title = 'Marketing Specialist'), 4);

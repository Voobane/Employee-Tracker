const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const cTable = require('console.table');

// PostgreSQL client configuration
const client = new Client({
    user: 'postgres',                 // Replace with your PostgreSQL username
    host: 'localhost',                // Replace with your database host, usually 'localhost'
    database: 'postgres',             // Replace with your PostgreSQL database name
    password: '1234',                 // Replace with your PostgreSQL password
    port: 5432,                       // Default PostgreSQL port
});

client.connect();

const runSqlFile = async (filePath) => {
    const fullPath = path.join(__dirname, 'db', filePath);
    const sql = fs.readFileSync(fullPath, { encoding: 'utf8' });

    try {
        await client.query(sql);
        console.log(`Successfully executed ${filePath}`);
    } catch (err) {
        console.error(`Error executing ${filePath}:`, err);
    }
};

const setupDatabase = async () => {
    try {
        await runSqlFile('schema.sql'); // Run schema.sql to create tables
        await runSqlFile('seeds.sql');  // Run seeds.sql to populate tables with initial data
    } catch (err) {
        console.error('Error setting up database:', err);
    }
};

const mainMenu = () => {
    inquirer.prompt({
        name: 'action',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            'Update an employee manager',
            'View employees by manager',
            'View employees by department',
            'View total utilized budget by department',
            'Delete a department',
            'Delete a role',
            'Delete an employee',
            'Exit'
        ],
    }).then((answer) => {
        switch (answer.action) {
            case 'View all departments':
                viewAllDepartments();
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'View employees by manager':
                viewEmployeesByManager();
                break;
            case 'View employees by department':
                viewEmployeesByDepartment();
                break;
            case 'View total utilized budget by department':
                viewDepartmentBudget();
                break;
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'Update an employee manager':
                updateEmployeeManager();
                break;
            case 'Delete a department':
                deleteDepartment();
                break;
            case 'Delete a role':
                deleteRole();
                break;
            case 'Delete an employee':
                deleteEmployee();
                break;
            default:
                client.end();
                console.log("Goodbye!");
        }
    });
};

const viewAllDepartments = () => {
    client.query('SELECT id, name FROM department;', (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        mainMenu();
    });
};

const viewAllRoles = () => {
    const query = `
        SELECT r.id, r.title, r.salary, d.name AS department 
        FROM role r 
        JOIN department d ON r.department_id = d.id;
    `;
    client.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        mainMenu();
    });
};

const viewAllEmployees = () => {
    const query = `
        SELECT e.id, e.first_name, e.last_name, r.title AS job_title, d.name AS department, r.salary,
               COALESCE(m.first_name || ' ' || m.last_name, 'None') AS manager 
        FROM employee e 
        JOIN role r ON e.role_id = r.id 
        JOIN department d ON r.department_id = d.id 
        LEFT JOIN employee m ON e.manager_id = m.id;
    `;
    client.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        mainMenu();
    });
};

const viewEmployeesByManager = () => {
    inquirer.prompt({
        name: 'manager_id',
        type: 'input',
        message: 'Enter the manager ID to view their employees:',
    }).then((answer) => {
        const query = `
            SELECT e.id, e.first_name, e.last_name, r.title AS job_title, d.name AS department
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            WHERE e.manager_id = $1;
        `;
        client.query(query, [answer.manager_id], (err, res) => {
            if (err) throw err;
            console.table(res.rows);
            mainMenu();
        });
    });
};

const viewEmployeesByDepartment = () => {
    inquirer.prompt({
        name: 'department_id',
        type: 'input',
        message: 'Enter the department ID to view its employees:',
    }).then((answer) => {
        const query = `
            SELECT e.id, e.first_name, e.last_name, r.title AS job_title, r.salary,
                   COALESCE(m.first_name || ' ' || m.last_name, 'None') AS manager
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            LEFT JOIN employee m ON e.manager_id = m.id
            WHERE d.id = $1;
        `;
        client.query(query, [answer.department_id], (err, res) => {
            if (err) throw err;
            console.table(res.rows);
            mainMenu();
        });
    });
};

const viewDepartmentBudget = () => {
    inquirer.prompt({
        name: 'department_id',
        type: 'input',
        message: 'Enter the department ID to view its total utilized budget:',
    }).then((answer) => {
        const query = `
            SELECT d.name AS department, SUM(r.salary) AS utilized_budget
            FROM employee e
            JOIN role r ON e.role_id = r.id
            JOIN department d ON r.department_id = d.id
            WHERE d.id = $1
            GROUP BY d.name;
        `;
        client.query(query, [answer.department_id], (err, res) => {
            if (err) throw err;
            console.table(res.rows);
            mainMenu();
        });
    });
};

const addDepartment = () => {
    inquirer.prompt({
        name: 'name',
        type: 'input',
        message: 'Enter the name of the department:',
    }).then((answer) => {
        client.query('INSERT INTO department (name) VALUES ($1);', [answer.name], (err, res) => {
            if (err) throw err;
            console.log('Department added successfully!');
            mainMenu();
        });
    });
};

const addRole = () => {
    // Fetch departments from the database to show as choices
    client.query('SELECT id, name FROM department;', (err, res) => {
        if (err) throw err;

        // Prepare department choices for the prompt
        const departments = res.rows.map(department => ({
            name: department.name,
            value: department.id
        }));

        // Prompt for the role details, including department selection
        inquirer.prompt([
            {
                name: 'title',
                type: 'input',
                message: 'Enter the role title:',
            },
            {
                name: 'salary',
                type: 'input',
                message: 'Enter the salary for this role:',
                validate: (input) => !isNaN(input) || "Please enter a valid number"
            },
            {
                name: 'department_id',
                type: 'list',
                message: 'Select the department for this role:',
                choices: departments // Show list of departments
            },
        ]).then((answer) => {
            const query = `
                INSERT INTO role (title, salary, department_id) 
                VALUES ($1, $2, $3);
            `;
            client.query(query, [answer.title, answer.salary, answer.department_id], (err, res) => {
                if (err) throw err;
                console.log('Role added successfully!');
                mainMenu();
            });
        });
    });
};

const addEmployee = () => {
    // Fetch roles and employees to show in the prompts
    client.query('SELECT id, title FROM role;', (err, roleRes) => {
        if (err) throw err;

        const roles = roleRes.rows.map(role => ({
            name: role.title,
            value: role.id
        }));

        client.query('SELECT id, first_name, last_name FROM employee;', (err, empRes) => {
            if (err) throw err;

            const managers = empRes.rows.map(emp => ({
                name: `${emp.first_name} ${emp.last_name}`,
                value: emp.id
            }));

            // Add "None" option for employees without a manager
            managers.push({ name: 'None', value: null });

            // Prompt for employee details
            inquirer.prompt([
                {
                    name: 'first_name',
                    type: 'input',
                    message: 'Enter the employee first name:',
                },
                {
                    name: 'last_name',
                    type: 'input',
                    message: 'Enter the employee last name:',
                },
                {
                    name: 'role_id',
                    type: 'list',
                    message: 'Select the role for this employee:',
                    choices: roles // List of role names for the user to select from
                },
                {
                    name: 'manager_id',
                    type: 'list',
                    message: 'Select the manager for this employee (optional):',
                    choices: managers // List of managers (employees)
                }
            ]).then((answer) => {
                const query = `
                    INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                    VALUES ($1, $2, $3, $4);
                `;
                client.query(query, [answer.first_name, answer.last_name, answer.role_id, answer.manager_id], (err, res) => {
                    if (err) throw err;
                    console.log('Employee added successfully!');
                    mainMenu();
                });
            });
        });
    });
};

const updateEmployeeRole = () => {
    inquirer.prompt([
        {
            name: 'employee_id',
            type: 'input',
            message: 'Enter the employee ID:',
        },
        {
            name: 'role_id',
            type: 'input',
            message: 'Enter the new role ID:',
        },
    ]).then((answer) => {
        const query = `
            UPDATE employee 
            SET role_id = $1 
            WHERE id = $2;
        `;
        client.query(query, [answer.role_id, answer.employee_id], (err, res) => {
            if (err) throw err;
            console.log('Employee role updated successfully!');
            mainMenu();
        });
    });
};

const updateEmployeeManager = () => {
    inquirer.prompt([
        {
            name: 'employee_id',
            type: 'input',
            message: 'Enter the employee ID:',
        },
        {
            name: 'manager_id',
            type: 'input',
            message: 'Enter the new manager ID:',
        },
    ]).then((answer) => {
        const query = `
            UPDATE employee 
            SET manager_id = $1 
            WHERE id = $2;
        `;
        client.query(query, [answer.manager_id, answer.employee_id], (err, res) => {
            if (err) throw err;
            console.log('Employee manager updated successfully!');
            mainMenu();
        });
    });
};

const deleteDepartment = () => {
    inquirer.prompt({
        name: 'department_id',
        type: 'input',
        message: 'Enter the department ID to delete:',
    }).then((answer) => {
        client.query('DELETE FROM department WHERE id = $1;', [answer.department_id], (err, res) => {
            if (err) throw err;
            console.log('Department deleted successfully!');
            mainMenu();
        });
    });
};

const deleteRole = () => {
    inquirer.prompt({
        name: 'role_id',
        type: 'input',
        message: 'Enter the role ID to delete:',
    }).then((answer) => {
        client.query('DELETE FROM role WHERE id = $1;', [answer.role_id], (err, res) => {
            if (err) throw err;
            console.log('Role deleted successfully!');
            mainMenu();
        });
    });
};

const deleteEmployee = () => {
    inquirer.prompt({
        name: 'employee_id',
        type: 'input',
        message: 'Enter the employee ID to delete:',
    }).then((answer) => {
        client.query('DELETE FROM employee WHERE id = $1;', [answer.employee_id], (err, res) => {
            if (err) throw err;
            console.log('Employee deleted successfully!');
            mainMenu();
        });
    });
};

// First set up the database, then start the main menu
setupDatabase().then(() => {
    console.log("Database setup complete.");
    mainMenu();
});

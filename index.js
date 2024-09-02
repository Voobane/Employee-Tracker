const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const cTable = require('console.table');

// PostgreSQL client configuration
const client = new Client({
    user: 'postgre',            // Replace with your PostgreSQL username
    host: 'localhost',                // Replace with your database host, usually 'localhost'
    database: 'employeetracker',   // Replace with your PostgreSQL database name
    password: '1234',        // Replace with your PostgreSQL password
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
        },
        {
            name: 'department_id',
            type: 'input',
            message: 'Enter the department ID for this role:',
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
};

const addEmployee = () => {
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
            type: 'input',
            message: 'Enter the employee role ID:',
        },
        {
            name: 'manager_id',
            type: 'input',
            message: 'Enter the manager ID for this employee (leave blank if none):',
        },
    ]).then((answer) => {
        const query = `
            INSERT INTO employee (first_name, last_name, role_id, manager_id) 
            VALUES ($1, $2, $3, $4);
        `;
        client.query(query, [answer.first_name, answer.last_name, answer.role_id, answer.manager_id || null], (err, res) => {
            if (err) throw err;
            console.log('Employee added successfully!');
            mainMenu();
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

// First set up the database, then start the main menu
setupDatabase().then(() => {
    console.log("Database setup complete.");
    mainMenu();
});

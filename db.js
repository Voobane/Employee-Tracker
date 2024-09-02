const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL client configuration
const client = new Client({
    user: 'postgresql',               // Replace with your PostgreSQL username
    host: 'localhost',                // Replace with your database host, usually 'localhost'
    database: 'employeetracker',      // Replace with your PostgreSQL database name
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

const run = async () => {
    try {
        await runSqlFile('schema.sql'); // Run schema.sql to create tables
        await runSqlFile('seeds.sql');  // Run seeds.sql to populate tables with initial data
    } finally {
        client.end(); // Close the database connection
    }
};

// Execute the setup process
run();

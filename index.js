const pg = require('pg'); // Importing the pg module
const express = require('express'); // Importing the express module

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db')
const app = express(); // Creating an instance of express

app.use(express.json()); // Middleware to parse JSON requests

const PORT = process.env.PORT || 3000; // Setting the port for the server

//Express routes

//Get all flavors
app.get('/api/flavors', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM flavors');
        res.send(result.rows); // Send the result rows as response
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

//Get a flavor by id
app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const result = await client.query('SELECT * FROM flavors WHERE id = $1', [req.params.id]);
        res.send(result.rows[0]); // Send the first row of the result as response
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

//Add a new flavor
app.post('/api/flavors', async (req, res, next) => {
    try {
        const { name, is_favorite } = req.body; // Destructure the request body
        const result = await client.query(
            'INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *',
            [name, is_favorite ?? false] // Use nullish coalescing operator to set default value
        );
        res.status(201).send(result.rows[0]); // Send the created row as response
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

//Delete a flavor
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        await client.query('DELETE FROM flavors WHERE id = $1', [req.params.id]); // Delete the flavor by id
        res.sendStatus(204); // Send No Content status
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

//Update a flavor
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const { name, is_favorite } = req.body; // Destructure the request body
        const result = await client.query(
            `UPDATE flavors 
            SET name = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 RETURNING *`,
            [name, is_favorite, req.params.id] // Use nullish coalescing operator to set default value
        );
        res.send(result.rows[0]); // Send the updated row as response
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

// Database and server initialization
const init = async () => {
    try {
        await client.connect(); // Connect to the PostgreSQL database
        console.log('Connected to the database');
    
        let SQL = `
        DROP TABLE IF EXISTS flavors;
        
        CREATE TABLE flavors (
            id SERIAL PRIMARY KEY, 
            name VARCHAR(100) NOT NULL,
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        `;
        await client.query(SQL); // Execute the SQL query
        console.log('Tables created');
    
        SQL = `
        INSERT INTO flavors (name, is_favorite) VALUES
        ('French Vanilla', true),
        ('Chocolate', false),
        ('Rocky Road', true),
        ('Mint Chocolate Chip', false),
        ('Cookie Dough', true),
        ('Coffee', false);
        `; 
        await client.query(SQL); // Execute the SQL query
        console.log('Data seeded');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    
    } catch (error) {
        console.error('Error starting app:', error);
    } 
}; 

init();
import cors from 'cors';
import express from 'express';
import pg from 'pg'

const server = express();
server.use(cors());
server.use(express.json());

const { Pool } = pg;
const connectionData = {
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
}

const connection = new Pool(connectionData);

server.get('/categories', async (req, res) => {
    const promise = await connection.query('SELECT * FROM categories');
    res.send(promise.rows)
});

server.post('/categories', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.sendStatus(400)
        return;
    }
    const promise = await connection.query('SELECT * FROM categories');
    const found = promise.rows.find(element => element.name === name);
    if (found) {
        res.sendStatus(409);
        return;
    }
    connection.query('INSERT INTO categories (name) VALUES ($1);', [name]);
    res.sendStatus(201);
});


server.get('/games', async (req, res) => {
    const { name } = req.query;
    if (!name) {
        console.log(name)
        const promise = await connection.query('SELECT * FROM games;');
        res.send(promise.rows)

        return
    }
    console.log(name)
    const promise = await connection.query('SELECT * FROM games WHERE $1;', [name]);
    res.send(promise.rows)

});

server.post('/games', async (req, res) => {
    const { name, stockTotal, pricePerDay, categoryId, image } = req.body;
    if (!name || stockTotal === 0 || pricePerDay === 0) {
        res.sendStatus(400)
        return;
    }
    const promise = await connection.query('SELECT * FROM categories');
    const found = promise.rows.find(element => element.name === name);
    if (found) {
        res.sendStatus(409);
        return;
    }
    connection.query('INSERT INTO games (name,  image, stockTotal, categoryId, pricePerDay) VALUES ($1,$2,$3,$4, $5);', [name, image, stockTotal, categoryId, pricePerDay]);
    res.sendStatus(201);
})


server.listen(4000);
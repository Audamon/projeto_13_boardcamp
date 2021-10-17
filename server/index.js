import cors from 'cors';
import express from 'express';
import moment from 'moment';
import pg from 'pg';


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
};

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
    const gameName = name + '%';
    try {
        if (!name) {

            const promise = await connection.query('SELECT * FROM games;');
            res.send(promise.rows)
            return
        }
        const promise = await connection.query('SELECT * FROM games WHERE name LIKE $1;', [gameName]);
        res.send(promise.rows)

    } catch (error) {
        console.log(error);
        res.sendStatus(500);

    }
});

server.post('/games', async (req, res) => {
    const { name, stockTotal, pricePerDay, categoryId, image } = req.body;

    try {
        if (!name || stockTotal === 0 || pricePerDay === 0) {
            res.sendStatus(400)
            return;
        }
        const promise = await connection.query('SELECT * FROM games;');
        const found = promise.rows.find(element => element.name === name);
        if (found) {
            res.sendStatus(409);
            return;
        }
        const hasId = await connection.query('SELECT * FROM categories;');
        const validId = hasId.rows.find(element => element.id === categoryId);
        if (!validId) {
            return res.sendStatus(400);
        };
        await connection.query('INSERT INTO games (name,  image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1,$2,$3,$4, $5);', [name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.get('/customers', async (req, res) => {
    const { cpf } = req.query;
    const userCpf = cpf + "%";
    try {
        if (!cpf) {
            const promise = await connection.query('SELECT * FROM customers');
            return res.send(promise.rows);
        }
        const promise = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1;', [userCpf]);
        res.send(promise.rows);
    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }
});

server.get('/customers/:id', async(req, res)=>{
    const userId = Number(req.params.id);
    try{
        const promise = await connection.query('SELECT * FROM customers;');
        const found = promise.rows.find(element => element.id === userId);
        if(!found){
            return res.sendStatus(404);
        }
        res.send(found);
        
    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }
});

server.post('/customers', async(req, res)=>{
    const { name, phone, cpf, birthday} = req.body;
    let regexCpf = /[0-9]+/i;
    const validCpf = regexCpf.test(cpf);
    let regexPhone = /[0-9]+/i;
    const validPhone =  regexPhone.test(phone);
    const validDate = moment(`${birthday}`, "YYYY-MM-DD", true).isValid();
    try{
        if(!name || !validCpf || !validPhone || !validDate){
            return res.sendStatus(400);
        }
        const hasCpf = await connection.query('SELECT * FROM customers;');
        console.log(hasCpf);
        const testCpf = hasCpf.rows.find(element => element.cpf === cpf);
        console.log(testCpf);
        if (testCpf) {
            return res.sendStatus(409);
        };
        await connection.query('INSERT INTO customers(name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);', [name, phone, cpf, birthday]);
        res.sendStatus(201);

    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

server.put('/customers/:id', async(req, res)=>{
    const customersId = Number(req.params.id);
    const { name, phone, cpf, birthday} = req.body;
    let regexCpf = /[0-9]+/i;
    const validCpf = regexCpf.test(cpf);
    let regexPhone = /[0-9]+/i;
    const validPhone =  regexPhone.test(phone);
    const validDate = moment(`${birthday}`, "YYYY-MM-DD", true).isValid();
    try{
        if(!name || !validCpf || !validPhone || !validDate){
            return res.sendStatus(400);
        }
        const hasCpf = await connection.query('SELECT * FROM customers;');
        const testCpf = hasCpf.rows.find(element => element.cpf === cpf);

        if (testCpf) {
            return res.sendStatus(409);
        };
        console.log(customersId);
        await connection.query('UPDATE customers SET name = $1, phone = $2, cpf = $3 , birthday = $4 WHERE id = $5 ;', [name, phone, cpf, birthday, customersId]);
        res.sendStatus(200);

    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }

});

server.listen(4000);
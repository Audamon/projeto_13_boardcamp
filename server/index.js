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
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

server.get('/customers/:id', async (req, res) => {
    const userId = Number(req.params.id);
    try {
        const promise = await connection.query('SELECT * FROM customers;');
        const found = promise.rows.find(element => element.id === userId);
        if (!found) {
            return res.sendStatus(404);
        }
        res.send(found);

    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

server.post('/customers', async (req, res) => {
    const { name, phone, cpf, birthday } = req.body;
    let regexCpf = /[0-9]+/i;
    const validCpf = regexCpf.test(cpf);
    let regexPhone = /[0-9]+/i;
    const validPhone = regexPhone.test(phone);
    const validDate = moment(`${birthday}`, "YYYY-MM-DD", true).isValid();
    try {
        if (!name || !validCpf || !validPhone || !validDate) {
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

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.put('/customers/:id', async (req, res) => {
    const customersId = Number(req.params.id);
    const { name, phone, cpf, birthday } = req.body;
    let regexCpf = /[0-9]+/i;
    const validCpf = regexCpf.test(cpf);
    let regexPhone = /[0-9]+/i;
    const validPhone = regexPhone.test(phone);
    const validDate = moment(`${birthday}`, "YYYY-MM-DD", true).isValid();
    try {
        if (!name || !validCpf || !validPhone || !validDate) {
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

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

});

server.get('/rentals', async (req, res) => {
    const { customerId, gameId } = req.query;
    try {
        if (customerId) {

            const idCustomer = Number(customerId);
            const result = await connection.query('SELECT rentals.*, customers.id AS customer, customers.name, games.id AS "idGame", games.name AS game, games."categoryId", categories.name AS category FROM customers JOIN rentals ON customers.id=rentals."customerId" JOIN games ON rentals."gameId"=games.id JOIN categories ON games."categoryId" = categories.id;');
            const customerRental = result.rows.filter(element => element.customerId === idCustomer);
            let finalObject = [];
            customerRental.forEach(element => {
                finalObject.push({
                    id: element.id, customerId: element.customer, gameId: element.idGame, rentDate: element.rentDate, daysRented: element.daysRented,
                    returnDate: element.returnDate, originalPrice: element.originalPrice, delayFee: element.delayFee, customer: { id: element.customer, name: element.name },
                    game: { id: element.idGame, name: element.game, categoryId: element.categoryId, categoryName: element.category }
                });
            })
            return res.send(finalObject);
        }
        if (gameId) {
            const idGame = Number(gameId);
            const result = await connection.query('SELECT rentals.*, customers.id AS customer, customers.name, games.id AS "idGame", games.name AS game, games."categoryId", categories.name AS category FROM customers JOIN rentals ON customers.id=rentals."customerId" JOIN games ON rentals."gameId"=games.id JOIN categories ON games."categoryId" = categories.id;');
            const gameRental = result.rows.filter(element => element.gameId === idGame);
            let finalObject = [];
            gameRental.forEach(element => {
                finalObject.push({
                    id: element.id, customerId: element.customer, gameId: element.idGame, rentDate: element.rentDate, daysRented: element.daysRented,
                    returnDate: element.returnDate, originalPrice: element.originalPrice, delayFee: element.delayFee, customer: { id: element.customer, name: element.name },
                    game: { id: element.idGame, name: element.game, categoryId: element.categoryId, categoryName: element.category }
                });
            })
            return res.send(finalObject);
        }
        const result = await connection.query('SELECT rentals.*, customers.id AS customer, customers.name, games.id AS "idGame", games.name AS game, games."categoryId", categories.name AS category FROM customers JOIN rentals ON customers.id=rentals."customerId" JOIN games ON rentals."gameId"=games.id JOIN categories ON games."categoryId" = categories.id;');
        let finalObject = [];
        result.rows.forEach(element => {
            finalObject.push({
                id: element.id, customerId: element.customer, gameId: element.idGame, rentDate: element.rentDate, daysRented: element.daysRented,
                returnDate: element.returnDate, originalPrice: element.originalPrice, delayFee: element.delayFee, customer: { id: element.customer, name: element.name },
                game: { id: element.idGame, name: element.game, categoryId: element.categoryId, categoryName: element.category }
            })
        });
        res.send(finalObject);

    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

server.post('/rentals', async (req, res) => {
    const { customerId, gameId, daysRented } = req.body;
    const delayFee = null;
    const returnDate = null;
    const nowDate = new Date();
    const rentDate = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate();
    try {
        const customers = await connection.query('SELECT * FROM customers;');
        const foundCustomer = customers.rows.find(element => element.id === customerId);
        if (!foundCustomer) {
            return res.sendStatus(400);
        }
        const games = await connection.query('SELECT * FROM games;');
        const foundGame = games.rows.find(element => element.id === gameId);
        if (!foundGame) {
            return res.sendStatus(400);
        }
        if (daysRented <= 0) {
            return res.sendStatus(400);
        }
        if (foundGame.stockTotal <= 0) {
            return res.sendStatus(400)
        }
        const gameStock = foundGame.stockTotal - 1;
        const originalPrice = daysRented * games.rows[0].pricePerDay;
        await connection.query('UPDATE games SET "stockTotal" =  $1 WHERE id = $2', [gameStock, foundGame.id]);
        await connection.query('INSERT INTO rentals ("customerId", "gameId", "daysRented", "delayFee", "returnDate", "rentDate", "originalPrice") VALUES ($1,$2,$3,$4,$5,$6,$7);', [customerId, gameId, daysRented, delayFee, returnDate, rentDate, originalPrice]);
        res.sendStatus(201);

    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }

});

server.post('/rentals/:id/return', async (req, res) => {
    const rentalId = Number(req.params.id);
    const nowDate = new Date();
    const returnDate = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate();
    try {

        const rentals = await connection.query('SELECT * FROM rentals;');

        const found = rentals.rows.find(element => element.id === rentalId);
        if (!found) {
            return res.sendStatus(404);
        }
        const finishedRental = rentals.rows.find(element => element.returnDate === null);
        if (!finishedRental) {
            return res.sendStatus(400);
        }
        const delayFee = (nowDate.getDate() - found.rentDate.getDate()) * (found.originalPrice / found.daysRented);
        console.log(delayFee)
        await connection.query('UPDATE rentals SET "delayFee" = $1, "returnDate"=$2 WHERE  id = $3;', [delayFee,returnDate ,rentalId]);
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

server.delete('/rentals/:id', async(req, res)=>{
    const rentalId = Number(req.params.id);
    try{
        const rent = await connection.query('SELECT * FROM rentals;');
        const found = rent.rows.find(element=>element.id === rentalId);
        if(!found){
            return res.sendStatus(404);
        }
        if(found.returnDate !== null){
            return res.sendStatus(400);
        }
        const games = await connection.query('SELECT * FROM games;');
        const foundGame = games.rows.find(element => element.id === found.gameId);
        const gameStock = foundGame.stockTotal +1;
        await connection.query('UPDATE games SET "stockTotal" = $1 WHERE id = $2;', [gameStock, found.gameId])
        await connection.query('DELETE FROM rentals WHERE rentals.id = $1;', [rentalId]);
        res.sendStatus(200);

    }catch(error){
        console.log(error);
        return res.sendStatus(500);
    }
});

server.listen(4000);
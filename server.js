/* 
psql

todo db:
CREATE TABLE todo (
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	type VARCHAR, -- spesa, ecc
	title VARCHAR,
	description VARCHAR,
	foruser VARCHAR,
	doneby VARCHAR DEFAULT NULL
);

order db:
CREATE TABLE orders (
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	cibo VARCHAR,
	foruser VARCHAR
);
*/

const express = require('express');
const path = require('path');

const flash = require("express-flash");
const session = require('express-session');

// env
require('dotenv').config();

const app = express();
app.use(flash());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

const PORT = process.env.PORT || 3000;
// ejs
app.set('view engine', 'ejs');
// connect to database
const { pool } = require("./db");


app.get('/', (req, res) => {
	res.render('index.ejs', { active: 'lista-btn' });
});

app.get('/todo', async (req, res) => {
	try {
		const results = await pool.query("SELECT * FROM todo ORDER BY doneby IS NOT NULL, time DESC");
		res.render('todo.ejs', { lista: results.rows });
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/order', async (req, res) => {
	try {
		const results = await pool.query("SELECT * FROM orders ORDER BY id ASC");
		res.render('order.ejs', { lista: results.rows });
	} catch (error) {
		console.error(error.message);
	}
});

// api

// todo

app.post('/api/todo/add', async (req, res) => {
	try {
		const { type, title, description, user} = req.body;
		const newTodo = await pool.query("INSERT INTO todo (type, title, description, foruser) VALUES($1, $2, $3, $4) RETURNING *", [type, title, description, user]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/todo/get/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const todo = await pool.query("SELECT * FROM todo WHERE id = $1", [id]);
		res.json(todo.rows[0]);
	} catch (error) {
		console.error(error.message);
	}
});

app.post('/api/todo/update/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { type, title, description, user } = req.body;
		const updatedTodo = await pool.query("UPDATE todo SET type = $1, title = $2, description = $3, foruser = $4 WHERE id = $5", [type, title, description, user, id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/todo/delete/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const deletedTodo = await pool.query("DELETE FROM todo WHERE id = $1", [id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.post('/api/todo/doneby/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { doneby } = req.body;
		const doneTodo = await pool.query("UPDATE todo SET doneby = $1 WHERE id = $2", [doneby, id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/todo/undone/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const undoneTodo = await pool.query("UPDATE todo SET doneby = NULL WHERE id = $1", [id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

// order

app.post('/api/order/add', async (req, res) => {
	try {
		const { cibo, user} = req.body;
		const newOrder = await pool.query("INSERT INTO orders (cibo, foruser) VALUES($1, $2) RETURNING *", [cibo, user]);
		res.redirect('/order');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/order/get/:id', async (req, res) => {
	try {
		// use id and foruser to get order
		const { id } = req.params;
		const order = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
		res.json(order.rows[0]);
	} catch (error) {
		console.error(error.message);
	}
});

app.post('/api/order/update/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { cibo, user } = req.body;
		// user can be null when update default order
		const updatedOrder = await pool.query(
			"UPDATE orders SET cibo = $1, foruser = COALESCE($2, foruser) WHERE id = $3 RETURNING *",
			[cibo, user, id]
		);

		if (updatedOrder.rowCount === 0) {
			return res.status(404).json({ message: "Order not found" });
		}

		res.json(updatedOrder.rows[0]);
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/order/delete/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if(id > 0 && id < 9){
			res.redirect('/order');
			return;
		}
		const deletedOrder = await pool.query("DELETE FROM orders WHERE id = $1", [id]);
		res.redirect('/order');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/order/azzera', async (req, res) => {
	try {
		const deletedOrder = await pool.query("DELETE FROM orders WHERE id > 8");
		// set null orders
		await pool.query("UPDATE orders SET cibo = NULL");
		res.redirect('/order');
	} catch (error) {
		console.error(error.message);
	}
});

/* set static folder for css etc */
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
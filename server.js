/* shared todo list

psql

basic db: (temp demo)
CREATE TABLE todo (
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	type VARCHAR, -- spesa, ecc
	title VARCHAR,
	description VARCHAR,
	author VARCHAR,
	doneby VARCHAR DEFAULT NULL
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
		res.render('todo.ejs', { lista: results.rows, active: 'lista-btn'});
	} catch (error) {
		console.error(error.message);
	}
});

// api

app.post('/api/add', async (req, res) => {
	try {
		const { type, title, description, author} = req.body;
		const newTodo = await pool.query("INSERT INTO todo (type, title, description, author) VALUES($1, $2, $3, $4) RETURNING *", [type, title, description, author]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/get/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const todo = await pool.query("SELECT * FROM todo WHERE id = $1", [id]);
		res.json(todo.rows[0]);
	} catch (error) {
		console.error(error.message);
	}
});

app.post('/api/update/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { type, title, description, author } = req.body;
		const updatedTodo = await pool.query("UPDATE todo SET type = $1, title = $2, description = $3, author = $4 WHERE id = $5", [type, title, description, author, id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/delete/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const deletedTodo = await pool.query("DELETE FROM todo WHERE id = $1", [id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.post('/api/doneby/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { doneby } = req.body;
		const doneTodo = await pool.query("UPDATE todo SET doneby = $1 WHERE id = $2", [doneby, id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

app.get('/api/undone/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const undoneTodo = await pool.query("UPDATE todo SET doneby = NULL WHERE id = $1", [id]);
		res.redirect('/todo');
	} catch (error) {
		console.error(error.message);
	}
});

/*
$.ajax({
				url: `/api/done/${id}`,
				type: 'GET',
				success: function(data) {
					// update icon
					$(`#${id} .done i`).removeClass('fa-times fa-check').addClass(`fa-${data.done ? 'check' : 'times'}`);
				}
			});
*/


/* set static folder for css etc */
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
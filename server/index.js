const express = require("express");
const cors = require('cors');
const {Pool, Client } = require("pg")
const PORT = process.env.PORT || 3001;
const path = require('path')

require('dotenv').config({
	override: true,
	path: path.join(__dirname, 'development.env')
})
const app = express();

app.use(cors());

const pool = new Pool({
	user: process.env.USER,
	host: process.env.HOST,
	database: process.env.DATABASE,
	password: process.env.PASSWORD,
	port: process.env.PORT
});

(async () => {

	const client = await pool.connect();
	try {
		const { rows } = await client.query('SELECT current_user')
		const currentUser = rows[0]['current_user']
		console.log[currentUser]
	}
	catch (err) {
		console.log(err);
	} finally {
		client.release();
	}

})();

app.get("/api", (req, res) => {
	res.json({ message: "Hello from server, man!" });
});

//must be last
app.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`);
});

/*// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../project-management-react/build')));

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../project-management-react/build', 'index.html'));
});*/
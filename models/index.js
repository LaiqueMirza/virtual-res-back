const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);

const sequelize = new Sequelize(
	process.env.DB_NAME || "resume_analytics",
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST,
		port: process.env.DB_PORT || 3306,
		dialect: "mysql",
		operatorsAliases: false,
		pool: {
			max: 10,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
		logging: false, // Set to console.log to see SQL queries
		retry: {
			max: 5, // Maximum retry attempts
			match: [/Deadlock/i, /ETIMEDOUT/, /ECONNREFUSED/, /SequelizeConnectionError/], // Retry on these errors
			backoffBase: 1000, // Initial backoff duration in ms
			backoffExponent: 1.5, // Exponential backoff factor
		},
	}
);

// Function to handle database connection with retry logic
const connectWithRetry = async (maxRetries = 5, delay = 5000) => {
	let retries = 0;
	while (retries < maxRetries) {
		try {
			await sequelize.authenticate();
			console.log("Database connected..");
			return true;
		} catch (err) {
			retries++;
			console.log(`Connection attempt ${retries} failed: ${err.message}`);
			if (retries >= maxRetries) {
				console.log("Max retries reached. Operating in offline mode.");
				return false;
			}
			console.log(`Retrying in ${delay}ms...`);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
};

// Initial connection
connectWithRetry();

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

fs.readdirSync(__dirname)
	.filter((file) => {
		return (
			file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
		);
	})
	.forEach((file) => {
		const model = require(path.join(__dirname, file))(
			sequelize,
			Sequelize.DataTypes
		);
		db[model.name] = model;
	});

Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});

require('../config/model_joins')(db);

db.sequelize.sync({ force: true }).then(() => {
	console.log("yes re-sync done!");
});


module.exports = db;
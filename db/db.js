const mongoose = require('mongoose');

const options = {
	useNewUrlParser: true,
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 5000, // Timeout after 10s instead of 30s
	useCreateIndex: true,
	poolSize: 10,
	bufferCommands: false,
	bufferMaxEntries: 0,
	connectTimeoutMS: 3000, // Give up initial connection after 10 seconds
	socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
	family: 4,
};

mongoose.Promise = global.Promise;

let isConnected;

module.exports = class DbUtils {
	static async connect() {
		mongoose.set('bufferCommands', false); //if true this makes query hang until mongo is up again
		if (isConnected) {
			return Promise.resolve();
		}

		console.log(process.env.MONGO_URI);
		await mongoose
			.connect(process.env.MONGO_URI || 'mongodb://54.205.251.120:27017/finpro-test', options)
			.then((db) => {
				console.log('mongo connection new opened.. returning that');
				isConnected = db.connection.readyState;
			})
			.catch(function (reason) {
				console.log('Unable to connect to the mongodb instance. Error: ', reason);
				// throw new Error(`not able to connect to db`);
			});

		mongoose.connection.on('connected', function () {
			//do something when connected
		});

		mongoose.connection.on('error', (err) => {
			console.log(err);
			return { error: `not able to connect to db` };
		});
	}

	static error(callback) {
		mongoose.connection.on('error', (err) => {
			console.log(err);
			callback(err);
		});
	}

	static disconnect(callback) {
		mongoose.connection.close(callback);
	}

	static dropAll(callback) {
		mongoose.connection.db.dropDatabase(() => {
			callback();
		});
	}
};

const app = require('./handler').app;
const mongoose = require('mongoose');

// const options = {
// 	useNewUrlParser: true,
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true,
// 	serverSelectionTimeoutMS: 5000, // Timeout after 10s instead of 30s
// 	useCreateIndex: true,
// 	poolSize: 10,
// 	bufferCommands: false,
// 	bufferMaxEntries: 0,
// 	connectTimeoutMS: 3000, // Give up initial connection after 10 seconds
// 	socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
// 	family: 4,
// };

// mongoose
// 	.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finpro', options)
// 	.then((db) => {
// 		console.log('mongo connection new opened.. returning that');
// 	})
// 	.catch(function (reason) {
// 		console.log('Unable to connect to the mongodb instance. Error: ', reason);
// 		throw new Error(`not able to connect to db`);
// 	});

const server = app.listen(3000, () => {
	console.info('Listening on port 3000.');
});

// This will handle process.exit():
process.on('exit', async () => {
	server.close(() => {
		console.log('finpro api api server closed.');
	});
});

// // This will handle kill commands, such as CTRL+C:
process.on('SIGINT', async () => {
	server.close(() => {
		console.log('finpro api api server closed.');
	});
});

process.on('SIGTERM', async () => {
	server.close(() => {
		console.log('finpro api api server closed.');
	});
});

// // This will prevent dirty exit on code-fault crashes:
process.on('uncaughtException', async (error) => {
	console.error(error);
	server.close(() => {
		console.log('finpro api api server closed.');
	});
});

const mongoose = require('mongoose');
const authSchema = new mongoose.Schema({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	cogUserId: {
		type: String,
		required: true,
	},
	firstName: {
		type: String,
	},

	lastName: {
		type: String,
	},

	email: {
		type: String,
	},
	password: {
		type: String,
	},
	phone: {
		type: String,
	},
	profile: {
		type: String,
	},
});

module.exports = mongoose.model('Auth', authSchema);

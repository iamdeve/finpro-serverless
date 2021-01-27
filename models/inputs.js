const mongoose = require('mongoose');
const inputsSchema = new mongoose.Schema({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	userId: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},

	inputs: [
		{
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			hire: {
				type: String,
				required: true,
			},
			startDate: {
				type: String,
				required: true,
			},
			salary: {
				type: String,
				required: true,
			},
			taxes: {
				type: String,
				required: true,
			},
			commissions: {
				type: String,
				required: true,
			},
		},
	],
	majorExpenseInput: [
		{
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			heading: {
				type: String,
			},
			value: {
				type: String,
			},
			cost: {
				type: String,
			},
			perEmployee: {
				type: String,
			},
			date: {
				type: String,
			},
		},
	],
});

module.exports = mongoose.model('Inputs', inputsSchema);

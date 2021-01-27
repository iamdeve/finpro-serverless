const mongoose = require('mongoose');
const revenuSchema = new mongoose.Schema({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	userId: {
		type: String,
		required: true,
		unique: true,
	},

	revenuInputs: [
		{
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			plan: {
				type: String,
				required: true,
			},
			price: {
				type: String,
				required: true,
			},
			purchasers: {
				type: String,
				required: true,
			},
			type: {
				type: String,
				required: true,
			},
			color: {
				type: String,
			},
			date: {
				type: Date,
				default: new Date(),
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
		},
	],

	startingCapital: [
		{
			_id: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
			source: {
				type: String,
				required: true,
			},
			amount: {
				type: String,
				required: true,
			},
		},
	],
});

module.exports = mongoose.model('Revenue', revenuSchema);

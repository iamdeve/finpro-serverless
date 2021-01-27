const mongoose = require('mongoose');
const purchasingSchema = new mongoose.Schema({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	userId: {
		type: String,
		required: true,
	},
	planName: {
		type: String,
		required: true,
	},
	planId: {
		type: String,
		require: true,
	},
	planType: {
		type: String,
		require: true,
	},
	status: {
		type: String,
		require: true,
	},
	purchaseDate: {
		type: String,
		required: true,
	},
	trialStartDate: {
		type: String,
	},
	subscriptionDetails: {
		type: Object,
	},
	customerDetails: {
		type: Object,
	},
});

module.exports = mongoose.model('Purchasing', purchasingSchema);

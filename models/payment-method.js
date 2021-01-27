const mongoose = require('mongoose');
const paymentMethodSchema = new mongoose.Schema({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	userId: {
		type: String,
		required: true,
	},
	paymentMethod: {
		type: Object,
		require: true,
	},
	card: {
		type: Object,
		require: true,
	},
	status: {
		type: String,
		required: true,
		default: 'active',
	},
	type: {
		type: String,
		required: true,
		default: 'default',
	},
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

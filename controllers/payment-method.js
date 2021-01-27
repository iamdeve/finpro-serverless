const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const PaymentMethod = require('../models/payment-method');
const Stripe = require('stripe');
const dbUtils = require('../db/db');
const stripe = Stripe('sk_test_51HQQAWL2QqDUeeFIZZbvXrcmZMVNnXXwEZeZZ8NV7ng8XRQjj3yoYPjbUmDRIc5Khe685lSoBR6pZaP1ajaU05w500YStSumf9');
module.exports.userPayments = (req, res, next) => {
	const userCogId = req.user.payload.email;

	PaymentMethod.find({ userId: userCogId })
		.exec()
		.then(async (result) => {
			return res.status(200).json({ paymentsMethods: result });
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.addValidation = [
	check('number', 'Card umber field Should not empty').not().isEmpty(),
	check('exp_month', 'Expiry month field Should not empty').not().isEmpty(),
	check('exp_year', 'Expiry year field Should not empty').not().isEmpty(),
	check('cvc', 'Cvc field Should not empty').not().isEmpty(),
];
module.exports.addMethod = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const userCogId = req.user.payload.email;

	const { number, exp_month, exp_year, cvc } = req.body;

	try {
		const methods = await stripe.paymentMethods.create({
			type: 'card',
			card: {
				number: number || '4242424242424242',
				exp_month: exp_month,
				exp_year: exp_year,
				cvc: cvc,
			},
		});

		const createPayment = new PaymentMethod({
			_id: mongoose.Types.ObjectId(),
			userId: userCogId,
			paymentMethod: methods,
			card: {
				number: number || '4242424242424242',
				exp_month: exp_month,
				exp_year: exp_year,
				cvc: cvc,
			},
			status: 'active',
			type: 'default',
		});
		createPayment
			.save()
			.then(() => {
				console.log('payment save');
				res.status(200).json({ message: `Payment added successfully` });
			})
			.catch((err) => {
				console.log(`last final error ${err}`);
				res.status(500).json({
					error: err,
				});
			});
		PaymentMethod.find({ userId: userCogId }).then((result) => {
			if (result && result.length > 0) {
				for (let i = 0; i < result.length; i++) {
					result[i].type = 'secondary';
					result[i]
						.save()
						.then(() => {
							console.log('save');
						})
						.catch((err) => {
							console.log(err);
						});
				}
			}
		});
	} catch (err) {
		console.log(`final error ${err}`);
		res.status(500).json({
			error: err,
		});
	}
};

module.exports.delete = async (req, res, next) => {
	if (req.params.id === null || req.params.id === undefined || req.params.id === '') {
		res.status(500).json({
			error: 'ayload must not be empty',
		});
	}
	await dbUtils.connect();
	try {
		let deleteRes = await PaymentMethod.findByIdAndDelete(req.params.id);
		if (deleteRes) {
			res.status(200).json({ message: 'Deleted Successfully' });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({
			error: err,
		});
	}
};

module.exports.update = (req, res, next) => {};

module.exports.userPayment = async (req, res, next) => {
	const userCogId = req.user.payload.email;
	await dbUtils.connect();
	PaymentMethod.find({ userId: userCogId })
		.exec()
		.then(async (result) => {
			return res.status(200).json({ paymentMethods: result });
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.status = async (req, res, next) => {
	if (req.params.id === null || req.params.id === undefined || req.params.id === '') {
		res.status(500).json({
			error: 'ayload must not be empty',
		});
	}
	await dbUtils.connect();
	try {
		let result = await PaymentMethod.findOne(req.params.id);

		if (result) {
			result.status = req.params.status;
			await result.save();
			res.status(200).json({ message: 'Deleted Successfully' });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({
			error: err,
		});
	}
};

module.exports.type = async (req, res, next) => {
	if (req.params.id === null || req.params.id === undefined || req.params.id === '') {
		res.status(500).json({
			error: 'ayload must not be empty',
		});
	}
	await dbUtils.connect();
	try {
		let result = await PaymentMethod.findOne(req.params.id);
		if (result) {
			result.type = req.params.type;
			await result.save();
			res.status(200).json({ message: 'Deleted Successfully' });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({
			error: err,
		});
	}
};

const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const Purchasing = require('../models/purchasing');
const dbUtils = require('../db/db');
module.exports.userPurchasing = async (req, res, next) => {
	const userCogId = req.user.payload.email;

	await dbUtils.connect();
	Purchasing.find({ userId: userCogId })
		.exec()
		.then(async (result) => {
			return res.status(200).json({ purchasing: result });
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.addPurchasingValidation = [];
module.exports.addPurchasing = (req, res, next) => {};

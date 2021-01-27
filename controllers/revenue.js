const mongoose = require('mongoose');
const Revenue = require('../models/revenue');
const { check, validationResult } = require('express-validator');
const colors = require('../utils/colors');
const dbUtils = require('../db/db');

module.exports.revenueInputValidator = [
	check('plan', 'Plan field Should not empty').not().isEmpty(),
	check('price', 'Price field Should not empty').not().isEmpty(),
	check('purchasers', 'Purchasers field Should not empty').not().isEmpty(),
	check('type', 'Type field Should not empty').not().isEmpty(),
];

module.exports.userRevenu = async (req, res, next) => {
	const userCogId = req.user.payload.email;
	await dbUtils.connect();
	Revenue.findOne({ userId: userCogId })
		.exec()
		.then(async (result) => {
			return res.status(200).json({ allRevenus: result });
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.revenueInput = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { plan, price, purchasers, type, date, color } = req.body;
	const userCogId = req.user.payload.email;
	Revenue.findOne({ userId: userCogId })
		.exec()
		.then(async (result) => {
			if (result && result.userId !== '') {
				console.log('revenu exist');
				result.revenuInputs.push({
					_id: mongoose.Types.ObjectId(),
					plan,
					price,
					purchasers,
					type,
					date,
					color: color ? color : colors[Math.floor(Math.random() * colors.length - 1)],
				});
				await result.save();
				return res.status(200).json({
					message: 'Revenue added successfully',
				});
			} else {
				const revenue = new Revenue({
					_id: mongoose.Types.ObjectId(),
					userId: userCogId,
					revenuInputs: [
						{
							_id: mongoose.Types.ObjectId(),
							plan,
							price,
							purchasers,
							type,
							date,
							color: color ? color : colors[Math.floor(Math.random() * colors.length - 1)],
						},
					],
				});
				revenue
					.save()
					.then(() => {
						console.log('revenue save');
						res.status(200).json({ message: 'Revenue added successfully' });
					})
					.catch((err) => {
						console.log(`last final error ${err}`);
						res.status(500).json({
							error: err,
						});
					});
			}
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.deleteRevenueInputValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('revenueInputId', 'Revenue input id field Should not empty').not().isEmpty()];

module.exports.deleteRevenueInput = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, revenueInputId } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.revenuInputs = result.revenuInputs.filter((rev) => rev.id !== revenueInputId);
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Revenue deleted successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.updateRevenueInputValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('revenueInputId', 'Revenue input id field Should not empty').not().isEmpty(), check('data', 'Please send at least one field').not().isEmpty()];

module.exports.updateRevenue = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, revenueInputId, data } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.revenuInputs = result.revenuInputs.map((rev) => {
				if (rev.id === revenueInputId) {
					return {
						...rev.toObject(),
						...data,
					};
				} else {
					return rev;
				}
			});
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Revenue updated successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.addExpenseValidation = [
	check('revenueId', 'Revenue id field Should not empty').not().isEmpty(),
	check('heading', 'Heading name Should not empty').not().isEmpty(),
	check('value', 'Value name Should not empty').not().isEmpty(),
	check('cost', 'Cost input id field Should not empty').not().isEmpty(),
];

module.exports.addExpense = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, heading, cost, value } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.majorExpenseInput.push({
				_id: mongoose.Types.ObjectId(),
				heading,
				value,
				cost,
			});

			console.log(result.majorExpenseInput);
			result.markModified('majorExpenseInput');
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Expense added successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.deleteExpenseValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('majorExpenseInputId', 'Expense input id field Should not empty').not().isEmpty()];

module.exports.deleteExpense = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, majorExpenseInputId } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.majorExpenseInput = result.majorExpenseInput.filter((rev) => rev.id !== majorExpenseInputId);
			// console.log(result.majorExpenseInput[index])
			result.markModified('majorExpenseInput');
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Expense deleted successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};
module.exports.updateExpenseValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('expenseInputId', 'Expense Id name Should not empty').not().isEmpty(), check('data', 'data should not be empty').not().isEmpty()];

module.exports.updateExpense = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, expenseInputId, data } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.majorExpenseInput = result.majorExpenseInput.map((rev) => {
				if (rev.id === expenseInputId) {
					return {
						...rev.toObject(),
						...data,
					};
				} else {
					return rev;
				}
			});

			result.markModified('majorExpenseInput');
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Expense updated successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.addStartingCapitalValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('source', 'Source name Should not empty').not().isEmpty(), check('amount', 'Amount name Should not empty').not().isEmpty()];
module.exports.addStartingCapital = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, source, amount } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.startingCapital.push({
				_id: mongoose.Types.ObjectId(),
				source,
				amount,
			});
			result.markModified('startingCapital');
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Starting Capital added successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.deleteStartingCapitalValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('startingCapitalId', 'Starting Capital input id field Should not empty').not().isEmpty()];

module.exports.deleteStartingCapital = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, startingCapitalId } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.startingCapital = result.startingCapital.filter((rev) => rev.id !== startingCapitalId);
			console.log(result.startingCapital);
			result.markModified('startingCapital');
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Starting Capital deleted successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.updateStartCapitalValidation = [check('revenueId', 'Revenue id field Should not empty').not().isEmpty(), check('startingCapitalId', 'Starting Capital Id name Should not empty').not().isEmpty(), check('data', 'data should not be empty').not().isEmpty()];

module.exports.updateStartingCapital = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { revenueId, startingCapitalId, data } = req.body;

	Revenue.findOne({ _id: revenueId })
		.exec()
		.then(async (result) => {
			result.startingCapital = result.startingCapital.map((rev) => {
				if (rev.id === startingCapitalId) {
					return {
						...rev.toObject(),
						...data,
					};
				} else {
					return rev;
				}
			});

			result.markModified('startingCapital');
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: 'Starting Capital updated successfully',
					});
				})
				.catch((err) => {
					res.status(500).json({
						error: err,
					});
				});
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

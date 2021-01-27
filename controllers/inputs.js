const mongoose = require('mongoose');
const Inputs = require('../models/inputs');
const { check, validationResult } = require('express-validator');
const dbUtils = require('../db/db');

module.exports.userInputs = async (req, res, next) => {
	await dbUtils.connect();
	const userCogId = req.user.payload.email;

	Inputs.find({ userId: userCogId })
		.exec()
		.then(async (result) => {
			return res.status(200).json({ allInputs: result });
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			res.status(500).json({
				error: err,
			});
		});
};

module.exports.addInputValidation = [
	check('hire', 'Hire field Should not empty').not().isEmpty(),
	check('startDate', 'Start Date field Should not empty').not().isEmpty(),
	check('salary', 'Salary field Should not empty').not().isEmpty(),
	check('taxes', 'Taxes field Should not empty').not().isEmpty(),
	check('commissions', 'Commissions field Should not empty').not().isEmpty(),
];

module.exports.addInputs = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const userCogId = req.user.payload.email;

	const { hire, startDate, salary, taxes, commissions, title } = req.body;

	Inputs.findOne({ userId: userCogId, title: title })
		.exec()
		.then(async (result) => {
			if (result && result.userId !== '' && result.title === title) {
				console.log('input exist');
				result.inputs.push({
					_id: mongoose.Types.ObjectId(),
					hire,
					startDate,
					salary,
					taxes,
					commissions,
				});
				await result.save();
				return res.status(200).json({
					message: `${title} added successfully`,
				});
			} else {
				const input = new Inputs({
					_id: mongoose.Types.ObjectId(),
					userId: userCogId,
					title: title,
					inputs: [
						{
							_id: mongoose.Types.ObjectId(),
							hire,
							startDate,
							salary,
							taxes,
							commissions,
						},
					],
				});
				input
					.save()
					.then(() => {
						console.log('revenue save');
						res.status(200).json({ message: `${title} added successfully` });
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

module.exports.deleteInputValidation = [check('inputMainId', 'Main Input id field Should not empty').not().isEmpty(), check('inputId', 'Input id field Should not empty').not().isEmpty()];
module.exports.deleteInputs = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { inputMainId, inputId } = req.body;
	Inputs.findOne({ _id: inputMainId })
		.exec()
		.then(async (result) => {
			result.inputs = result.inputs.filter((rev) => rev.id !== inputId);
			result
				.save()
				.then(() => {
					res.status(200).json({
						message: `${result.title} deleted successfully`,
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

module.exports.updateInputValidation = [check('inputMainId', 'Main Input Id field Should not empty').not().isEmpty(), check('inputId', 'Input id field Should not empty').not().isEmpty(), check('data', 'Please send at least one field').not().isEmpty()];
module.exports.updateInputs = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { inputMainId, inputId, data } = req.body;

	Inputs.findOne({ _id: inputMainId })
		.exec()
		.then(async (result) => {
			result.inputs = result.inputs.map((rev) => {
				if (rev.id === inputId) {
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
						message: `${result.title} updated successfully`,
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
	check('inputMainId', 'Input Main id field Should not empty').not().isEmpty(),
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
	const { inputMainId, heading, cost, value, perEmployee, date } = req.body;

	Inputs.findOne({ _id: inputMainId })
		.exec()
		.then(async (result) => {
			result.majorExpenseInput.push({
				_id: mongoose.Types.ObjectId(),
				heading,
				value,
				cost,
				perEmployee,
				date,
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

module.exports.deleteExpenseValidation = [check('inputMainId', 'Main id field Should not empty').not().isEmpty(), check('inputId', 'Expense input id field Should not empty').not().isEmpty()];

module.exports.deleteExpense = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { inputMainId, inputId } = req.body;

	Inputs.findOne({ _id: inputMainId })
		.exec()
		.then(async (result) => {
			result.majorExpenseInput = result.majorExpenseInput.filter((rev) => rev.id !== inputId);
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
module.exports.updateExpenseValidation = [check('inputMainId', 'Main Input id field Should not empty').not().isEmpty(), check('inputId', 'Expense Id name Should not empty').not().isEmpty(), check('data', 'data should not be empty').not().isEmpty()];

module.exports.updateExpense = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	await dbUtils.connect();
	const { inputMainId, inputId, data } = req.body;

	Inputs.findOne({ _id: inputMainId })
		.exec()
		.then(async (result) => {
			result.majorExpenseInput = result.majorExpenseInput.map((rev) => {
				if (rev.id === inputId) {
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
						message: `${result.title} updated successfully`,
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

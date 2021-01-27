const Stripe = require('stripe');
const Purchasing = require('../models/purchasing');
const PaymentMethod = require('../models/payment-method');
const stripe = Stripe('sk_test_51HQQAWL2QqDUeeFIZZbvXrcmZMVNnXXwEZeZZ8NV7ng8XRQjj3yoYPjbUmDRIc5Khe685lSoBR6pZaP1ajaU05w500YStSumf9');
const mongoose = require('mongoose');
const dbUtils = require('../db/db');
module.exports.subscription = async (req, res, next) => {
	const userCogId = req.user.payload.email;
	await dbUtils.connect();
	if (req.body.startTrial) {
		Purchasing.findOne({ userId: userCogId })
			.exec()
			.then((result) => {
				if (result) {
					console.log('==============');
					result.planName = 'Intro Plan';
					result.planId = 'price_1I1ErgL2QqDUeeFI8WjeHVri';
					result.planType = 'trial';
					result.trialStartDate = new Date();
					result.purchaseDate = new Date();
					result.status = 'active';
					result
						.save()
						.then(() => {
							console.log('purchase save');
							return res.status(200).json({ message: `subscribe successfully` });
						})
						.catch((err) => {
							console.log(`last final error ${err}`);
							return res.status(500).json({
								error: err,
							});
						});
				} else {
					console.log('*************');
					const purchse = new Purchasing({
						_id: mongoose.Types.ObjectId(),
						userId: userCogId,
						planName: 'Intro Plan',
						planId: 'price_1I1ErgL2QqDUeeFI8WjeHVri',
						planType: req.body.startTrial ? 'trial' : 'purchased',
						trialStartDate: new Date(),
						purchaseDate: new Date(),
						status: 'active',
					});
					purchse
						.save()
						.then(() => {
							console.log('purchase save');
							return res.status(200).json({ message: `subscribe successfully` });
						})
						.catch((err) => {
							console.log(`last final error ${err}`);
							return res.status(500).json({
								error: err,
							});
						});
				}
			})
			.catch((err) => {
				console.log(`final error ${err}`);
				return res.status(500).json({
					error: err,
				});
			});
	} else {
		PaymentMethod.findOne({ userId: userCogId, status: 'active', type: 'default' })
			.exec()
			.then(async (result) => {
				stripe.customers.create(
					{
						payment_method: result.paymentMethod.id,
						email: userCogId,
					},
					function (err, customer) {
						if (err) {
							console.log('here');
							console.log(err);
							return res.status(400).json({ error: err, message: 'Something wrong' });
						}

						console.log(customer);
						const { id } = customer;
						stripe.subscriptions.create(
							{
								default_payment_method: result.paymentMethod.id,
								customer: id,
								items: [{ price: 'price_1I1ErgL2QqDUeeFI8WjeHVri' }],
							},
							function (err, userSubscription) {
								if (err) {
									return res.status(400).json({ error: err, message: 'Something wrong' });
								}
								console.log(userSubscription);

								Purchasing.findOne({ userId: userCogId })
									.exec()
									.then((result) => {
										if (result) {
											result.planName = 'Intro Plan';
											result.planId = 'price_1I1ErgL2QqDUeeFI8WjeHVri';
											result.planType = 'purchased';
											result.trialStartDate = new Date();
											result.status = 'active';
											result.purchaseDate = new Date();
											result.subscriptionDetails = userSubscription;
											result.customerDetails = customer;

											result
												.save()
												.then(() => {
													console.log('purchase save');
													return res.status(200).json({ message: `Subscribe successfully` });
												})
												.catch((err) => {
													console.log(`last final error ${err}`);
													return res.status(500).json({
														error: err,
													});
												});
										} else {
											const purchse = new Purchasing({
												_id: mongoose.Types.ObjectId(),
												userId: userCogId,
												planName: 'Intro Plan',
												planId: 'price_1I1ErgL2QqDUeeFI8WjeHVri',
												planType: req.body.startTrial ? 'trial' : 'purchased',
												trialStartDate: new Date(),
												status: 'active',
												purchaseDate: new Date(),
												subscriptionDetails: userSubscription,
												customerDetails: customer,
											});
											purchse
												.save()
												.then(() => {
													console.log('purchase save');
													return res.status(200).json({ message: `Subscribe successfully` });
												})
												.catch((err) => {
													console.log(`last final error ${err}`);
													return res.status(500).json({
														error: err,
													});
												});
										}
									})
									.catch((err) => {
										console.log(`last final error ${err}`);
										return res.status(500).json({
											error: err,
										});
									});
							},
						);
					},
				);
			})
			.catch((err) => {
				console.log(`final error ${err}`);
				return res.status(500).json({
					error: err,
				});
			});
	}
};

module.exports.invoices = async (req, res, next) => {
	const userCogId = req.user.payload.email;
	await dbUtils.connect();
	try {
		const invoices = await stripe.invoices.list({
			limit: 10,
		});
		// console.log(invoices.data);
		let userInvoices = invoices.data.filter((d) => d.customer_email === userCogId);
		return res.status(200).json({ userInvoices });
	} catch (err) {
		console.log(`final error ${err}`);
		return res.status(500).json({
			error: err,
		});
	}
};

module.exports.cancel = async (req, res, next) => {
	const userCogId = req.user.payload.email;
	await dbUtils.connect();
	Purchasing.findOne({ userId: userCogId })
		.then(async (result) => {
			console.log(result);
			if (result && result.planType === 'trial') {
				result.status = 'cancel';
				result
					.save()
					.then(() => {
						console.log('purchase cancel');
						console.log(result);
						return res.json({ message: 'Subscription canceled successfully' });
					})
					.catch((err) => {
						console.log(`last final error ${err}`);
						return res.status(500).json({
							error: err,
						});
					});
			} else {
				try {
					const deleted = await stripe.subscriptions.del(result.subscriptionDetails.id);
					console.log(deleted);

					if (deleted) {
						result.status = 'cancel';
						result
							.save()
							.then(() => {
								console.log('purchase cancel');
								return res.json({ message: 'Subscription canceled successfully' });
							})
							.catch((err) => {
								console.log(`last final error ${err}`);
								return res.status(500).json({
									error: err,
								});
							});
					}
				} catch (err) {
					console.log(`final error ${err}`);
					return res.status(500).json({
						error: err,
					});
				}
			}
		})
		.catch((err) => {
			console.log(`final error ${err}`);
			return res.status(500).json({
				error: err,
			});
		});
};

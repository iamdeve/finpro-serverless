const mongoose = require('mongoose');
const Auth = require('../models/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const dbUtils = require('../db/db');
const s3 = new AWS.S3({
	accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
});

module.exports.verifyEmailValidation = [check('code', 'Code field Should not empty').not().isEmpty(), check('email', 'Email field Should not empty').not().isEmpty()];

const saltRounds = 10;

const dotenv = require('dotenv').config();
global.fetch = require('node-fetch');
global.navigator = () => null;
// console.log(process.env);
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = {
	UserPoolId: process.env.pool_id,
	ClientId: process.env.app_client_id,
};
const pool_region = process.env.pool_region;
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

module.exports.signupWithCognito = async (req, res, next) => {
	console.info('signup before db connect');
	await dbUtils.connect();
	console.info('signup after db connect');
	const email = req.body.email;
	const pass = req.body.password;
	// const firstName = req.body.firstName;
	// const lastName = req.body.lastName;

	const attributeList = [];
	attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email }));
	// attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name', Value: firstName }));
	// attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'family_name', Value: lastName }));
	userPool.signUp(email, pass, attributeList, null, async function (err, result) {
		if (err) {
			console.log(err);
			return res.status(500).json({
				error: err,
			});
		}
		var cognitoUser = result.user;
		console.log(cognitoUser.getUsername());

		let user = new Auth({
			_id: mongoose.Types.ObjectId(),
			email: email,
			cogUserId: cognitoUser.getUsername(),
		});

		try {
			await user.save();
			console.log(user);
			res.status(201).json({
				message: 'sign up successful',
				token: cognitoUser,
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({
				error: err.message ? err.message : err,
			});
		}
	});
};

module.exports.loginWithCognito = async (req, res, next) => {
	await dbUtils.connect();
	const email = req.body.email;
	const pass = req.body.password;

	const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
		Username: email,
		Password: pass,
	});
	const userData = {
		Username: email,
		Pool: userPool,
	};
	const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	cognitoUser.authenticateUser(authenticationDetails, {
		onSuccess: function (result) {
			// console.log(result.getIdToken().getJwtToken())
			// const accesstoken = result.getAccessToken().getJwtToken();
			const accesstoken = result.getIdToken().getJwtToken();
			return res.status(201).json({
				token: accesstoken,
			});
		},
		onFailure: function (err) {
			return res.status(500).json({
				message: err,
			});
		},
	});
};

module.exports.verifyEmailAndConfirmUser = async (req, res) => {
	await dbUtils.connect();
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	let code = req.body.code;
	let email = req.body.email;
	var userData = {
		Username: email,
		Pool: userPool,
	};

	var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	cognitoUser.confirmRegistration(code, true, function (err, result) {
		if (err) {
			console.log(err.message || JSON.stringify(err));
			return res.status(500).json({
				message: err.message ? err.message : JSON.stringify(err),
			});
		}
		console.log('call result: ' + result);
		return res.status(200).json({
			message: 'User Registered Successfully',
		});
	});
};

module.exports.signupWithEmail = async (req, res, next) => {
	await dbUtils.connect();
	const email = req.body.email;
	const pass = req.body.password;
	const firstName = req.body.firstName;
	const lastName = req.body.lastName;

	var hashP;
	Auth.findOne({ email: email })
		.exec()
		.then(async (result) => {
			if (result && result.email != '') {
				console.log('already');
				return res.status(500).json({
					message: 'email already registered',
				});
			} else {
				await bcrypt.hash(pass, saltRounds, function (err, hash) {
					if (err) {
						console.log(err);
						return res.status(500).json({
							error: err,
						});
					} else {
						hashP = hash;
						console.log(hashP);
						const auth = new Auth({
							_id: mongoose.Types.ObjectId(),
							email: email,
							password: hashP,
							firstName: firstName,
							lastName: lastName,
						});
						auth.save()
							.then(async (result) => {
								const id = result._id;
								const email = result.email;
								const password = result.password;
								const firstName = result.firstName;
								const lastName = result.lastName;
								const token = await jwt.sign({ id, email, password, firstName, lastName }, process.env.JWT_SESSION_KEY, { expiresIn: '60d' });
								res.status(201).json({
									message: 'sign up successful',
									token: token,
								});
							})
							.catch((err) => {
								console.log(`last final error ${err}`);
								res.status(500).json({
									error: err,
								});
							});
					}
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

module.exports.loginWithEmail = async (req, res, next) => {
	await dbUtils.connect();
	const email = req.body.email;
	const pass = req.body.password;
	console.log(pass);
	Auth.findOne({ email: email })
		.then(async (result) => {
			if (result) {
				console.log(result);
				await bcrypt.compare(pass, result.password, async function (err, newResult) {
					if (err) {
						return res.status(501).json({
							error: err,
						});
					} else {
						const id = result._id;
						const email = result.email;
						const password = result.password;
						const firstName = result.firstName;
						const lastName = result.lastName;

						// console.log(newResult);
						if (newResult) {
							const token = jwt.sign({ id, email, password, firstName, lastName }, process.env.JWT_SESSION_KEY, { expiresIn: '60d' });
							// console.log(role);
							return res.status(201).json({
								token: token,
							});
						} else {
							return res.status(500).json({
								message: 'invalid Password',
							});
						}
					}
				});
			} else {
				return res.status(500).json({
					message: 'invalid email',
				});
			}
		})
		.catch((err) => {
			res.status(502).json({
				error: err,
			});
		});
};

module.exports.userSetting = async (req, res, next) => {
	await dbUtils.connect();
	if (Object.keys(req.body).length === 0) {
		return res.status(400).json({ error: 'Payload must not be empty' });
	}
	const userData = req.body;
	const cogUserId = req.user.payload.email;
	Auth.findOneAndUpdate({ cogUserId: cogUserId }, userData)
		.exec()
		.then(async (result) => {
			res.status(200).json({
				message: 'User updated successfully',
			});
		})
		.catch((err) => {
			res.status(500).json({
				error: err,
			});
			s;
		});
};

module.exports.profilePicture = async (req, res, next) => {
	// await dbUtils.connect();
	let image;
	req.file != null ? (image = req.file.location) : null;
	console.log(req.file);
	const cogUserId = req.user.payload.email;

	const params = {
		Bucket: process.env.MY_AWS_S3_BUCKET,
		Key: `${req.file.originalname}`,
		Body: req.file.buffer,
		// ContentEncoding: 'base64',
		ContentType: req.file.mimetype,
		ACL: 'public-read',
	};
	try {
		let data = await s3.upload(params).promise();
		console.log(`File uploaded successfully at ${data.Location}`);
		Auth.findOne({ cogUserId: cogUserId })
			.exec()
			.then(async (result) => {
				result.profile = data.Location;
				result
					.save()
					.then(() => {
						return res.status(200).json({
							message: 'Profile Changes successfully',
						});
					})
					.catch((err) => {
						return res.status(500).json({
							error: err,
						});
					});
			})
			.catch((err) => {
				return res.status(500).json({
					error: err.message ? err.message : err,
				});
			});
	} catch (error) {
		return res.status(500).json({
			error: error.message ? error.message : error,
		});
	}
};

module.exports.user = async (req, res, next) => {
	await dbUtils.connect();
	const cogUserId = req.user.payload.email;
	Auth.findOne({ cogUserId: cogUserId })
		.then(async (result) => {
			// console.log(result)
			if (result) {
				let data = { ...result.toObject() };
				delete data.cogUserId,
					res.status(200).json({
						user: data,
					});
			} else {
				res.status(500).json({
					error: 'Result in null',
				});
			}
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json({
				error: err,
			});
		});
};

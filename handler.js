const aws = require('aws-sdk');
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const cors = require('cors');

const auth = require('./middleware/auth');
const authController = require('./controllers/auth');
const inputController = require('./controllers/inputs');
const revenueController = require('./controllers/revenue');
const paymentMethod = require('./controllers/payment-method');
const purchasingController = require('./controllers/purchasing');
const stripeSubControler = require('./controllers/stripe-subscription');
const { connectDb } = require('./db/db');
// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const s3 = new aws.S3();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// const storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		cb(null, './profiles/');
// 	},
// 	filename: function (req, file, cb) {
// 		// cb(null, new Date().toISOString()+file.originalname)
// 		cb(null, new mongoose.Types.ObjectId() + '-' + file.originalname);
// 	},
// });
// const fileFilter = (req, file, cb) => {
// 	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
// 		console.log('if');
// 		cb(null, true);
// 	} else {
// 		console.log('else');
// 		cb(null, false);
// 	}
// };

// const upload = multer({
// 	storage: storage,
// 	limits: {
// 		fileSize: 1024 * 1024 * 5,
// 	},
// 	fileFilter: fileFilter,
// });

// const upload = multer({
// 	storage: multerS3({
// 		s3: s3,
// 		bucket: 'finpro-test-bucker',
// 		acl: 'public-read',
// 		contentType: function (req, file, cb) {
// 			cb(null, file.mimetype);
// 		},
// 		metadata: function (req, file, cb) {
// 			cb(null, { fieldName: file.fieldname });
// 		},
// 		key: function (req, file, cb) {
// 			console.log(file);
// 			var fname = file.fieldname + '-' + Date.now() + path.extname(file.originalname);

// 			cb(null, fname);
// 		},
// 	}),
// });

// support parsing of application/json type post data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/user', auth.Validate, authController.user);
app.post('/signup', authController.signupWithCognito);
app.post('/verify', authController.verifyEmailValidation, authController.verifyEmailAndConfirmUser);
app.post('/login', authController.loginWithCognito);
app.patch('/setting', auth.Validate, authController.userSetting);
app.post('/profile', [auth.Validate, upload.single('image')], authController.profilePicture);

app.get('/userInputs', auth.Validate, inputController.userInputs);
app.post('/addInputs', [auth.Validate, inputController.addInputValidation], inputController.addInputs);
app.post('/deleteInputs', [auth.Validate, inputController.deleteInputValidation], inputController.deleteInputs);
app.put('/updateInputs', [auth.Validate, inputController.updateInputValidation], inputController.updateInputs);
app.post('/addInputExpense', [auth.Validate, inputController.addExpenseValidation], inputController.addExpense);
app.post('/deleteInputExpense', [auth.Validate, inputController.deleteExpenseValidation], inputController.deleteExpense);
app.put('/updateInputExpense', [auth.Validate, inputController.updateExpenseValidation], inputController.updateExpense);

app.get('/userRevenue', auth.Validate, revenueController.userRevenu);
app.post('/addRevenue', [auth.Validate, revenueController.revenueInputValidator], revenueController.revenueInput);
app.post('/deleteRevenue', [auth.Validate, revenueController.deleteRevenueInputValidation], revenueController.deleteRevenueInput);
app.put('/updateRevenue', [auth.Validate, revenueController.updateRevenueInputValidation], revenueController.updateRevenue);

app.post('/addExpense', [auth.Validate, revenueController.addExpenseValidation], revenueController.addExpense);
app.post('/deleteExpense', [auth.Validate, revenueController.deleteExpenseValidation], revenueController.deleteExpense);
app.put('/updateExpense', [auth.Validate, revenueController.updateExpenseValidation], revenueController.updateExpense);

app.post('/addStartingCapital', [auth.Validate, revenueController.addStartingCapitalValidation], revenueController.addStartingCapital);
app.post('/deleteStartingCapital', [auth.Validate, revenueController.deleteStartingCapitalValidation], revenueController.deleteStartingCapital);
app.put('/updateStartingCapital', [auth.Validate, revenueController.updateStartCapitalValidation], revenueController.updateStartingCapital);

app.get('/userPayment', auth.Validate, paymentMethod.userPayment);
app.post('/add', [auth.Validate, paymentMethod.addValidation], paymentMethod.addMethod);
app.delete('/delete/:id', auth.Validate, paymentMethod.delete);
app.put('/update/:id', auth.Validate, paymentMethod.update);
app.put('/status/:id', auth.Validate, paymentMethod.status);
app.put('/type/:id', auth.Validate, paymentMethod.type);

app.get('/userPurchasing', auth.Validate, purchasingController.userPurchasing);
app.post('/addPurchasing', [auth.Validate, purchasingController.addPurchasingValidation], purchasingController.addPurchasing);

app.post('/subscription', auth.Validate, stripeSubControler.subscription);
app.post('/cancel', auth.Validate, stripeSubControler.cancel);
app.get('/invoices', auth.Validate, stripeSubControler.invoices);

const serverlessHandler = serverless(app, {
	binary: ['image/png', 'image/jpeg', 'image/jpg'],
});
const handler = async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	return await serverlessHandler(event, context);
};

module.exports = {
	user: handler,
	inputs: handler,
	revenue: handler,
	payment: handler,
	purchasing: handler,
	subscription: handler,
	app,
};

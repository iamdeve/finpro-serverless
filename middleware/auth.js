const jwt = require('jsonwebtoken');
const request = require('request');
const jwkToPem = require('jwk-to-pem');

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization;
		const decodedToken = jwt.verify(token, process.env.JWT_SESSION_KEY);
		if (decodedToken) {
			console.log('approved');
			next();
		} else {
			res.status(401).json({
				error: 'Auhorization error! please send a valid token via authorization header!',
			});
		}
	} catch {
		res.status(401).json({
			error: 'Auhorization error! please send a valid token via authorization header!',
		});
	}
};

module.exports.Validate = function (req, res, next) {
	var token = req.headers['authorization'];
	let url = `https://cognito
	idp.${process.env.pool_region}.amazonaws.com/${process.env.pool_id}/.well-known/jwks.json`;
	console.log(url);

	request(
		{
			url: `https://cognito-idp.${process.env.pool_region}.amazonaws.com/${process.env.pool_id}/.well-known/jwks.json`,
			json: true,
		},
		function (error, response, body) {
			if (!error && response.statusCode === 200) {
				pems = {};
				var keys = body['keys'];
				for (var i = 0; i < keys.length; i++) {
					var key_id = keys[i].kid;
					var modulus = keys[i].n;
					var exponent = keys[i].e;
					var key_type = keys[i].kty;
					var jwk = { kty: key_type, n: modulus, e: exponent };
					var pem = jwkToPem(jwk);
					pems[key_id] = pem;
				}
				var decodedJwt = jwt.decode(token, { complete: true });
				if (!decodedJwt) {
					console.log('Not a valid JWT token');
					return res.status(401).json({
						error:{message: 'Invalid token',}
					});
				}
				var kid = decodedJwt.header.kid;
				var pem = pems[kid];
				if (!pem) {
					console.log('Invalid token');
					return res.status(401).json({
						error:{message: 'Invalid token',}
					});
				}
				jwt.verify(token, pem, function (err, payload) {
					if (err) {
						console.log('Invalid Token.');
						res.status(401);
						return res.status(401).json({
							error:{message: 'Invalid token',}
						});
					} else {
						console.log('Valid Token.');
						req.user = decodedJwt;
						return next();
					}
				});
			} else {
				console.log('Error! Unable to download JWKs');
				res.status(500);
				return res.send('Error! Unable to download JWKs');
			}
		},
	);
};

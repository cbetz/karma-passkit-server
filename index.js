const express = require('express')
const request = require('request')
const { Pass } = require('passkit-generator')
const app = express()
const port = 3000
const secrets = require('./secrets.json')

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/user/:id', (req, res) => {

	request('https://hacker-news.firebaseio.com/v0/user/' + req.params.id + '.json', { json: true }, (err, response, body) => {

		if (err) {
			res.set({
				"Content-type": "text/html"
			});
	
			res.send(err.message);
		} 

		console.log(body);

		let passName = "karma" + "_" + (new Date()).toISOString().split('T')[0].replace(/-/ig, "");

		let pass = new Pass({
			model: `./models/karma`,
			certificates: {
				wwdr: "./certs/WWDR.pem",
				signerCert: "./certs/signerCert.pem",
				signerKey: {
					keyFile: "./certs/signerKey.pem",
					passphrase: secrets.passphrase
				}
			},
			overrides: req.body || req.params || req.query,
		});
		
		pass.primaryFields.push({
			key: "karma",
			value: body.karma,
			label: "Karma",
			textAlignment: "PKTextAlignmentLeft"
		}, {
			key: "submitted",
			value: body.submitted.length,
			label: "Submitted",
			textAlignment: "PKTextAlignmentRight"
		});
		
		pass.generate().then(function (stream) {
			res.set({
				"Content-type": "application/vnd.apple.pkpass",
				"Content-disposition": `attachment; filename=${passName}.pkpass`
			});

			stream.pipe(res);
		}).catch(err => {
			console.log(err);

			res.set({
				"Content-type": "text/html"
			});

			res.send(err.message);
		});


	});
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
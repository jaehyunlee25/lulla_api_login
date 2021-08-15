import CryptoJS from 'crypto-js';
import axios from 'axios';
export default function SMS(param){
	var method="POST",
		naverAddress=process.env.naverAddress,
		naverUri=process.env.naverUri,
		naverAccessKey=process.env.naverAccessKey,
		naverScreteKey=process.env.naverScreteKey,
		uri="/sms/v2/services/"+naverUri+"/messages",
		timestamp=Date.now().toString(),
		hmac=CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256,naverScreteKey);
	
	hmac.update(method);
	hmac.update(" ");
	hmac.update(uri);
	hmac.update("\n");
	hmac.update(timestamp);
	hmac.update("\n");
	hmac.update(naverAccessKey);

	var hash=hmac.finalize();
	axios({
		method:method,
		url:naverAddress+uri,
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
			'x-ncp-apigw-timestamp':timestamp,
			'x-ncp-iam-access-key': naverAccessKey,
			'x-ncp-apigw-signature-v2': hash.toString(CryptoJS.enc.Base64),
		},
		data: {
			type: 'SMS',
			contentType: 'COMM',
			from: process.env.naverSenderPhone,
			content: param.vc,
			messages: [{ to: param.phone }],
		},
	})
	.then((res) => {
		console.log(res);
	})
	.catch((err) => {
		console.log(err);
	});
};
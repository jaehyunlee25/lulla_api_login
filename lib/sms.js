/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import CryptoJS from "crypto-js";
import axios from "axios";

export default function SMS(param) {
  const method = "POST";
  const { naverAddress, naverUri, naverAccessKey, naverScreteKey } =
    process.env;
  const uri = ["/sms/v2/services/", naverUri, "/messages"].join("");
  const timestamp = Date.now().toString();
  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, naverScreteKey);

  hmac.update(method);
  hmac.update(" ");
  hmac.update(uri);
  hmac.update("\n");
  hmac.update(timestamp);
  hmac.update("\n");
  hmac.update(naverAccessKey);

  const hash = hmac.finalize();
  console.dir({
    method: method,
    url: [naverAddress, uri].join(""),
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json; charset = UTF-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": naverAccessKey,
      "x-ncp-apigw-signature-v2": hash.toString(CryptoJS.enc.Base64),
    },
    data: {
      type: "SMS",
      contentType: "COMM",
      from: process.env.naverSenderPhone,
      content: param.vc,
      messages: [{ to: param.phone }],
    },
  });

  axios({
    method: method,
    url: [naverAddress, uri].join(""),
    headers: {
      "Content-Type": "application/json; charset = UTF-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": naverAccessKey,
      "x-ncp-apigw-signature-v2": hash.toString(CryptoJS.enc.Base64),
    },
    data: {
      type: "SMS",
      contentType: "COMM",
      from: process.env.naverSenderPhone,
      content: ["lulla [",param.vc,"]"].join(""),
      messages: [{ to: param.phone }],
    },
  })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
}

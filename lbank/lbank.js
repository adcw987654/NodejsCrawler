import setting from "./lbanksetting.js";
import fetch, { Headers } from "node-fetch";
import CryptoJS from "crypto-js";
const baseUrl = "https://www.lbkex.net";
let isStartSelling = false;
let buyInterval;

const getOrderHeader = (body) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");
  headers.append("timestamp", body.timestamp);
  headers.append("signature_method", "HmacSHA256");
  headers.append("echostr", body.echostr);
  return headers;
};

const placeOrder = async (cur, side, amount) => {
  const apiUrl = "/v2/supplement/create_order.do";
  const timestamp = Number(new Date());
  const echostr = "P3LHfw6tUIYWc8R2VQNy0ilKmdg5pjhbxC7";
  const body = {
    symbol: cur + "_usdt",
    type: side + "_market",
    amount: amount,
    timestamp: timestamp,
    echostr: echostr,
  };
  let parameters;
  if (side == "buy")
    parameters =
      "api_key=" +
      setting.k +
      "&echostr=" +
      echostr +
      "&price=" +
      amount +
      "&signature_method=HmacSHA256" +
      "&symbol=" +
      body.symbol +
      "&timestamp=" +
      timestamp +
      "&type=" +
      body.type;
  if (side == "sell")
    parameters =
      "amount=" +
      amount +
      "&api_key=" +
      setting.k +
      "&echostr=" +
      echostr +
      "&signature_method=HmacSHA256" +
      "&symbol=" +
      body.symbol +
      "&timestamp=" +
      timestamp +
      "&type=" +
      body.type;
  const cryptoStr = CryptoJS.MD5(parameters);
  const sign = CryptoJS.enc.Hex.stringify(
    CryptoJS.HmacSHA256(cryptoStr.toString().toUpperCase(), setting.sk)
  );
  parameters += "&sign=" + sign;

  const header = getOrderHeader(body);
  console.log(parameters);
  fetch(baseUrl + apiUrl + "?" + parameters, {
    method: "POST",
    headers: header,
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};
const getAccountBalance = async (cur) => {
  const apiUrl = "/v2/user_info.do";
  const timestamp = Number(new Date());
  const echostr = "P3LHfw6tUIYWc8R2VQNy0ilKmdg5pjhbxC7";
  const body = { timestamp: timestamp, echostr: echostr };
  let result;
  let parameters =
    "api_key=" +
    setting.k +
    "&echostr=" +
    echostr +
    "&signature_method=HmacSHA256" +
    "&timestamp=" +
    timestamp;
  const cryptoStr = CryptoJS.MD5(parameters);
  const sign = CryptoJS.enc.Hex.stringify(
    CryptoJS.HmacSHA256(cryptoStr.toString().toUpperCase(), setting.sk)
  );
  parameters += "&sign=" + sign;

  const header = getOrderHeader(body);
  fetch(baseUrl + apiUrl + "?" + parameters, {
    method: "POST",
    headers: header,
  })
    .then((res) => {
      return res.json();
    })
    .then((resu) => {
      const curBal = eval("resu.data.free." + cur);
      console.log(curBal);
    })
    .catch((err) => {
      console.log(err);
    });
};

//取得指定幣別最小交易數量
const getMinTranQua = async (cur) => {
  await fetch(baseUrl + "/v2/accuracy.do", { method: "GET" })
    .then((res) => {
      return res.json();
    })
    .then((result) => {
      const minTranQua = result.data.filter((val) => {
        return val.symbol == cur + "_usdt";
      })[0].minTranQua;
      console.log(minTranQua);
    });
};
buyInterval = setInterval(() => {
  placeOrder("buc", "buy", 1);
  getAccountBalance("buc");
  // placeOrder("buc", "sell", 19);
}, 70);

// getMinTranQua("tnt");

// getAccountBalance("buc");

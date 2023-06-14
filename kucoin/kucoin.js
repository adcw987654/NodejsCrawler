import setting from "./kscoinSetting.js";
import CryptoJS from "crypto-js";
import fetch, { Headers } from "node-fetch";

const baseURL = "https://api.kucoin.com";
const getHeader = (body, method, apiUrl, setk, setks, setp) => {
  const timestamp = Number(new Date());
  const sign = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(
      timestamp + method + apiUrl + JSON.stringify(body),
      setks
    )
  );
  const headers = new Headers();
  const apikey = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(setk, setks)
  );
  const apip = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(setp, setks));
  headers.append("KC-API-SIGN", sign);
  headers.append("KC-API-TIMESTAMP", timestamp);
  headers.append("KC-API-KEY", setk);
  headers.append("KC-API-PASSPHRASE", apip);
  headers.append("KC-API-KEY-VERSION", "2");
  return headers;
};
/**
 * 市價單下單
 * @param {*} cur 幣種
 * @param {*} bal 數量
 * @param {*} user 使用者 A,E
 */
const orderMarket = async (cur, bal, user) => {
  const apiUrl = "/api/v1/orders";
  const body = {
    clientOid: Math.random() * 50000,
    side: "buy",
    symbol: cur + "-USDT",
    type: "market",
    tradeType: "TRADE",
    funds: bal,
  };
  let header;
  if (user == "A")
    header = getHeader(
      body,
      "POST",
      apiUrl,
      setting.A.k,
      setting.A.ks,
      setting.A.p
    );
  else if (user == "E")
    header = getHeader(
      body,
      "POST",
      apiUrl,
      setting.E.k,
      setting.E.ks,
      setting.E.p
    );
  header.append("Content-Type", "application/json");
  await fetch(baseURL + apiUrl, {
    method: "POST",
    headers: header,
    body: JSON.stringify(body),
  }).then((res) => {
    res.json().then((r) => {
      if (r.orderId) {
        console.log(user + "買到" + cur + ",數量:" + count);
      } else {
        console.log(r);
      }
    });
  });
};

const orderLimit = async (cur, bal, user, price) => {
  const apiUrl = "/api/v1/orders";
  const body = {
    clientOid: Math.random() * 50000,
    side: "sell",
    symbol: cur + "-USDT",
    type: "limit",
    tradeType: "TRADE",
    price: price,
    size: Math.round(bal / price) - 1,
  };
  let header;
  if (user == "A")
    header = getHeader(
      body,
      "POST",
      apiUrl,
      setting.A.k,
      setting.A.ks,
      setting.A.p
    );
  else if (user == "E")
    header = getHeader(
      body,
      "POST",
      apiUrl,
      setting.E.k,
      setting.E.ks,
      setting.E.p
    );
  header.append("Content-Type", "application/json");
  await fetch(baseURL + apiUrl, {
    method: "POST",
    headers: header,
    body: JSON.stringify(body),
  })
    .then((res) => {
      res.json().then((r) => {
        if (r.orderId) {
          console.log(
            user + "買到" + cur + ",數量:" + count + ",金額:" + price
          );
        } else {
          console.log(user + ":" + JSON.stringify(r));
        }
      });
    })
    .catch((err) => console.log(err));
};

/**
 * 取得當前市價，並且下限價單
 * @param {*} cur 幣種
 */
const getMarketPrice = async (cur) => {
  await fetch(
    baseURL + "/api/v1/market/orderbook/level1?symbol=" + cur + "-USDT",
    {
      method: "GET",
    }
  )
    .then((res) => {
      res.json().then((r) => {
        console.log(r);
        if (r.data.price != 0) {
          const interval = setInterval(() => {
            orderLimit(cur, 600, "E", r.data.price);
          }, 140);
        } else {
          getMarketPrice();
        }
      });
    })
    .catch((e) => {
      getMarketPrice();
    });
};
const main = async () => {
  try {
    // await getMarketPrice("FIN");
    const interval = setInterval(() => {
      orderLimit("SIN", 10, "E", 0.06);
      // orderLimit("FITFI", 50, "A", 0.44);
    }, 67);
    // const interval = setInterval(() => {
    // orderMarket("PLD", 300, "E");
    // orderMarket("PLD", 33, "A");
    // }, 140);
  } catch (e) {
    main();
  }
};
main();

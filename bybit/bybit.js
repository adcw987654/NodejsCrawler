import setting from "./bybit-setting.js";
import CryptoJS from "crypto-js";
import log from "../logger.js";
import fetch, { Headers } from "node-fetch";

const baseUrl = "https://api.bybit.com";
let isStartSelling = false;
let buyInterval;
const getHeader = () => {
  const headers = new Headers();
  headers.append("Content-Type", "x-www-form-urlencoded");
  return headers;
};
const getOrderBody = (body) => {
  const queryStr =
    "api_key=" +
    body.api_key +
    "&qty=" +
    body.qty +
    "&side=" +
    body.side +
    "&symbol=" +
    body.symbol +
    "&timestamp=" +
    body.timestamp +
    "&type=" +
    body.type;
  return getBodyWithSignature(queryStr);
};
const getBodyWithSignature = (queryStr) => {
  return (
    queryStr +
    "&sign=" +
    CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(queryStr, setting.kp))
  );
};
const getBalance = async (cur) => {
  const timeStamp = Number(new Date()) + 1000;
  const queryStr = "api_key=" + setting.k + "&timestamp=" + timeStamp;
  const header = getHeader();
  const sign = CryptoJS.enc.Hex.stringify(
    CryptoJS.HmacSHA256(queryStr, setting.kp)
  );
  let result;
  const response = await fetch(
    baseUrl + "/spot/v1/account?" + queryStr + "&sign=" + sign,
    {
      method: "GET",
      headers: header,
    }
  );
  const res = await response.json();

  const filterResult = res.result.balances.filter((balanceObj) => {
    return balanceObj.coin == cur;
  });
  result = filterResult[0] ? filterResult[0].total : 0;
  usdtNum = result;
  return result;
};
const placeOrder = async (cur, money, orderSide, autoSellingMode, sec) => {
  const apiUrl = "/spot/v1/order";
  const header = getHeader();
  const param = {
    api_key: setting.k,
    qty: money,
    side: orderSide,
    symbol: cur + "USDT",
    timestamp: Number(new Date()) + 1000,
    type: "MARKET",
  };
  const body = getOrderBody(param);
  console.log(body);
  await fetch(baseUrl + apiUrl + "?" + body, {
    method: "POST",
    headers: header,
  })
    .then((res) => {
      return res.json();
    })
    .then((result) => {
      console.log(result);
      if (result.ret_code == 0 && result.result.side == "BUY") {
        console.log("購買成功");
        //購買完成後取得餘額，並觸發販賣機置
        //確保販售時只會有一個線程
        if (!isStartSelling && autoSellingMode) {
          getMaxTradeAmount(cur).then((maxTradeAmount) => {
            getBalance(cur).then((balance) => {
              let sellAmount;
              if (maxTradeAmount >= balance) {
                sellAmount = balance;
                console.log(balance);
                console.log(maxTradeAmount);
              } else {
                sellAmount = balance / 2;
              }
              autoSelling(cur, Math.trunc(sellAmount), sec);
            });
          });
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
const autoSelling = async (cur, sellAmount, sec) => {
  await setTimeout(() => {
    clearInterval(buyInterval);
    setInterval(() => {
      placeOrder(cur, sellAmount, "SELL"); //BUY-SELL
    }, 60);
  }, sec);
};
const doit = async (cur, money, autoSellingMode, sec) => {
  buyInterval = setInterval(() => {
    placeOrder(cur, money, "BUY", autoSellingMode, sec); //BUY-SELL
  }, 60);
};

// 市價購買
// doit("STRM", 500, true, 30000);

// getBalance("USDT").then((balance) => {
//   if (balance && balance[0].total) {
//     console.log(Math.trunc(balance[0].total));
//   }
// });

/**
 *  取得該交易對的最大購買量
 * @param {String} cur 幣種
 * @returns
 */
const getMaxTradeAmount = async (cur) => {
  let result;
  const res = await fetch(baseUrl + "/spot/v1/symbols");
  const json = await res.json();
  const curUSDT = json.result.filter((val) => {
    return val.name == cur + "USDT";
  });
  console.log(curUSDT);
  result = curUSDT[0] ? curUSDT[0].maxTradeAmount : 0;
  return result;
};

let tmpJson;

/**
 *  取得該交易對最佳買賣價
 * @param {String} cur 幣種
 * @returns
 */
const getBestPrice = async (cur, sec, callback) => {
  try {
    let result;
    const res = await fetch(
      baseUrl + "/spot/quote/v1/ticker/book_ticker?symbol=" + cur + "USDT"
    );
    const json = await res.json();
    console.log(json);
    if (json.ret_code == 0) {
      if (!tmpJson || JSON.stringify(tmpJson) != JSON.stringify(json)) {
        tmpJson = json;
        log(
          "./bybit_" + cur + "USDT_BestPrice.log",
          new Date().toJSON() + JSON.stringify(json.result) + "\r\n"
        );
      }
      if (callback && json.result.bidPrice > 0) {
        let bidQty = usdtNum / (json.result.bidPrice * 1.1);
        const bestPrice = json.result.bidPrice;
        const priceFixed = bestPrice.length - (bestPrice.indexOf(".") + 1);
        console.log(json.result.bidPrice);
        console.log(usdtNum);
        callback(
          Math.floor(
            Number(Number(json.result.bidPrice) * 1.099) * 10 ** priceFixed
          ) /
            10 ** priceFixed,
          Math.floor(bidQty * 100) / 100,
          cur,
          sec
        );
        // result = curUSDT[0] ? curUSDT[0].maxTradeAmount : 0;
      }
    } else if (json) {
      console.log(json.ret_msg);
    }
    return result;
  } catch (e) {
    log("./bybit_" + cur + "USDT_ERROR.log", new Date().toJSON() + e + "\r\n");
  }
};

const getBuyLimitIOCBody = (body) => {
  const queryStr =
    "api_key=" +
    body.api_key +
    "&price=" +
    body.price +
    "&qty=" +
    body.qty +
    "&side=" +
    body.side +
    "&symbol=" +
    body.symbol +
    "&timeInForce=" +
    body.timeInForce +
    "&timestamp=" +
    body.timestamp +
    "&type=" +
    body.type;
  return getBodyWithSignature(queryStr);
};
const orderBuyLimitIOC = async (price, qty, cur, sec) => {
  const apiUrl = "/spot/v1/order";
  const header = getHeader();
  const param = {
    api_key: setting.k,
    qty: qty,
    price: price,
    side: "BUY",
    symbol: cur + "USDT",
    timestamp: Number(new Date()),
    type: "LIMIT",
    timeInForce: "IOC",
  };
  const body = getBuyLimitIOCBody(param);
  console.log(body);
  fetch(baseUrl + apiUrl + "?" + body, {
    method: "POST",
    headers: header,
  })
    .then((res) => {
      return res.json();
    })
    .then((result) => {
      console.log(result);
      if (result.ret_code == 0 && result.result.side == "BUY") {
        console.log("購買成功");
        log(
          "./bybit_" + cur + "USDT_BUY.log",
          new Date().toJSON() + JSON.stringify(result) + "\r\n"
        );
        clearOrderInterval(sec, cur);
      } else if (result.ret_code == -1131) {
        //餘額不足的話call api 取得目前USDT餘額
        getBalance("USDT");
      }
    })
    .catch((e) => {
      log(
        "./bybit_" + cur + "USDT_ERROR.log",
        new Date().toJSON() + e + "\r\n"
      );
    });
};
let orderInterval;
//前30秒依照最佳購買價購買，若錯誤信息顯示餘額不足則註銷interval
const orderLimitOnBestPrice = async (sec, cur) => {
  orderInterval = setInterval(() => {
    try {
      const bestPriceObj = getBestPrice(cur, sec, orderBuyLimitIOC);
    } catch (e) {
      log(
        "./bybit_" + cur + "USDT_ERROR.log",
        new Date().toJSON() + e + "\r\n"
      );
    }
  }, 150);
};
const clearOrderInterval = (sec, cur) => {
  //指定秒數後註銷購買訂單，並持續紀錄後續價格
  setTimeout(() => {
    clearInterval(orderInterval);
    setInterval(() => {
      getBestPrice(cur);
    }, 100);
  }, sec * 1000);
};
let usdtNum = 185;

orderLimitOnBestPrice(10, "OBX");

setInterval(() => {
  getBestPrice("OBX");
}, 100);

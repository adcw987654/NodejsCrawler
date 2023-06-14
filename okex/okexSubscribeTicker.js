import WebSocket from "ws";
import log from "./logger.js";
export const priceObj = {
  askPx: "", //賣一價
  askSz: "", //賣一價對應的量
  bidPx: "", //買一價
  bidSz: "", //買一價對應的量
  lastPx: "", //最新成交價
  lastSz: "", //最新成交量
};
//依照最便宜賣價-1%販售(前提是前10秒賣價為5倍以上)
//訂閱幣種、並在幣種更新賣價之後執行callBack
let publicWs;
let init = false;
const subscribeCurAndUpdateAskPxAskSz = (cur, timeToStop, callback) => {
  const logFileName = "./" + cur + ".log";
  publicWs = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");
  publicWs.on("open", function open() {
    console.log("public opened!");
    subscribeTickers(cur);
  });
  publicWs.on("message", function message(data) {
    let jsonObj = JSON.parse(data);
    //訂閱幣價行情
    if (
      jsonObj &&
      jsonObj.event == "error" &&
      jsonObj.msg.indexOf(cur + "-USDT") >= 0
    ) {
      console.log("ERROR EVENT:" + jsonObj.msg);
      setTimeout(() => {
        subscribeTickers(cur);
      }, 500);
    } else if (
      jsonObj &&
      jsonObj.arg &&
      jsonObj.arg.channel == "tickers" &&
      jsonObj.data
    ) {
      console.log(jsonObj.data.length);
      log(logFileName, new Date(Number(jsonObj.data[0].ts)) + "\r\n");
      if (
        priceObj.askPx != jsonObj.data[0].askPx ||
        priceObj.askSz != jsonObj.data[0].askSz
      ) {
        priceObj.askPx = jsonObj.data[0].askPx;
        priceObj.askSz = jsonObj.data[0].askSz;
        log(logFileName, "最優賣價:" + jsonObj.data[0].askPx + "\r\n");
        log(logFileName, "最優賣量:" + jsonObj.data[0].askSz + "\r\n");
      }
      if (
        priceObj.bidPx != jsonObj.data[0].bidPx ||
        priceObj.bidSz != jsonObj.data[0].bidSz
      ) {
        priceObj.bidPx = jsonObj.data[0].bidPx;
        priceObj.bidSz = jsonObj.data[0].bidSz;
        log(logFileName, "最優買價:" + jsonObj.data[0].bidPx + "\r\n");
        log(logFileName, "最優買量:" + jsonObj.data[0].bidSz + "\r\n");
      }
      if (
        priceObj.lastPx != jsonObj.data[0].last ||
        priceObj.lastSz != jsonObj.data[0].lastSz
      ) {
        priceObj.lastPx = jsonObj.data[0].last;
        priceObj.lastSz = jsonObj.data[0].lastSz;
        log(logFileName, "最近成交價:" + jsonObj.data[0].last + "\r\n");
        log(logFileName, "最近成交量:" + jsonObj.data[0].lastSz + "\r\n");
      }
      callback(priceObj);
      if (!init && timeToStop) {
        init = true;
        setTimeout(() => {
          publicWs.close();
        }, timeToStop);
      }
    } else {
      console.log("public received: %s", data);
    }
  });
  publicWs.on("error", (error) => {
    console.log("錯誤:" + error);
    publicWs.close();
  });

  /**
   * 訂閱幣價行情
   * @param 幣種 cur
   */
  const subscribeTickers = (cur) => {
    publicWs.send(
      JSON.stringify({
        op: "subscribe",
        args: [
          {
            channel: "tickers",
            instId: cur + "-USDT",
          },
        ],
      })
    );
  };
};
const gogoBaby = (cur, timeToStop, callback) => {
  subscribeCurAndUpdateAskPxAskSz(cur, timeToStop, callback);
};
export default gogoBaby;

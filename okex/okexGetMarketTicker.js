import fetch from "node-fetch";

const baseUrl = "https://www.okx.com";
export const priceObj = {
  askPx: "", //賣一價
  askSz: "", //賣一價對應的量
  bidPx: "", //買一價
  bidSz: "", //買一價對應的量
  lastPx: "", //最新成交價
  lastSz: "", //最新成交量
};
let init = false;
let interval;
const fetchMarketTicker = (cur) => {
  const logFileName = "./" + cur + "-fetch.log";
  fetch(baseUrl + "/api/v5/market/ticker?instId=" + cur + "-USDT").then(
    (res) => {
      res.json().then((data) => {
        console.log(data);
        if (data.data && data.data[0]) {
          const resData = data.data[0];
          priceObj.askPx = resData.askPx;
          priceObj.askSz = resData.askSz;
          priceObj.bidPx = resData.bidPx;
          priceObj.bidSz = resData.bidSz;
          priceObj.lastPx = resData.last;
          priceObj.lastSz = resData.lastSz;
          if (!init) {
            init = true;
            setTimeout(() => {
              clearInterval();
            }, timeToStop);
          }
        }
        console.log(priceObj);
      });
    }
  );
};
const gogoBaby = () => {
  interval = setInterval(() => {}, 110);
};
fetchMarketTicker("MOVEZZZ");

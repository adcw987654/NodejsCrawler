import fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as nodemailer from "nodemailer";

const map = new Map();
let index = 0;
const handleBody = (body) => {
  const $ = cheerio.load(body);
  const elements = $("#__APP_DATA");
  const catalogs = JSON.parse(elements[0].children[0].data).routeProps.ce50
    .catalogs;
  const newList = catalogs.filter((val) => {
    return val.catalogId == 48;
  });
  newList[0].articles.forEach((element) => {
    if (!map.get(element.id)) {
      map.set(element.id, element);
      if (index != 0) {
        sendEmail(element.title, element.code);
        sendLineMsg(title, code);
      }
    }
  });
  console.log(newList[0]);
  index++;
};
const sendLineMsg = async (title, code) => {
  await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + setting.lineAuthorization,
    },
    body: JSON.stringify({
      messages: [
        {
          type: "text",
          text:
            "幣安訊息: " +
            title +
            "\r\n" +
            "https://www.binance.com/en/support/announcement/" +
            code,
        },
      ],
    }),
  });
};
const sendEmail = (title, code) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: setting.smtpUser,
      pass: setting.smtpPass,
    },
  });
  transporter
    .sendMail({
      from: setting.smtpSender,
      to: setting.smtpReceiver,
      subject: title,
      html:
        title + "<p>https://www.binance.com/en/support/announcement/" + code,
    })
    .then((info) => {
      console.log({ info });
    })
    .catch(console.error);
};
setInterval(() => {
  fetch("https://www.binance.com/en/support/announcement/c-48?navId=48", {})
    .then((res) => {
      return res.text();
    })
    .then(handleBody)
    .catch(console.log);
}, 10000);

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as nodemailer from "nodemailer";
import setting from "./notice-setting.js";
const map = new Map();
let index = 0;
const doit = () => {
  fetch(
    "https://www.okx.com/support/hc/en-us/sections/360000030652-Latest-Announcements"
  )
    .then((res) => {
      res.text().then((b) => {
        callback(b);
      });
    })
    .catch(console.log);
  const callback = (body) => {
    const $ = cheerio.load(body);
    const elements = $("body > main > div > div > section > ul > li > a");
    for (let i = 0; i < elements.length; i++) {
      let href = elements[i].attribs.href;
      let subj = elements[i].children[0].data;
      console.log(subj);
      if (!map.get(href)) {
        map.set(href, subj);
        if (index != 0) {
          sendLineMsg(subj, "https://www.okx.com/support" + href);
          fetch("https://www.okx.com/support" + href)
            .then((res) => {
              res.text().then((resText) => {
                getArticleHTML(resText, subj);
              });
            })
            .catch(console.log);
        }
      }
    }
    console.log("第" + index + "次");
    index++;
  };
};
const getArticleHTML = (body, subj) => {
  const $ = cheerio.load(body);
  const articleEl = $(".article");
  sendNotifyEmail(subj, $.html(articleEl));
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
          text: "OKEX訊息: " + title + "\r\n" + code,
        },
      ],
    }),
  });
};
const sendNotifyEmail = (subj, html) => {
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
      subject: subj,
      html: html,
    })
    .then((info) => {
      console.log({ info });
    })
    .catch(console.error);
};
const goodgoodEat = setInterval(() => {
  doit();
}, 5000);

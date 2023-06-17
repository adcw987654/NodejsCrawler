import fetch from "node-fetch";

const threadNum = 1500;
let count = 0;
const totalTicket = 100;
const startTime = Number(new Date());
for (let i = 0; i < threadNum; i++) {
  fetch("http://localhost:808" + ((i % 2) + 1) + "/product/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: 1,
      amount: 1,
      userId: Math.random() * 10,
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.isSuccess) {
        count++;
        console.log("已買到票數:", count, json.msg);
        if (count == totalTicket) {
          console.log("total spent time :" + (Number(new Date()) - startTime));
        }
      }
    });
}

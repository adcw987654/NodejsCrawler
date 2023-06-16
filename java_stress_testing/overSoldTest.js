import fetch from "node-fetch";

//5000個線程
let count = 0;
for (let i = 0; i < 5000; i++) {
  fetch("http://localhost:8080/product/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: 2,
      amount: 1,
      userId: Math.random() * 10,
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.isSuccess) {
        count++;
        console.log("已買到票數:", count, json.msg);
      }
    });
}

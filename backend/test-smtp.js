// test-smtp.js
// import nodemailer from "nodemailer";

// test-smtp.js
// import dotenv from "dotenv";
// dotenv.config();

// const fields = {
//   SMTP_USER: process.env.SMTP_USER,
//   SMTP_HOST: process.env.SMTP_HOST,
//   SMTP_PORT: process.env.SMTP_PORT,
// };

// for (const [key, val] of Object.entries(fields)) {
//   console.log(`${key}:`, JSON.stringify(val), "| length:", val.length, "| codes:", [...val].map(c => c.charCodeAt(0)));
// }

// const transporter = nodemailer.createTransport({
//   host: "ms.triasmitra.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: "notifikasi.uar@ms.triasmitra.com",
//     // pass: "Triasmitra@2026!_n0tifik4s1!", // ganti manual, jangan dari .env, buat mastiin bukan masalah env loading
//     pass: process.env.SMTP_PASS, // ganti manual, jangan dari .env, buat mastiin bukan masalah env loading
//   },
// });

// transporter.verify((err, success) => {
//   if (err) console.error("VERIFY FAILED:", err);
//   else console.log("VERIFY OK:", success);
// });

// test-smtp.js
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const pass = process.env.SMTP_PASS;

console.log("SMTP_PASS:", JSON.stringify(pass));
console.log("SMTP_PASS length:", pass.length);
console.log("SMTP_PASS char codes:", [...pass].map(c => c.charCodeAt(0)));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass,
  },
});

transporter.verify((err, success) => {
  if (err) console.error("VERIFY FAILED:", err);
  else console.log("VERIFY OK:", success);
});
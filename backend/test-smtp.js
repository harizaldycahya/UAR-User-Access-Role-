// test-smtp.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "ms.triasmitra.com",
  port: 587,
  secure: false,
  auth: {
    user: "notifikasi.uar@ms.triasmitra.com",
    pass: "Triasmitra@2026!_n0tifik4s1!", // ganti manual, jangan dari .env, buat mastiin bukan masalah env loading
  },
});

transporter.verify((err, success) => {
  if (err) console.error("VERIFY FAILED:", err);
  else console.log("VERIFY OK:", success);
});

// test-smtp.js
// test-smtp.js
// import dotenv from "dotenv";
// dotenv.config();

// import nodemailer from "nodemailer";

// const pass = process.env.SMTP_PASS;

// console.log("SMTP_PASS:", JSON.stringify(pass));
// console.log("SMTP_PASS length:", pass.length);
// console.log("SMTP_PASS char codes:", [...pass].map(c => c.charCodeAt(0)));

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT) || 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass,
//   },
// });

// transporter.verify((err, success) => {
//   if (err) console.error("VERIFY FAILED:", err);
//   else console.log("VERIFY OK:", success);
// });
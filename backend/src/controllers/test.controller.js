export const versionCheck = (req, res) => {
  return res.json({
    success: true,
    message: "Server is running latest code",
    version: "v1.0.2", // ⬅️ ubah angka ini tiap kali upload, biar gampang bedain
    server_time: new Date().toISOString(),
    uptime_seconds: process.uptime(),
  });
};
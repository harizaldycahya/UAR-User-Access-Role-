export const approvalEmailTemplate = ({ username, type, title, content, url }) => {
  const isApproval = type === "approval";
  const color = isApproval ? "#16a34a" : "#dc2626";
  const label = isApproval ? "✅ Disetujui" : "❌ Ditolak";

  return {
    subject: `[UAR] ${label} - ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;
                  background:#ffffff;border:1px solid #e5e7eb;">
        <h2 style="font-size:20px;font-weight:700;color:${color};margin:0 0 8px 0;">
          ${label}
        </h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 4px 0;">
          Halo <strong>${username}</strong>,
        </p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px 0;">
          ${content}
        </p>
        ${url ? `
          <a href="${process.env.FRONTEND_URL}${url}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;
                    color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            Lihat Detail
          </a>
        ` : ""}
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
          Email ini dikirim otomatis oleh Portal Triasmitra.
        </p>
      </div>
    `,
  };
};
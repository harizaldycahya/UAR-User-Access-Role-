import { db } from "../config/db.js";

export const getApplicationsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        a.id,
        a.code,
        a.name,
        a.url,
        a.color,
        a.icon,

        ua.id AS user_app_id,
        ua.created_at AS granted_at,
        ua.application_roles_id,

        ar.name AS role_name
      FROM applications a
      LEFT JOIN user_applications ua
        ON ua.application_id = a.id
        AND ua.user_id = ?
      LEFT JOIN application_roles ar
        ON ar.id = ua.application_roles_id
        AND ar.deleted_at IS NULL
      ORDER BY a.name ASC
      `,
      [userId]
    );

    const result = rows.map((app) => ({
      id: app.id,
      code: app.code,
      name: app.name,
      url: app.url,
      color: app.color,
      icon: app.icon,

      has_access: Boolean(app.user_app_id),
      granted_at: app.granted_at,

      role: app.application_roles_id
        ? {
            id: app.application_roles_id,
            name: app.role_name,
          }
        : null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data aplikasi" });
  }
};


export const checkApplicationAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { application_id } = req.params;

    const [rows] = await db.query(
      `
      SELECT id
      FROM user_applications
      WHERE user_id = ?
        AND application_id = ?
      LIMIT 1
      `,
      [userId, application_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: "Akses aplikasi ditolak",
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memverifikasi akses aplikasi" });
  }
};

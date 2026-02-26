  import { db } from "../config/db.js";

  export const getApplicationsByUser = async (req, res) => {
    try {
      const username = req.user.username;

      const [rows] = await db.query(
        `
          SELECT
            a.id,
            a.code,
            a.name,
            a.url,
            a.color,
            a.icon,
            a.role_mode,

            ua.id AS user_app_id,
            ua.created_at AS granted_at,
            ua.application_roles_id,
            ua.external_application_role_id,
            ua.role_name AS ua_role_name,

            ar.name AS ar_role_name
          FROM applications a
          LEFT JOIN user_applications ua
            ON ua.application_id = a.id
            AND ua.username = ?
          LEFT JOIN application_roles ar
            ON ar.id = ua.application_roles_id
            AND ar.deleted_at IS NULL
          ORDER BY 
            (ua.id IS NOT NULL) DESC,
            a.name ASC
        `,
        [username]
      );

      const result = rows.map((app) => {
        const isExternal = Boolean(app.external_application_role_id);

        return {
          id: app.id,
          code: app.code,
          name: app.name,
          url: app.url,
          color: app.color,
          icon: app.icon,
          role_mode: app.role_mode,

          has_access: Boolean(app.user_app_id),
          granted_at: app.granted_at,

          role: isExternal
            ? {
                id: app.external_application_role_id,
                name: app.ua_role_name,
              }
            : app.application_roles_id
            ? {
                id: app.application_roles_id,
                name: app.ar_role_name,
              }
            : null,
        };
      });

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal mengambil data aplikasi" });
    }
  };

  export const checkApplicationAccess = async (req, res, next) => {
    try {
      const username = req.user.username;
      const { application_id } = req.params;

      const [rows] = await db.query(
        `
        SELECT id
        FROM user_applications
        WHERE username = ?
          AND application_id = ?
        LIMIT 1
        `,
        [username, application_id]
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

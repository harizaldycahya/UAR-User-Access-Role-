// helpers/approvalHelpers.js
import { db } from "../config/db.js";

export const getApprovalWithLock = async (conn, approval_id, username) => {
  const [[approval]] = await conn.query(
    `SELECT * FROM approvals WHERE id = ? AND approver_id = ? FOR UPDATE`,
    [approval_id, username]
  );
  return approval;
};

export const getMinPendingLevel = async (conn, request_code) => {
  const [[minLevel]] = await conn.query(
    `SELECT MIN(level) AS min_level FROM approvals WHERE request_code = ? AND status = 'pending'`,
    [request_code]
  );
  return minLevel.min_level;
};

export const handleReject = async (conn, approval, reason = null) => {
  await conn.query(
    `UPDATE approvals SET status = 'rejected', approved_at = NOW(), reason = ? WHERE id = ?`,
    [reason, approval.id]
  );
  await conn.query(
    `UPDATE requests SET status = 'rejected' WHERE request_code = ?`,
    [approval.request_code]
  );
  await conn.query(
    `UPDATE approvals SET status = 'rejected' WHERE request_code = ? AND status = 'pending'`,
    [approval.request_code]
  );
};

export const getPendingCount = async (conn, request_code) => {
  const [[pending]] = await conn.query(
    `SELECT COUNT(*) AS total FROM approvals WHERE request_code = ? AND status = 'pending'`,
    [request_code]
  );
  return pending.total;
};

export const getRequestInfo = async (conn, request_code) => {
  const [[request]] = await conn.query(
    `SELECT r.username, r.application_id, r.old_role_id, r.old_role_name,
            r.new_role_id, r.new_role_name, r.new_location_id, r.new_location_name,
            r.old_location_id, r.old_location_name, r.type, a.code AS app_code
     FROM requests r
     JOIN applications a ON a.id = r.application_id
     WHERE r.request_code = ?`,
    [request_code]
  );
  return request;
};

export const applyRoleChanges = async (conn, request) => {
  const isExternal = ['ams', 'ims'].includes(request.app_code?.toLowerCase());
  const isAms = request.app_code?.toLowerCase() === 'ams';

  if (request.type === 'application_access') {
    await conn.query(
      `INSERT INTO user_applications
        (username, application_id, application_roles_id, external_application_role_id, external_application_location_id, role_name, location_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        request.username,
        request.application_id,
        isExternal ? null : request.new_role_id,
        isExternal ? request.new_role_id : null,
        isAms ? request.new_location_id : null,
        request.new_role_name,
        isAms ? request.new_location_name : null,
      ]
    );
  }

  if (request.type === 'change_role') {
    // Build dynamic SET clause - hanya update field yang dikirim
    const setClauses = [];
    const values = [];

    if (request.new_role_id) {
      setClauses.push(
        `application_roles_id = ?`,
        `external_application_role_id = ?`,
        `role_name = ?`
      );
      values.push(
        isExternal ? null : request.new_role_id,
        isExternal ? request.new_role_id : null,
        request.new_role_name
      );
    }

    if (isAms && request.new_location_id) {
      setClauses.push(
        `external_application_location_id = ?`,
        `location_name = ?`
      );
      values.push(request.new_location_id, request.new_location_name);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(request.username, request.application_id);

    const [result] = await conn.query(
      `UPDATE user_applications
       SET ${setClauses.join(", ")}
       WHERE username = ? AND application_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      await conn.query(
        `INSERT INTO user_applications
          (username, application_id, application_roles_id, external_application_role_id, external_application_location_id, role_name, location_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          request.username,
          request.application_id,
          isExternal ? null : request.new_role_id,
          isExternal ? request.new_role_id : null,
          isAms ? request.new_location_id : null,
          request.new_role_name,
          isAms ? request.new_location_name : null,
        ]
      );
    }
  }
};

export const getPersonasysApproval = async (nik) => {
  const response = await fetch(
    `https://personasys.triasmitra.com/api/auth/get-approval-uar?nik=${nik}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Gagal fetch approval Personasys: ${response.status}`);
  }

  const json = await response.json();

  if (!json.Success || !json.data) {
    throw new Error(`Approval Personasys NIK ${nik} tidak ditemukan`);
  }

  return json.data;
};

export const getPersonasysProfile = async (nik) => {
  const response = await fetch(
    `https://personasys.triasmitra.com/api/auth/get-profile-uar?nik=${nik}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Gagal fetch profile Personasys: ${response.status}`);
  }

  const json = await response.json();

  if (!json.Success || !json.data) {
    throw new Error(`Profile Personasys NIK ${nik} tidak ditemukan`);
  }

  return json.data;
};

const getPersonasysAtasan = async (nik) => {
  const response = await fetch(
    `https://personasys.triasmitra.com/api/auth/get-atasan-uar?nik=${nik}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Gagal fetch atasan Personasys: ${response.status}`);
  }

  const json = await response.json();

  if (!json.Success || !json.data) {
    throw new Error(`Atasan Personasys NIK ${nik} tidak ditemukan`);
  }

  return json.data;
};


// AMS HELPER

const AMS_TOKEN = 'iCI0YUAb0hu+2HF62lR_xs9FUsguF3OI6BqU2O33vP46fq$AO42UAE647vCeu4Shxfw';
const AMS_BASE_URL = 'https://ams.triasmitra.com/api/public';

const amsHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Authorization': `Bearer ${AMS_TOKEN}`,
};

const getAmsUser = async (nik) => {
  const response = await fetch(`${AMS_BASE_URL}/get-user?nik=${nik}`, {
    method: 'GET',
    headers: amsHeaders,
  });

  if (!response.ok) {
    throw new Error(`Gagal fetch user AMS: ${response.status}`);
  }

  const json = await response.json();
  const user = json?.result?.data?.[0];

  if (!user) {
    throw new Error(`User AMS dengan NIK ${nik} tidak ditemukan`);
  }

  return user;
};

const createAmsUser = async (request) => {
  const [profile, approval, atasan, rows] = await Promise.all([
    getPersonasysProfile(request.username),
    getPersonasysApproval(request.username),
    getPersonasysAtasan(request.username),
    db.query("SELECT * FROM users WHERE username = ? LIMIT 1", [request.username]).then(([r]) => r),
  ]);

  if (!rows.length) {
    throw new Error("User tidak ditemukan di database");
  }

  const dbUser = rows[0];

  const payload = {
    role_id: request.new_role_id,
    location_id: request.new_location_id,
    nik: profile.nik,
    name: profile.nama,
    email: profile.email,
    encrypted_password: dbUser.password,
    phone: profile.telp,
    job_title: profile.posisi,
    superior_nik: approval.atasan1_general ?? "",
    supervisor_nik: approval.atasan1_general ?? "",
    kadep_nik: atasan.kadept_approval ?? "",
    kadiv_nik: atasan.kadiv_approval ?? "",
  };

  const response = await fetch(`${AMS_BASE_URL}/create-user`, {
    method: "POST",
    headers: amsHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`AMS create-user error: ${response.status} - ${errBody}`);
  }
};

const updateAmsUser = async (request) => {
  const [existingUser, profile, approval] = await Promise.all([
    getAmsUser(request.username),
    getPersonasysProfile(request.username),
    getPersonasysApproval(request.username),
  ]);

  const [rows] = await db.query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [request.username]
  );

  if (!rows.length) throw new Error("User tidak ditemukan di database");
  const dbUser = rows[0];

  const payload = {
    role_id: request.new_role_id || existingUser.role_id,         // ← fallback ke existing
    location_id: request.new_location_id || existingUser.location_id, // ← fallback ke existing
    nik: existingUser.nik,
    name: existingUser.name,
    email: existingUser.email,
    encrypted_password: dbUser.password,
    phone: existingUser.phone,
    job_title: profile.posisi,
    superior_nik: approval.atasan1_general ?? "",
    status: existingUser.status,
  };

  const response = await fetch(`${AMS_BASE_URL}/update-user`, {
    method: "PATCH",
    headers: amsHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`AMS update-user error: ${response.status} - ${errBody}`);
  }
};

const checkAmsUserExists = async (nik) => {
  const response = await fetch(`${AMS_BASE_URL}/get-user?nik=${nik}`, {
    method: 'GET',
    headers: amsHeaders,
  });

  if (!response.ok) {
    throw new Error(`Gagal cek user AMS: ${response.status}`);
  }

  const json = await response.json();
  return json?.result?.total > 0;
};

// IMS HELPER
const IMS_TOKEN = 'KFhNebzV8EvLWTyWYZ0XPKafNGDwtANTN7WzZtka_TfGTqPQtmANLiRfMtCI8JKyxg9';
const IMS_BASE_URL = 'https://ims.triasmitra.com/api/public';

const imsHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Authorization': `Bearer ${IMS_TOKEN}`,
};

const createImsUser = async (request) => {
  const [profile, rows] = await Promise.all([
    getPersonasysProfile(request.username),
    db.query("SELECT * FROM users WHERE username = ? LIMIT 1", [request.username]).then(([r]) => r),
  ]);

  if (!rows.length) {
    throw new Error("User tidak ditemukan di database");
  }

  const dbUser = rows[0];

  const payload = {
    hierarchy_id: request.new_role_id,
    nik: profile.nik,
    name: profile.nama,
    email: profile.email,
    encrypted_password: dbUser.password,
    phone: profile.telp,
  };

  const response = await fetch(`${IMS_BASE_URL}/create-user`, {
    method: 'POST',
    headers: imsHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`IMS create-user error: ${response.status} - ${errBody}`);
  }
};

const updateImsUser = async (request) => {
  const [profile, rows] = await Promise.all([
    getPersonasysProfile(request.username),
    db.query("SELECT * FROM users WHERE username = ? LIMIT 1", [request.username]).then(([r]) => r),
  ]);

  if (!rows.length) {
    throw new Error("User tidak ditemukan di database");
  }

  const dbUser = rows[0];

  const payload = {
    hierarchy_id: request.new_role_id,
    nik: profile.nik,
    name: profile.nama,
    email: profile.email,
    encrypted_password: dbUser.password,
    phone: profile.telp,
  };

  const response = await fetch(`${IMS_BASE_URL}/update-user`, {
    method: 'PATCH',
    headers: imsHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`IMS update-user error: ${response.status} - ${errBody}`);
  }
};


const CMS_TOKEN = 'f7a3c2e8b1d94f6a2e5c7b3d8f1a4e9c2b6d3f8a1e4c7b2d5f9a3e6c1b4d7f2';
const CMS_BASE_URL = 'https://devcms.triasmitra.com/api/public';

const cmsHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${CMS_TOKEN}`,
};

const checkCmsUserExists = async (nik) => {
  const response = await fetch(`${CMS_BASE_URL}/get-user?nik=${nik}`, {
    method: 'GET',
    headers: cmsHeaders,
  });

  if (!response.ok) {
    throw new Error(`Gagal cek user CMS: ${response.status}`);
  }

  const json = await response.json();
  return json?.result?.total > 0;
};

const createCmsUser = async (request) => {
  const profile = await getPersonasysProfile(request.username);
  const [[dbUser]] = await db.query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [request.username]
  );

  if (!dbUser) throw new Error("User tidak ditemukan di database");

  const payload = {
    nik: profile.nik,
    name: profile.nama,
    email: profile.email,
    role: request.new_role_name,
    encrypted_password: dbUser.password,
  };

  const response = await fetch(`${CMS_BASE_URL}/create-user`, {
    method: 'POST',
    headers: cmsHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`CMS create-user error: ${response.status} - ${errBody}`);
  }
};

const updateCmsUser = async (request) => {
  const profile = await getPersonasysProfile(request.username);

  const payload = {
    nik: profile.nik,
    name: profile.nama,
    email: profile.email,
    role: request.new_role_name,
  };

  const response = await fetch(`${CMS_BASE_URL}/update-user`, {
    method: 'PATCH',
    headers: cmsHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`CMS update-user error: ${response.status} - ${errBody}`);
  }
};

export const notifyExternalApp = async (request) => {
  const appCode = request.app_code?.toLowerCase();

  if (appCode === 'ams') {
    const userExists = await checkAmsUserExists(request.username);
    if (userExists) {
      await updateAmsUser(request);
    } else {
      await createAmsUser(request);
    }
  }

  if (appCode === 'ims') {
    if (request.type === 'change_role') {
      await updateImsUser(request);
    } else {
      await createImsUser(request);
    }
  }

  if (appCode === 'cms') {
    const userExists = await checkCmsUserExists(request.username);
    if (userExists) {
      await updateCmsUser(request);
    } else {
      await createCmsUser(request);
    }
  }
};
import express from "express";
import {
  getApplicationRoles,
  getApplicationRoleById,
  createApplicationRole,
  updateApplicationRole,
  deleteApplicationRole,
} from "../controllers/applicationRoleController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ALL ROLES BY APPLICATION
|--------------------------------------------------------------------------
| Method : GET
| URL    : http://localhost:3000/api/applications/1/roles
| Desc   : Ambil semua role milik satu aplikasi
*/
router.get("/applications/:applicationId/roles", getApplicationRoles);

/*
|--------------------------------------------------------------------------
| GET ROLE BY ID
|--------------------------------------------------------------------------
| Method : GET
| URL    : http://localhost:3000/api/application-roles/5
| Desc   : Ambil detail satu role berdasarkan ID
*/
router.get("/application-roles/:id", getApplicationRoleById);

/*
|--------------------------------------------------------------------------
| CREATE ROLE FOR APPLICATION
|--------------------------------------------------------------------------
| Method : POST
| URL    : http://localhost:3000/api/applications/1/roles
| Headers:
|   Content-Type: application/json
| Body (JSON):
| {
|   "name": "Supervisor",
|   "description": "Supervise operational activities"
| }
*/
router.post("/applications/:applicationId/roles", createApplicationRole);

/*
|--------------------------------------------------------------------------
| UPDATE ROLE
|--------------------------------------------------------------------------
| Method : PUT
| URL    : http://localhost:3000/api/application-roles/5
| Headers:
|   Content-Type: application/json
| Body (JSON):
| {
|   "name": "Senior Supervisor",
|   "description": "Supervise and approve activities"
| }
*/
router.put("/application-roles/:id", updateApplicationRole);

/*
|--------------------------------------------------------------------------
| DELETE ROLE (SOFT DELETE)
|--------------------------------------------------------------------------
| Method : DELETE
| URL    : http://localhost:3000/api/application-roles/5
| Desc   : Soft delete role (set deleted_at)
*/
router.delete("/application-roles/:id", deleteApplicationRole);

export default router;

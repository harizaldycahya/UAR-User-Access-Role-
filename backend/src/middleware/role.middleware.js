export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {

        console.log("ROLE FROM REQ:", req.user.role_id);
    console.log("ALLOWED ROLES:", allowedRoles);
    
    if (!req.user || !allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
};

const authorizeRoles = (...roles) => {
  const normalizedRoles = roles.map((role) => String(role).trim().toLowerCase());

  return (req, res, next) => {
    const userRole = String(req.user?.role || "")
      .trim()
      .toLowerCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ message: `Role '${req.user?.role}' not allowed` });
    }

    next();
  };
};

module.exports = { authorizeRoles };
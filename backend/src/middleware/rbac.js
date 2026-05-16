// Effective admin sub-role: null/undefined treated as super_admin for backwards compat
const getEffectiveAdminRole = (user) => {
  if (!user || user.role !== 'admin') return null;
  return user.adminRole || 'super_admin';
};

// Middleware: require one of the listed admin sub-roles
const requireAdminRole = (...roles) => (req, res, next) => {
  const r = getEffectiveAdminRole(req.user);
  if (!r || !roles.includes(r)) {
    return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` });
  }
  next();
};

// Middleware: for operator-type admins, inject req.providerScope = their assignedProviderId
const withProviderScope = (req, res, next) => {
  const r = getEffectiveAdminRole(req.user);
  if (r === 'operator' && req.user.assignedProviderId) {
    req.providerScope = req.user.assignedProviderId;
  }
  next();
};

module.exports = { getEffectiveAdminRole, requireAdminRole, withProviderScope };

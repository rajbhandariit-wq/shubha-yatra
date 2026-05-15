module.exports = (req, res, next) => {
  if (req.user.role === 'provider' && req.user.status !== 'active') {
    return res.status(403).json({
      message: 'Your account is pending admin approval'
    });
  }
  next();
};
const providerApproved = require('../middleware/providerApproved');

router.use(authenticate);
router.use(authorize('provider'));
router.use(providerApproved);
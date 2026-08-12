const express = require('express');
const router = express.Router();
const { requestAccount, login, forgotPassword, resetPassword } = require('../controllers/authController');
const {
  validate,
  requestAccountSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../middleware/validate.middleware');

router.post('/request-account', validate(requestAccountSchema), requestAccount);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

module.exports = router;

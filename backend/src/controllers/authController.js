const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');
const { sendResetEmail } = require('../utils/mailer');

// STUDENT/PROFESSOR submits a request for an account.
// Creates a User doc with status 'requested' — no email/password yet.
exports.requestAccount = async (req, res) => {
  try {
    const { firstName, lastName, personalEmail, role, dateOfBirth } = req.body;

    const existing = await User.findOne({ personalEmail });
    if (existing) {
      return res.status(400).json({ message: 'A request or account already exists for this email' });
    }

    const request = await User.create({
      firstName,
      lastName,
      personalEmail,
      role,
      dateOfBirth,
      status: 'requested'
    });

    // Notify all admin accounts
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      await Notification.insertMany(admins.map((a) => ({
        userId: a._id,
        type: 'request',
        title: 'New account request',
        body: `${firstName} ${lastName} has requested a ${role} account.`,
        link: '/admin/users'
      })));
    }

    res.status(201).json({
      message: 'Request submitted. An admin will email your login credentials soon.',
      requestId: request._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during account request' });
  }
};

// LOGIN — only works for accounts with status 'active'.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'requested') {
      return res.status(403).json({ message: 'Your account request is still pending admin review' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendResetEmail({ to: user.email, resetLink });

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

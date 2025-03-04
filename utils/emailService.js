// utils/emailService.js - Email service utility
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Create reusable transporter
let transporter;

if (process.env.NODE_ENV === 'production') {
  // Production email setup (e.g., SendGrid, AWS SES, etc.)
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development email setup (e.g., Ethereal or local SMTP)
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Read email template
const readHTMLFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    // If you have an HTML template
    // const html = await readHTMLFile(path.join(__dirname, '../templates/resetPassword.html'));
    // const template = handlebars.compile(html);
    // const htmlToSend = template({ resetUrl });
    
    // For simplicity, using a plain text email
    const mailOptions = {
      from: `"Linktree Clone" <${process.env.EMAIL_FROM || 'noreply@linktreeclone.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) requested a password reset. Please click on the following link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
      // html: htmlToSend // If using HTML template
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};
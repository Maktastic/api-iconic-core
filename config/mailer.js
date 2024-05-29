// mailer.js
import Logbook from "./logger.js";

import nodemailer from 'nodemailer'
import dotenv from "dotenv"; // Load environment variables from .env file
dotenv.config();
// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Replace with your email service provider
    secure: process.env.NODE_ENV === 'production',
    port: process.env.NODE_ENV === 'production' ? 443 : 587,
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        Logbook.error('Error connecting to email server:', error);
    } else {
        Logbook.info('Email server is ready to take messages');
    }
});

// Function to send email
const sendVerificationEmail = (to, id, token) => {
    const subject = 'Email Verification'
    const text = 'Confirm your email address by clicking this link: ' + process.env.BASE_PATH + `/verify/${token}`
    const mailOptions = {
        from: {
            name: "Support Iconic Core",
            address: process.env.EMAIL_USERNAME
        },
        to,
        subject,
        text
    };

    return transporter.sendMail(mailOptions).catch((error) => { return error });
};

const sendForgotPassword = (to, code) => {
    const subject = 'Forgot Password'
    const text = 
        'We received your request for a single-use code to use with your Iconic BTC account.\n' +
        '\n' +
        `Your single-use code is: ${code}` +
        '\n' +
        'If you didn\'t request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.' +
        '\n' + 
        'The requested code is valid for 15 mins.';
    const mailOptions = {
        from: {
            name: 'Support Iconic Core',
            address: process.env.EMAIL_USERNAME
        },
        to,
        subject,
        text
    }

    return transporter.sendMail(mailOptions).catch((error) => { return error });
}

const sendChangePassword = (to, code) => {
    const subject = 'Change Password Request'
    const text =
        'We received your request for a single-use code to use with your Iconic BTC account.\n' +
        '\n' +
        `Your single-use code is: ${code}` +
        '\n' +
        'The requested code is valid for 15 mins.';
    const mailOptions = {
        from: {
            name: 'Support Iconic Core',
            address: process.env.EMAIL_USERNAME
        },
        to,
        subject,
        text
    }

    return transporter.sendMail(mailOptions).catch((error) => { return error });
}

const sendChangeEmail = (to, code) => {
    const subject = 'Change Email Request'
    const text =
        'We received your request for a single-use code to use with your Iconic BTC account.\n' +
        '\n' +
        `Your single-use code is: ${code}` +
        '\n' +
        'If you didn\'t request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.' +
        '\n' +
        'The requested code is valid for 15 mins.';
    const mailOptions = {
        from: {
            name: 'Support Iconic Core',
            address: process.env.EMAIL_USERNAME
        },
        to,
        subject,
        text
    }

    return transporter.sendMail(mailOptions).catch((error) => { return error });
}

export { sendVerificationEmail, sendForgotPassword, sendChangePassword, sendChangeEmail }

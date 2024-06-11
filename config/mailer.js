// mailer.js
import Logbook from "./logger.js";

import nodemailer from 'nodemailer'
import dotenv from "dotenv"; // Load environment variables from .env file
import twilio from 'twilio'

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
    const text = 'Confirm your email address by clicking this link: ' + process.env.BASE_PATH + `/reset-password/${token}`
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

const sendForgotPassword = (to, token) => {
    const subject = 'Forgot Password'
    const text = 
        'We received your request for a single-use link to use with your Iconic BTC account.\n' +
        '\n' +
        `Your single-use link is: ${process.env.BASE_PATH}` + `/reset-password/${token}` +
        '\n' +
        'If you didn\'t request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.' +
        '\n' + 
        'The requested link is valid for 15 mins.';
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

const sendEmailVerification = (to, code) => {
    const subject = 'Email Verification'
    const text =
        'We received your request for a single-use code to use with your Iconic BTC account for email validation.\n' +
        '\n' +
        `Your single-use link is: ${code}` +
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

const sendChangePhoneNumber = (to, code) => {
    const subject = 'Change Phone Number Request'
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

const sendVerificationSMS = async (to, code) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    return await client.messages
        .create({
            to: '+18777804236',
            from: '+12183923423',
            body: 'We received your request for a single-use code to use with your Iconic BTC account.\n' +
                '\n' +
                `Your single-use code is: ${code}` +
                '\n' +
                'The requested code is valid for 15 mins.'
        })
        .then(message => {
            return {message_sent: true, sid: message?.sid}
        }).catch((error) => {
            return {message_sent: false, error: error}
        })
}

export { sendVerificationEmail, sendForgotPassword, sendChangePassword, sendChangeEmail, sendEmailVerification, sendVerificationSMS, sendChangePhoneNumber }

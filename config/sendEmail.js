import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


// to send verification Email
export const sendEmail = async (mailOption) => {
  //create a nodemailer transport

  const transporter = nodemailer.createTransport({
    //configure the email service 
    service: 'gmail',
    auth: {
      user: process.env.SEND_EMAIL,
      pass: process.env.SEND_PASSWORD,
    }
  })


  //send the email
  try {
    await transporter.sendMail(mailOption)
  } catch (error) {
    console.log("Error sending email", error)

  }
};
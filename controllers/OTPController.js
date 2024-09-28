import OTP from '../models/OTP.js';
import User from '../models/user.js';
import { sendEmail } from '../config/sendEmail.js';
import Client from '../models/Client.js';
import Driver from '../models/Driver.js';


export const sendOTP = async (req, res) => {
  try {
    const { email, subject, message, duration = 1 } = req.body

    if (!(email && subject && message)) {
      res.status(400).send({ message: "Provide field" })
    }

    //clear email
    await OTP.deleteOne({ email });

    //generate pin
    const generateOTP = `${Math.floor(1000 + Math.random() * 9000)}`

    //   //compose the email message
    const mailOption = {
      from: "Easy Buy",
      to: email,
      subject,
      html: `<p>${message}</p>
    <p style="color:green; font-size:25px; letter-spacing:2px;"><b>${generateOTP}</b></p>
    <p>This code <b>expires in ${duration} hours(s)</b>.</p>`,
    };

    //send the email
    await sendEmail(mailOption);

    const newOTP = await new OTP({
      email,
      otp: generateOTP,
      createdAt: Date.now(),
      expiresAT: Date.now() + 3600000 * +duration,
    });

    await newOTP.save();

    res.status(200).send({ message: "OTP send Succesfully" })

  } catch (error) {

    console.log(error)
    res.status(500).send({ message: 'OTP dont send' })
  }
}

export const verifyOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!(email && otp)) {
      res.status(400).send({ message: "email or OTP dont correct" })
    }

    const matchedOTPRecord = await OTP.findOne({ email })

    if (!matchedOTPRecord) {
      res.status(401).send({
        message: "otp not find"
      })
    }

    const { expiresAt } = matchedOTPRecord;

    if (expiresAt < Date.now()) {

      await OTP.deleteOne({ email })
      res.status(402).send({
        message: "code has expired . resquesr for a new one"
      })
    }



    const validOTP = await verifyOTP({ email, otp })

    res.status(200).json({ valid: validOTP });

  } catch (error) {
    console.log(error)
  }
}

export const deleteOTP = async ({ email, type }) => {
  try {
    await OTP.deleteOne({ email, type })
  } catch (error) {
    console.log(error)
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, type, duration = 1 } = req.body;


    if (email === '') {
      res.status(400).send({ message: "empty email" })
    }

    if (type === 'Taxi') {

      const existingUser = await Client.findOne({ email })

      if (!existingUser) {
        res.status(401).send({ message: "email introuvable" })
      }

      //clear email
      await OTP.deleteOne({ email, type });

      //generate pin
      const generateOTP = `${Math.floor(1000 + Math.random() * 9000)}`

      const mailOption = {
        from: "Kiwui",
        to: email,
        subject: "Password Reset",
        html: `<p>Enter the code below to reset your paasword.</p>
    <p style="color:green; font-size:25px; letter-spacing:2px;"><b>${generateOTP}</b></p>
    <p>This code <b>expires in ${duration} hours(s)</b>.</p>`,
      };

      //send the email
      await sendEmail(mailOption);

      const newOTP = await new OTP({
        email,
        type,
        otp: generateOTP,
        createdAt: Date.now(),
        expiresAT: Date.now() + 3600000 * +duration,
      });

      await newOTP.save();

      res.status(200).send({ message: "OTP send Succesfully", email })
    }

    if (type === 'Driver') {

      const existingUser = await Driver.findOne({ email })

      if (!existingUser) {
        res.status(401).send({ message: "email introuvable" })
      }

      //clear email
      await OTP.deleteOne({ email, type });

      //generate pin
      const generateOTP = `${Math.floor(1000 + Math.random() * 9000)}`

      const mailOption = {
        from: "Kiwui",
        to: email,
        subject: "Password Reset",
        html: `<p>Enter the code below to reset your paasword.</p>
    <p style="color:green; font-size:25px; letter-spacing:2px;"><b>${generateOTP}</b></p>
    <p>This code <b>expires in ${duration} hours(s)</b>.</p>`,
      };

      //send the email
      await sendEmail(mailOption);

      const newOTP = await new OTP({
        email,
        type,
        otp: generateOTP,
        createdAt: Date.now(),
        expiresAT: Date.now() + 3600000 * +duration,
      });

      await newOTP.save();

      res.status(200).send({ message: "OTP send Succesfully", email })
    }

    if (type === 'Buyer') {

      const existingUser = await User.findOne({ email })

      if (existingUser.email !== email) {
        res.status(401).send({ message: "email not find" })
      }

      //clear email
      await OTP.deleteOne({ email, type });

      //generate pin
      const generateOTP = `${Math.floor(1000 + Math.random() * 9000)}`

      const mailOption = {
        from: "Kiwui",
        to: email,
        subject: "Password Reset",
        html: `<p>Enter the code below to reset your paasword.</p>
    <p style="color:green; font-size:25px; letter-spacing:2px;"><b>${generateOTP}</b></p>
    <p>This code <b>expires in ${duration} hours(s)</b>.</p>`,
      };

      //send the email
      await sendEmail(mailOption);

      const newOTP = await new OTP({
        email,
        otp: generateOTP,
        createdAt: Date.now(),
        expiresAT: Date.now() + 3600000 * +duration,
      });

      await newOTP.save();

      res.status(200).send({ message: "OTP send Succesfully", email })
    }




  } catch (error) {
    console.log(error)
    res.status(400)
  }
}

export const verifyOTPPassword = async (req, res) => {
  try {
    let { email, otp, type } = req.body;

    if (!(email && otp)) {
      return res.status(400).send({ message: "Email ou OTP non fourni" });
    }

    const matchedOTPRecord = await OTP.findOne({ email, type });

    if (!matchedOTPRecord) {
      return res.status(401).send({ message: "OTP non trouvé" });
    }

    const { expiresAt } = matchedOTPRecord;

    if (expiresAt < Date.now()) {
      await OTP.deleteOne({ email, type });
      return res.status(402).send({ message: "Le code a expiré. Veuillez en demander un nouveau." });
    }

    if (matchedOTPRecord.otp !== otp) {
      return res.status(403).send({ message: "L'OTP ne correspond pas" });
    }

    res.status(200).send({ message: "OTP trouvé avec succès", email, otp });

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Erreur interne du serveur" });
  }
};


export const ChangeOTPPassword = async (req, res) => {
  let { email, otp, newPassword, type } = req.body

  if (!(email && otp && newPassword)) {
    res.status(400).send({ message: "email or OTP dont correct" })
  }

  if (newPassword.length < 8) {
    res.status(402)
  }

  if (type === 'Taxi') {
    await Client.updateOne({ email }, { password: newPassword, loginAttempts: 0, lockUntil: null })
  }

  if (type === 'Driver') {
    await Driver.updateOne({ email }, { password: newPassword, loginAttempts: 0, lockUntil: null })
  }

  // await User.updateOne({ email }, { password: newPassword })

  await deleteOTP({ email, type });

  res.status(200).send({ message: "Update Makesuccesfully", email, newPassword });
}
import User from "../models/user.js";
import Seller from "../models/Sellers.js";
import Product from "../models/Products.js";
import { Expo } from 'expo-server-sdk';
import { sendEmail } from "../config/sendEmail.js";

let expo = new Expo();

export const registerController = async (req, res) => {
  try {
    const { name, email, password, country, departement, userId } = req.body;

    //check if the user is already registered
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    //create a new User
    const user = await User.create({ name, email, password, userId, country, departement });

    //generate and store the verification token
    // newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    //   //compose the email message
    const mailOption = {
      from: "Easy Buy",
      to: email,
      subject: "Easy Buy",
      text: `Welcome at EasyBuy`
    };

    //send verifaction email to the user
    sendEmail(mailOption);


    res.status(201).send({
      succes: true,
      message:
        "Registration successful.",
      user,
    });

  } catch (error) {
    console.log("error registering user", error)
    res.status(500).json({ message: "Registration failed" })
  }
}

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Invalid Email" })
    }

    // const isMatch = await user.comparePassword(password);

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" })
    }

    // const token = user.generateToken();

    res
      .status(200)
      // .cookie("token",token,{
      //   expire: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      //   secure: process.env.MODE_ENV === "development" ? true : false,
      //   httpOnly: process.env.MODE_ENV === "development" ? true : false,
      //   sameSite: process.env.MODE_ENV === "development" ? true : false,
      // })
      .send({
        message: "Login succesfully",
        userId: user.userId,
        name: user.name,
        email: user.email,
        // token,
        user
      });

  } catch (error) {
    console.log("Login failed", error);

    res.status(500).json({ message: "Login failed" })
  }
}

export const getUserProfileController = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })

    res.status(200).send({ message: "User Account", user })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "user don't find" })
  }
}

export const registerTokenController = async (req, res) => {
  try {
    const { userId } = req.params
    const { token } = req.body

    const user = await User.findOne({ userId })

    if (!user) {
      return res.status(404).send({ Message: "utilisateur non retrouve" })
    }

    user.tokenBuyer = token

    await user.save()

    res.status(200).send({ token })

  } catch (error) {
    console.log(error)
    res.status(500).send({ Message: "token don't save" })
  }
}



//update userPassword
export const updatePasswordController = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body

    const user = await User.findOne({ userId })


    //validation
    if (!oldPassword || !newPassword) {
      return res.status(500).send({
        message: "please provide a new or old password"
      })
    }

    if (user.password !== oldPassword) {
      return res.status(500).send({ message: "invalid oldPassword" })
    }

    user.password = newPassword
    await user.save();

    res.status(200).send({ message: "password update succesfully" })

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "password don't update"
    })
  }

}

//forget password
export const sendPasswordResetOTPController = async (req, res) => {
  try {
    const { email } = req.body

    //check if a email is send
    if (!email) {
      res.status(400).send({ message: "email not find" })
    }

    //find and check the email exist in the DB
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      res.status(401).send({
        message: "there are not a account with this email"
      })
    }

    const otpDetails = {
      email,
      subject: "Password Reset",
      message: "Enter the code below to reset your password",
      duration: 1,
    }

    const createOTP = await sendOTP(otpDetails);

    res.status(200).json({ createOTP })

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "OTP dont Send"
    })
  }
}

export const sendChangeOrderNotif = async (req, res) => {

  const userId = req.params.userId;

  // Trouver l'utilisateur par son ID
  const user = await User.findOne({ userId });

  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }

  if (!Expo.isExpoPushToken(user.tokenBuyer)) {
    return res.status(400).send({ error: 'Invalid Expo push token' });
  }

  let message = {
    to: user.tokenBuyer,
    sound: 'default',
    title: 'Order Notification',
    body: 'L\'état de votre commande a changé',
    data: { withSome: 'data' },
  };

  try {
    let ticket = await expo.sendPushNotificationsAsync([message]);
    console.log(ticket);

    // Sauvegarder le message dans le champ notifications de l'utilisateur
    // user.notifications.push({ message: message.body });
    // await user.save();

    return res.status(200).send({ success: 'Notification sent' });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Failed to send notification' });
  }
};

export const followingSellerController = async (req, res) => {
  try {
    const { userId, sellerId } = req.body;

    const user = await User.findOne({ userId })
    const seller = await Seller.findOne({ sellerId });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const followingIndex = seller.followers.indexOf(userId);
    const followingSellerIndex = user.sellerFollowing.indexOf(sellerId)

    if (followingIndex !== -1) {
      // Si l'utilisateur est déjà un suiveur, le retirer de la liste
      seller.followers.splice(followingIndex, 1);
      user.sellerFollowing.splice(followingSellerIndex, 1);

      await seller.save();
      await user.save();

      return res.status(200).json({ message: "Unfollowed successfully" });
    } else {
      // Si l'utilisateur n'est pas un suiveur, l'ajouter à la liste
      seller.followers.push(userId);
      user.sellerFollowing.push(sellerId)

      await seller.save();
      await user.save();

      return res.status(200).json({ message: "Followed successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollowingSellerController = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ userId })

    if (!user) {
      return res.status(404).send({ message: "user not existed" })
    }

    const sellerFollowing = user.sellerFollowing

    const sellerFollowingList = []
    const productList = []

    for (const item of sellerFollowing) {
      const sellerId = item
      const seller = await Seller.findOne({ sellerId })
      sellerFollowingList.push(seller)


      const products = await Product.find({ sellerId })

      for (const item2 of products) {
        const product = item2
        productList.push(product)
      }
    }

    res.status(200).send({ sellerFollowingList, productList })

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Seller Not Find" })
  }
}

export const removeUserPreferenceController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preference } = req.body;

    if (!userId) {
      return res.status(404).send({ Message: "User ID not provided" })
    }

    const user = await User.findOne({ userId })

    if (!user) {
      return res.status(404).send({ Message: "User not found" })
    }

    const index = user.preferences.indexOf(preference);

    if (index !== -1) {
      user.preferences.splice(index, 1);
      await user.save();
    }

    res.status(200).json({ Message: "Preference removed successfully" })

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Preference removal failed" })
  }
};


//update user profile
export const updateProfileController = async (req, res) => {
  try {

    const { userId, pseudo, province, newPassword, oldPassword, notifBoolean, country, departement } = req.body

    const user = await User.findOne({ userId })

    if (pseudo) {
      user.name = pseudo
    }

    if (province) {
      user.country = country;
      user.departement = departement;
      user.province = province
    }

    if (newPassword && oldPassword) {

      if (oldPassword !== user.password) {
        return res.status(201).send({ message: "ansyen modepas lan pa korek" })
      }

      if (oldPassword === user.password) {
        user.password = newPassword
      }
    }


    if (notifBoolean === false) {
      user.notificationStatut = false;
    }

    if (notifBoolean === true) {
      user.notificationStatut = true;
    }


    await user.save();

    res.status(200).send({
      message: "profile update"
    })


  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "profile dont update"
    })
  }
};


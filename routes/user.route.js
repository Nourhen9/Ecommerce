const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {uploadFile} = require('../middleware/uploadfile');

var transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "nouralakhrech@gmail.com",
    pass: "qmbe pzgh mvac nbzr",
  },
  tls: {
    rejectUnauthorized: false,
  },
});




require('dotenv').config();
// créer un nouvel utilisateur
router.post('/register', async (req, res) => {//post 5teer plus securisé mn get
  try {
    let { email, password, firstname, lastname } = req.body; //let:pour déclarer une variable modifiable
    const user = await User.findOne({ email });
    if (user)
      return res
        .status(404)
        .send({ success: false, message: "User already exists" });

    const newUser = new User({ email, password, firstname, lastname });
    const createdUser = await newUser.save();
    
    // Envoyer l'e-mail de confirmation de l'inscription
    var mailOption = {
      from: '"Verify your email" <agony050204@gmail.com>',
      to: newUser.email,
      subject: "Verify your email",
      html: `<h2>${newUser.firstname}! Thank you for registering on our website</h2>
<h4>Please verify your email to proceed...</h4>
<a href="http://${req.headers.host}/api/users/status/edit?email=${newUser.email}">Click here to verify</a>`,
    };
    
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log("Email error:", error);
      } else {
        console.log("Verification email sent:", info.response);
      }
    });
    
    return res
      .status(201)
      .send({
        success: true,
        message: "Account created successfully. Please check your email to verify your account.",
        user: createdUser,
      });
  } catch (err) {
    console.log(err);
    res.status(404).send({ success: false, message: err.message });
  }
});
//Access Token
const generateAccessToken=(user) =>{
return jwt.sign ({ iduser: user._id, role: user.role }, process.env.SECRET, {
expiresIn: '60s'})
}
// Refresh
function generateRefreshToken(user) {
return jwt.sign ({ iduser: user._id, role: user.role },
process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1y'})
}
//Refresh Route
router.post('/refreshToken', async (req, res, )=> {
console.log(req.body.refreshToken)
const refreshtoken = req.body.refreshToken;
if (!refreshtoken) {
return res.status(404).send({success: false, message: 'Token Not Found' });
}
else {
jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
if (err) { console.log(err)
return res.status(406).send({ success: false,message: 'Unauthorized' });
}
else {
const token = generateAccessToken(user);
const refreshToken = generateRefreshToken(user);
console.log("token-------",token);
res.status(200).send({success: true,
token,
refreshToken
})
}
});
}

});

// as an admin i can disable or enable an account (also used for email verification)
router.get('/status/edit/', async (req, res) => {
  try {
    let email = req.query.email; //objet contenant les paramètres de la chaîne de requête (query string) de l’URL.
    console.log("Verifying email:", email);
    let user = await User.findOne({ email }); //recharchi 3al user b email ,user:un modèle Mongoose
    //await : attend que la recherche en base de données se termine avant de continuer.
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    user.isActive = !user.isActive;
    await user.save();//Enregistre les modifications dans la base de données.
    res.status(200).send(`
      <h1>Email Verified Successfully!</h1>
      <p>Your account is now active. You can close this window and login.</p>
    `);
  } catch (err) {
    console.log(err);
    return res.status(404).send({ success: false, message: err.message });
  }
});

// afficher la liste des utilisateurs.
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// se connecter
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).send({ success: false, message: "All fields are required" });
    }

    let user = await User.findOne({ email }).select('+password').select('+isActive');//Force l’inclusion de ce champ malgré select: false dans le schéma.
//isActive → pour vérifier si le compte est actif
    if (!user) {
      return res.status(404).send({ success: false, message: "Account doesn't exists" });
    } else {
      let isCorrectPassword = await bcrypt.compare(password, user.password);
      if (isCorrectPassword) {
        delete user._doc.password;//Supprime le mot de passe de l’objet user avant de l’envoyer au client.
        if (!user.isActive) return res.status(200).send({ success: false, message: 'Your account is inactive, Please contact your administrator' });

       const token = generateAccessToken(user);
const refreshToken = generateRefreshToken(user);
//jwt.sign(payload, secret, options) : crée un jeton d’authentification.
//Payload : données encodées dans le token (ID, nom, rôle).
//Secret : clé secrète stockée dans .env → doit rester confidentielle.
//expiresIn : le token expire après 1 heure → sécurité.
//token (à stocker côté client, ex. dans localStorage).
        return res.status(200).send({ success: true, user, token });
      } else {
        return res.status(404).send({ success: false, message: "Please verify your credentials" });
      }
    }
  } catch (err) {
    return res.status(404).send({ success: false, message: err.message });
  }
});

module.exports = router;
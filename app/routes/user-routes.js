/**
 * Created by sridharrajs.
 */

'use strict';

const bcrypt = require('bcrypt-nodejs');
const express = require('express');

let userController = require('../controllers/user-controller');
let jwtController = require('../controllers/jwt-controller');

function signUp(req, res) {
  let {email, password} = req.body;

  userController.add({
    email: email,
    password: bcrypt.hashSync(password)
  }).then((user) => {
    return res.status(200).send({
      msg: 'User created successfully!',
      token: jwtController.generateToken({
        userId: user._id
      }),
      profile_url: user.gravatar_url
    });
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send({
      errors: {
        msg: err.message
      }
    });
  });
}

function login(req, res) {
  let {email, password} = req.body;

  userController.getUserByEmail(email).then((userObj) => {
    let saltedPwd = userObj.password;
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, saltedPwd, (err, isEqual) => {
        if (!isEqual) {
          return reject('Invalid email/password');
        }
        return resolve(userObj);
      });
    });
  }).then((userObj) => {
    return res.status(200).send({
      token: jwtController.generateToken({
        userId: userObj._id
      }),
      profile_url: userObj.gravatar_url
    });
  }).catch((msg) => {
    return res.status(403).send({
      msg: msg
    });
  });
}

let app = express.Router();


let validator = require('../middleware/validator/user-validator');

app.post('/signup', validator, signUp);
app.post('/login', validator, login);

module.exports = (indexApp) => {
  indexApp.use('/users', app);
};

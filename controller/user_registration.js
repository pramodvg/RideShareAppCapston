const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mdb_user_model = require("../model/user_register_model");
var fs = require("fs");
var path = require("path");
var upload = require("./file_upload");
const user_register_model = require("../model/user_register_model");
const userLogin = require("../model/user_login");

var response = { id: 0, msg: "", statusCode: 0 };

router.post("/register_user", upload.single("user_image"), async (req, res) => {
  try {
    if (
      req.body.email &&
      req.body.fname &&
      req.body.lname &&
      req.body.password
    ) {
      let existingUser = await mdb_user_model.findOne({
        email: req.body.email,
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hashSync(req.body.password, salt);

      if (!existingUser) {
        let userData = mdb_user_model();
        userData.fname = req.body.fname;
        userData.lname = req.body.lname;
        userData.email = req.body.email;
        userData.password = hashPassword;
        userData.user_image = {
          data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
          contentType: 'image/png'
      }

        let newUser = await userData.save();

        response.id = newUser.id;
        response.msg = "Register Successfully";
        response.statusCode = 200;
        req.session.userId = response.id;
        console.log(newUser);
      } else {
        response.msg = "User already exists";
      }
    }
  } catch (err) {
    response.msg = err;
    console.log(err);
    response.statusCode = 404;
  }
  res.json(response);
});

router.get("/register_user", async (req, res) => {
  if (req.session.userId) {
    mdb_user_model.find(
      {
        id: req.session.userId,
      },
      (err, items) => {
        if (err) {
          console.log(err);
          res.status(500).send("An error occurred", err);
        } else {
          res.send(items);
        }
      }
    );
  } else {
    response.msg = req.session.userId;
    response.statusCode = 201;
  }
  res.json(response);
});

//Login
var response1 = { id: 0, msg: "", statusCode: 0, fname: "", lname: "", user_image:"", email:"" };

router.post("/login", async (req, res) => {
  

  try {
    let existingUser = await mdb_user_model.findOne({ email: req.body.email });
    if (existingUser) {
      if (bcrypt.compareSync(req.body.password, existingUser.password)) {

        response1.id = existingUser.id;
        response1.statusCode = 200;
        response1.msg = "Login succesful";
        response1.email = existingUser.email,
        response1.fname = existingUser.fname,
        response1.lname = existingUser.lname,
        response1.user_image = existingUser.user_image
        req.session.userId = response1.id;
      }
      else {
        response1.statusCode = 201;
        response1.msg = "wrong password";
      }
    }
    else {
      response1.statusCode = 201;
      response1.msg = "Invalid email or password";
    }
  } catch (err) {
    console.log(err);
    response1.statusCode = 201;
    response1.msg = err;
  }

  res.json(response1);
});


module.exports = router;

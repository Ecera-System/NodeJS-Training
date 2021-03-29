var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user.js");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

router.get("/register",function(req,res)
	   {
	res.render("register.ejs");
});
router.post("/register",function(req,res)
		{
	    var newUser = new User({username: req.body.username,fname:req.body.fname,lname:req.body.lname});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register.ejs",{error:err.message});
        }
        passport.authenticate("local")(req, res, function(){
          { let mailerConfig = {    
    host: "smtp.office365.com",  
    secureConnection: true,
    port: 587,
    auth: {
        user: "admin@betval.co.uk",
        pass: "United-123"
    }
};
let transporter = nodemailer.createTransport(mailerConfig);

let mailOptions = {
    from: mailerConfig.auth.user,
    to: user.username,
    subject: 'Welcome To BetVal',
    html: `<body>` +
        `<p>Hey There,<br> Thank You For Signing Up On BetVal. You can now proceed to place bets on matches and win huge amounts of money. We wish you the best. Happy Betting!!!</p>` +
        `</body>`
};

transporter.sendMail(mailOptions, function (error) {
    if (error) {
        console.log('error:', error);
    } else {
        console.log('good');
    }
});res.redirect("/"); }
        });
    });

});
router.get("/login", function(req,res)
	   {
	res.render("login.ejs");
});
router.post("/login",passport.authenticate("local",{
	successRedirect:"/",
	failureRedirect:"/login",
failureFlash:true,
successFlash:true}),
	function(req,res)
		{
	
});
router.get("/logout",function(req,res)
	   {
	req.logout();
	res.redirect("/");
});
router.get('/forgot', function(req, res) {
  res.render('forgot.ejs');
});
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ username: req.body.username }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
		let mailerConfig = {    
    host: "smtp.office365.com",  
    secureConnection: true,
    port: 587,
    auth: {
        user: "admin@betval.co.uk",
        pass: "United-123"
    }
};
let transporter = nodemailer.createTransport(mailerConfig);

let mailOptions = {
    from: mailerConfig.auth.user,
    to: user.username,
    subject: 'BetVal Password Reset Request',
    html: 'You are receiving this because you (or someone else) have requested to reset the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
};

transporter.sendMail(mailOptions, function (err) {
    console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
        done(err, 'done');
	console.log("HI");
      });
    }
  ],function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  }); 
});
		
        

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
     if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
   
    res.render('reset.ejs', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      let mailerConfig = {    
    host: "smtp.office365.com",  
    secureConnection: true,
    port: 587,
    auth: {
        user: "admin@betval.co.uk",
        pass: "United-123"
    }
};
let transporter = nodemailer.createTransport(mailerConfig);

let mailOptions = {
    from: mailerConfig.auth.user,
    to: user.username,
    subject: 'BetVal Password Reset Request',
    text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      };

transporter.sendMail(mailOptions, function (error) {
    if (error) {
        console.log('error:', error);
    } else {
        console.log('good');
		      req.flash('success', 'Your password has been successfully changed');
        done(error, 'done');}
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

function isLoggedIn(req,res,next)
{
	if(req.isAuthenticated())
		return next();
	else
		res.redirect("/login");
}

module.exports = router;

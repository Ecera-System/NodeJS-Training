const express = require("express"),
  app = express(),
  request = require("request"),
  bodyParser = require("body-parser"),
  flash = require("connect-flash"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose = require("passport-local-mongoose"),
  User = require("./models/user.js"),
  Category = require("./models/category.js"),
  League = require("./models/league.js"),
  Match = require("./models/match.js"),
  Bet = require("./models/bet.js"),
  Withdrawal = require("./models/withdrawals.js"),
  Accumulator = require("./models/accumulator.js"),
  Deposit = require("./models/deposit.js"),
  methodOverride = require("method-override"),
  authRoutes = require("./routes/auth.js"),
  adminRoutes = require("./routes/admin.js");
var nodemailer = require("nodemailer");
const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "live", //sandbox or live
  client_id:
    "ARxgyi5BAIEVq4Frp6SK71Qp8PRhW_7c7Xc47AkwD4Cb9I7bQQEyU94Mjjg6gaWbsj4Ncosfkp0T8xdz",
  client_secret:
    "EAT2cihXpvKRDwEhsXuhvKkH7uu4s1rYbjBiMkAoIH_OOvyQTuVu0m6CuFVaFtnGdl3IV_2NzJkxKw6o",
});
var mongoXlsx = require("mongo-xlsx");

//

//const x =
 // "mongodb+srv://aadesh246:aadesh123@cluster0.2pyf8.mongodb.net/betval?retryWrites=true&w=majority";

 
 
const x =
    "mongodb+srv://ecerasystem:ecerasystem@cluster0.jlme1.mongodb.net/betval?retryWrites=true&w=majority";

mongoose
  .connect(x, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected");
  });
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.use(
  require("express-session")({
    secret: "Betval project",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
passport.authenticate("local", {
  failureFlash: "Invalid username or password.",
});
passport.authenticate("local", {
  successFlash: "Logged in successfully.",
});
app.use(async function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});
app.get("/", function (req, res) {
  var user;
  Match.find(
    {
      isSpecial: false,
    },
    function (err, matches) {
      League.find({}, function (err, leagues) {
        if (req.isAuthenticated()) {
          User.findById(req.user._id)
            .populate("bets")
            .exec(async function (err, user) {
              var accumulators = await Accumulator.find({
                username: user.username,
                status: "Ongoing",
                payment: true,
              })
                .populate("bets")
                .exec(function (err, accumulators) {
                  accumulators.forEach(function (accumulator) {
                    var bw = 0,
                      bl = 0,
                      totdiv = 1,
                      bc = 0;
                    var bc1 = 0;
                    accumulator.bets.forEach(function (bet) {
                      if (bet.result == 2) {
                        bc++;
                        if (bet.awarded == false) {
                          bet.awarded = true;
                          bet.save();
                          bc1++;
                          totdiv = totdiv * bet.odds;
                        }
                      }
                      if (bet.result == 1) bw++;
                      if (bet.result == 0) bl++;
                    });
                    if (bl > 0) {
                      accumulator.odds = accumulator.odds / totdiv;
                      accumulator.status = "Lost";
                      accumulator.save();
                    } else if (bc == accumulator.bets.length) {
                      accumulator.odds = 1;
                      accumulator.status = "Void";
                      accumulator.save();
                      user.balance += accumulator.amount * accumulator.odds;
                      user.save();
                    } else if (bw == accumulator.bets.length - bc) {
                      accumulator.odds = accumulator.odds / totdiv;
                      accumulator.status = "Won";
                      accumulator.save();
                      user.balance += accumulator.amount * accumulator.odds;
                      user.save();
                    } else if (bc1 > 0) {
                      accumulator.odds = accumulator.odds / totdiv;
                      accumulator.save();
                    }
                  });
                });
              user.bets.forEach(function (bet) {
                if (bet.result == 1 && !bet.awarded) {
                  user.balance += bet.odds * bet.amount;
                  user.save();
                  bet.awarded = true;
                  bet.save();
                }
                if (bet.result == 2 && !bet.awarded) {
                  user.balance += bet.amount;
                  user.save();
                  bet.awarded = true;
                  bet.save();
                }
              });
              setTimeout(function () {
                matches.sort(compare_item);
                res.render("home.ejs", {
                  matches: matches,
                  user: user,
                  leagues: leagues,
                });
              }, 500);
            });
        } else {
          matches.sort(compare_item);
          res.render("home.ejs", {
            matches: matches,
            user: user,
            leagues: leagues,
          });
        }
      });
    }
  );
});

app.get("/deposit", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user._id)
      .populate("bets")
      .exec(function (err, user) {
        res.render("deposit.ejs", {
          user: user,
        });
      });
  } else res.redirect("/login");
});
app.post("/deposit", function (req, res) {
  if (req.isAuthenticated()) {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://betval.co.uk/success/" + req.body.amount,
        cancel_url: "http://betval.co.uk/cancel",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Bet On BetVal",
                sku: "001",
                price: req.body.amount,
                currency: "GBP",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "GBP",
            total: req.body.amount,
          },
          description: "Placing a bet on Betval",
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(error);
        res.redirect("/");
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  }
});
app.get("/success/:id", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById(req.user._id, function (err, user) {
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;
      const execute_payment_json = {
        payer_id: payerId,
        transactions: [
          {
            amount: {
              currency: "GBP",
              total: req.params.id,
            },
          },
        ],
      };
      var x = parseInt(req.params.id);
      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        function (error, payment) {
          if (error) {
            console.log(error.response);
            var deposit = {
              amount: x,
              username: req.user.username,
              success: false,
            };
            Deposit.create(deposit, function (err, created) {
              res.redirect("/");
            });
          } else {
            var deposit = {
              amount: x,
              username: req.user.username,
              success: true,
            };
            console.log(JSON.stringify(payment));
            Deposit.create(deposit, function (err, created) {
              user.balance += x;
              user.save();
              res.redirect("/");
            });
          }
        }
      );
    });
  }
});

app.get("/cancel", (req, res) => res.redirect("/"));

app.use(authRoutes);
app.use(adminRoutes);

function compare_item(a, b) {
  // a should come before b in the sorted order
  if (a.time < b.time) {
    return -1;
    // a should come after b in the sorted order
  } else if (a.time > b.time) {
    return 1;
    // and and b are the same
  } else {
    return 0;
  }
}
const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Server has started");
});

var express = require("express");
var mongoXlsx = require('mongo-xlsx');

var router = express.Router();
var User = require("../models/user.js");
var Employee = require("../models/employee.js");
var Category = require("../models/category.js");
var Accumulator = require("../models/accumulator.js");
var League = require("../models/league.js");
var Match = require("../models/match.js");
var Bet = require("../models/bet.js"),
    Withdrawal = require("../models/withdrawals.js"),
    Deposit = require("../models/deposit.js");
var x = 2;
var nodemailer = require("nodemailer");
//bet routes//
// router.get("/admin/download",isAdmin, function(req,res)
// 		  {
// 	Bet.find({},async function(err,bets)
// 			{ var data=[];
// 	 	bets.forEach(function(bet)
// 					{
// 			if(bet.result!=-1)
// 				{var x={Team1:String,Team2:String,BetPlacedOn:String,BetStatus:String,Amount_won_lost:Number,MoneyAwarded:Boolean};
// 					x.Team1 = bet.t1_name;
// 					x.Team2 = bet.t2_name;
// 					if(bet.betOn==1)x.BetPlacedOn=bet.t1_name;else if(bet.betOn==2)x.BetPlacedOn=bet.t2_name;else x.BetPlacedOn="Draw";
// 					if(bet.result==1)x.BetStatus="Won";else if(bet.result==2) x.BetStatus="Void" ;else x.BetStatus="Lost";
//  					if(bet.result!=1)x.Amount_won_lost=bet.amount;else x.Amount_won_lost=(bet.amount*bet.odds).toFixed(2);
// 					x.MoneyAwarded=bet.awarded;
// 					data.push(x);

// 				}
// 		})


// /* Generate Excel */
// setTimeout(function(){var model = mongoXlsx.buildDynamicModel(data);
//  mongoXlsx.mongoData2Xlsx(data, model, function(err, data) {
//   console.log('File saved at:', data.fullPath); 
// 	res.download(data.fullPath);

// 	})
// },2000);})})
router.delete("/bets/:id", function(req, res) {
    Bet.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/mybets");
    })
})
router.delete("/accumulators/:id", function(req, res) {
    Accumulator.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/mybets");
    })
})
router.get("/admin/specials", isSubAdmin, function(req, res) {
    Match.find({
        isSpecial: true
    }, function(err, specials) {
        res.render("admin/specials.ejs", {
            specials: specials
        });
    })
})
router.get("/admin/specials/add", isSubAdmin, function(req, res) {
    res.render("admin/addSpecial.ejs");
})
router.post("/admin/specials", isSubAdmin, function(req, res) {
    req.body.special["isSpecial"] = true;
    Match.create(req.body.special, function(err, created) {
        var time = req.body.date + " " + req.body.time + " GMT";
        var date = new Date(time);
        created.time = date;
        created.save();
        res.redirect("/admin/specials");

    })
})
router.get("/admin/specials/:id/edit", isSubAdmin, function(req, res) {
    Match.findById(req.params.id, function(err, special) {
        if (special.status == "NS")
            res.render("admin/updateSpResult.ejs", {
                special: special
            });
        else
            res.redirect("/admin/specials");
    })

})
router.get("/admin/specials/edit/:id", isSubAdmin, function(req, res) {
    Match.findById(req.params.id, function(err, match) {
        res.render("admin/editSpecial.ejs", {
            special: match
        });

    })

})
router.put("/admin/specials/edit/:id", isSubAdmin, function(req, res) {
    Match.findByIdAndUpdate(req.params.id, req.body.special, function(err, updated) {

        var time = req.body.date + " " + req.body.time + " GMT";
        var date = new Date(time);
        updated.time = date;
        updated.save();
        res.redirect("/admin/specials");
    })
})
router.put("/admin/specials/:id", isSubAdmin, function(req, res) {
    var obj = {
        status: "F",
        winner: req.body.winner
    };

    Match.findByIdAndUpdate(req.params.id, obj, function(err, updated) {})
    setTimeout(function() {
        Match.findById(req.params.id).populate("bets").exec(function(err, found) {
            found.bets.forEach(function(bet) {
                if (found.winner == bet.betOn) bet.result = 1;
                else bet.result = 0;
                bet.save();
            })


        })
    }, 500);
    setTimeout(function() {
        res.redirect("/admin/specials");
    }, 2000);
})
router.get("/specials", function(req, res) {
    Match.find({
        isSpecial: true
    }, function(err, specials) {
        if (req.isAuthenticated()) {
            User.findById(req.user._id, function(err, user) {
                res.render("specials.ejs", {
                    specials: specials,
                    user: user
                });
            })
        } else
            res.render("specials.ejs", {
                specials: specials
            });


    })
})
router.get("/specials/:id/bet", function(req, res) {
    User.findById(req.user._id, function(err, user) {


        Match.findById(req.params.id, function(err, special) {
            res.render("placeSpecial.ejs", {
                special: special,
                user: user
            });
        })
    })
})

router.get("/admin/specials/delete", isAdmin, function(req, res) {
    Match.find({
        isSpecial: true
    }, function(err, matches) {
        res.render("admin/deleteSpecials.ejs", {
            matches: matches
        });
    })

})
router.delete("/admin/specials", isAdmin, function(req, res) {
    Match.deleteMany({
            _id: {
                $in: req.body.del
            }
        },
        function(err, result) {
            if (err) {
                res.redirect("/admin/specials");
            } else {
                res.redirect("/admin/specials");
            }
        }
    );
});

router.get("/admin/stats", isAdmin, function(req, res) {
    Deposit.find({}, function(err, deposits) {
        Withdrawal.find({}, function(err, withdrawals) {
            Bet.find({}, function(err, bets) {
                User.find({}).populate("bets").exec(function(err, users) {
                    Match.find({}, function(err, matches) {
                        res.render("admin/stats.ejs", {
                            deposists: deposits,
                            withdrawals: withdrawals,
                            bets: bets,
                            users: users,
                            matches: matches
                        });
                    })

                })
            })
        })
    })
})

router.get("/admin/matches/delete", isAdmin, function(req, res) {
    Match.find({
        isSpecial: false
    }, function(err, matches) {
        res.render("admin/deleteMatches.ejs", {
            matches: matches
        });
    })

})
router.delete("/admin/matches", isAdmin, function(req, res) {
    Match.deleteMany({
            _id: {
                $in: req.body.del
            }
        },
        function(err, result) {
            if (err) {
                res.redirect("/admin/matches");
            } else {
                res.redirect("/admin/matches");
            }
        }
    );
});

router.delete("/admin/withdrawals/:id", isAdmin, function(req, res) {
    Withdrawal.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/admin/withdrawals");
    })
})
router.delete("/admin/deposits/:id", isAdmin, function(req, res) {
    Deposit.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/admin/deposits");
    })
})

router.get("/admin/withdrawals", isAdmin, function(req, res) {
    Withdrawal.find({}, function(err, withdrawals) {
        res.render("admin/withdrawals.ejs", {
            withdrawals: withdrawals
        })
    })
})
router.get("/admin/deposits", isAdmin, function(req, res) {
    Deposit.find({}, function(err, deposits) {
        res.render("admin/deposits.ejs", {
            deposits: deposits
        });
    })
})

router.get("/leagues/:id", function(req, res) {

    League.findById(req.params.id).populate("matches").exec(function(err, league) {
        if (!req.isAuthenticated())
            res.render("league.ejs", {
                league: league
            });
        else {
            User.findById(req.user._id, function(err, user) {
                league.matches.sort(compare_item);
                league.save();
                res.render("league.ejs", {
                    league: league,
                    user: user
                });
            })
        }
    })
})
router.get("/withdraw", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        res.render("withdraw.ejs", {
            user: user
        });
    })
})
router.post("/withdraw", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        if (req.body.amount > user.balance)
            return res.redirect("/");
        else {
            user.balance = user.balance - req.body.amount;

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
                to: 'rajecerasystem@gmail.com',
                subject: 'Withdrawal Request',
                text: 'Hey Admin, ' + user.fname + " " + user.lname + ' has requested to withdraw Euro ' + req.body.amount + ' from his wallet\n Here are his account details of PayPal:-' + req.body.details

            };


            var withdrawal = {
                amount: req.body.amount,
                username: req.user.username,
                paypal: req.body.details
            };
            Withdrawal.create(withdrawal, function(err, created) {
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                        user.save();
                        req.flash("success", "Successfully placed a withdrawal request");
                        res.redirect("/");
                    } else {
                        console.log('Email sent: ' + info.response);
                        user.save();
                        res.redirect("/");
                    }
                })


            });

        }
    })
})
router.get("/admin/accumulators/:id", isAdmin, function(req, res) {
    Accumulator.findById(req.params.id).populate("bets").exec(function(err, accumulator) {
        res.render("admin/singleACM.ejs", {
            accumulator: accumulator
        });
    })
})
router.get("/admin/accumulators", isAdmin, function(req, res) {
    Accumulator.find({
        payment: true,
        disp: true
    }).populate("bets").exec(function(err, accumulators) {
        res.render("admin/accumulators.ejs", {
            accumulators: accumulators
        });
    })
})
router.get("/mybets", isLoggedIn, function(req, res) {
    User.findById(req.user._id).populate("bets").populate("accumulators").exec(function(err, user) {
        res.render("mybets.ejs", {
            bets: user.bets.reverse(),
            user: user,
            accumulators: user.accumulators
        });
    })
})
router.post("/admin/accumulators/update", function(req, res) {
    Accumulator.updateMany({
            _id: {
                $in: req.body.del
            }
        }, {
            disp: false
        },
        function(err, result) {
            if (err) {
                res.redirect("/admin/accumulators");
            } else {
                res.redirect("/admin/accumulators");
            }
        }
    );
})
router.post("/specials/:id/bet", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, updated) {
        if (updated.balance < req.body.amount) return res.redirect("/deposit");

        Match.findById(req.params.id, function(err, match) {
            if (match.maxbet != -1 && req.body.amount > match.maxbet) {
                req.flash("error", "Maximum bet for this special is GBP " + match.maxbet);
                return res.redirect("/specials/" + req.params.id + "/bet");
            }

            var odds;
            odds = match.t1_odds;
            var bet = {
                desc: match.desc,
                odds: odds,
                amount: req.body.amount,
                betOn: 1,
                isSpecial: true
            };
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
                to: updated.username,
                subject: 'Bet Confirmation',
                html: "<p>Hey There, <br> This is a confirmation email regarding the special bet you placed on " + match.desc + ". We wish you the best. Thank you for using BetVal</p>"
            };

            transporter.sendMail(mailOptions, function(error) {
                if (error) {
                    console.log('error:', error);
                } else {
                    console.log('good');
                }
            });
            Bet.create(bet, function(err, created) {
                match.bets.push(created);
                match.save();
                updated.bets.push(created);
                updated.balance = updated.balance - req.body.amount;
                updated.save();
                req.flash("success", "Successfully placed a bet on the special.");
                res.redirect("/");
            })
        })

    })

})
router.get("/matches/:id/bet", isLoggedIn, function(req, res) {
    Match.findById(req.params.id, function(err, match) {
        var date = new Date();
        date.setMinutes(date.getMinutes() + 3);
        if (match.time < date) return res.redirect("/");
        User.findById(req.user._id, function(err, user) {
            res.render("placeBet.ejs", {
                match: match,
                user: user
            });
        })

    })
})
router.post("/matches/:id/bet", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, updated) {
        if (updated.balance < req.body.amount) return res.redirect("/deposit");

        Match.findById(req.params.id, function(err, match) {
            var odds;
            if (match.maxbet != -1 && req.body.amount > match.maxbet) {
                req.flash("error", "Maximum bet amount for this match is GBP " + match.maxbet);
                return res.redirect("/matches/" + req.params.id + "/bet");
            }


            if (req.body.betOn == 1) odds = match.t1_odds;
            if (req.body.betOn == 2) odds = match.t2_odds;
            if (req.body.betOn == 3) odds = match.d_odds;
            var bet = {
                t1_name: match.t1_name,
                t2_name: match.t2_name,
                odds: odds,
                amount: req.body.amount,
                betOn: req.body.betOn
            };
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
                to: updated.username,
                subject: 'Bet Confirmation',
                html: "<p>Hey There, <br> This is a confirmation email regarding the bet you placed on " + match.t1_name + " VS " + match.t2_name + ". We wish you the best. Thank you for using BetVal</p>"
            };

            transporter.sendMail(mailOptions, function(error) {
                if (error) {
                    console.log('error:', error);
                } else {
                    console.log('good');
                }
            });
            Bet.create(bet, function(err, created) {
                match.bets.push(created);
                match.save();
                updated.balance = updated.balance - req.body.amount;
                updated.bets.push(created);
                updated.save();
                req.flash("success", "Successfully placed a bet!!!!");
                res.redirect("/");
            })
        })

    })

})
router.get("/admin", isSubAdmin, function(req, res) {
    Deposit.find({}, function(err, deposits) {
        Withdrawal.find({}, function(err, withdrawals) {
            User.count({}, function(err, users) {
                Bet.count({
                    result: 1
                }, function(err, win_bets) {
                    Bet.count({
                        amount: 0,
                        result: 1
                    }, function(err, acm_w) {
                        Bet.count({
                            amount: 0,
                            result: 0
                        }, function(err, acm_l) {



                            Bet.count({
                                result: 0
                            }, function(err, lost_bets) {
                                Accumulator.count({
                                    payment: true
                                }, function(err, accumulators) {

                                    Accumulator.count({
                                        status: "Won"
                                    }, function(err, wonacm) {
                                        Accumulator.count({
                                            status: "Lost"
                                        }, function(err, lostacm) {
                                            Match.count({}, function(err, matches) {
                                                League.count({}, function(err, leagues) {
                                                    Category.count({}, function(err, categories) {
                                                        res.render("admin/dashboard.ejs", {
                                                            win_bets: win_bets,
                                                            lost_bets: lost_bets,
                                                            acm_w: acm_w,
                                                            acm_l: acm_l,
                                                            deposists: deposits,
                                                            withdrawals: withdrawals,
                                                            leagues: leagues,
                                                            categories: categories,
                                                            matches: matches,
                                                            users: users,
                                                            accumulators: accumulators,
                                                            wonacm: wonacm,
                                                            lostacm: lostacm,

                                                        });
                                                    })
                                                })
                                            })



                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })

        })
    })

})
router.get("/football", function(req, res) {
    League.find({}).populate("matches").exec(function(err, leagues) {
        if (req.isAuthenticated()) {
            User.findById(req.user._id, function(err, user) {
                res.render("football.ejs", {
                    user: user,
                    leagues: leagues
                });
            })
        } else
            res.render("football.ejs", {
                leagues: leagues
            })

    })



})

// user routes //
router.get("/admin/employees", isAdmin, function(req, res) {

    Employee.find({}, function(err, found) {
        res.render("admin/employees.ejs", {
            employees: found
        });
    })
})


router.get("/admin/addEmployee", isAdmin, function(req, res) {
    res.render("admin/addEmployee.ejs");
});

router.post("/admin/employees", isAdmin, function(req, res) {
    var adminaccess = false;
    if (req.body.isAdmin == "Yes")
        adminaccess = true;
    var newUser = {
        employeename: req.body.employeename,
        balance: req.body.balance,
        isAdmin: adminaccess,
        fname: req.body.fname,
        lname: req.body.lname
    };
    Employee.create(newUser, function(err, created) {
        res.redirect("/admin/employees");
    })
})

// user routes //
router.get("/admin/users", isAdmin, function(req, res) {


    User.find({}, function(err, found) {
        res.render("admin/users.ejs", {
            users: found
        });
    })
})

router.get("/admin/addUser", isAdmin, function(req, res) {
    res.render("admin/addUser.ejs");
});



router.post("/admin/users", isAdmin, function(req, res) {
    var adminaccess = false;
    if (req.body.isAdmin == "Yes")
        adminaccess = true;
    var newUser = {
        username: req.body.username,
        balance: req.body.balance,
        isAdmin: adminaccess,
        fname: req.body.fname,
        lname: req.body.lname
    };
    User.create(newUser, function(err, created) {
        res.redirect("/admin/users");
    })
})



router.get("/admin/users/:id/edit", isAdmin, function(req, res) {
    User.findById(req.params.id, function(err, user) {
        res.render("admin/editUser.ejs", {
            user: user
        });
    });
});
router.put("/admin/users/:id", isAdmin, function(req, res) {
    var x = req.body.user;
    if (x["isAdmin"] == "Yes") x["isAdmin"] = true;
    else x["isAdmin"] = false;
    User.findByIdAndUpdate(req.params.id, x, function(err, updated) {
        res.redirect("/admin/users");
    })
})
router.delete("/admin/users/:id", isAdmin, function(req, res) {
        User.findByIdAndRemove(req.params.id, function(err) {
            res.redirect("/admin/users");
        })
    })
    //category routes
router.get("/admin/categories", isAdmin, function(req, res) {
    Category.find({}).populate("leagues").exec(function(err, found) {
        res.render("admin/categories.ejs", {
            categories: found
        });
    })
})
router.get("/admin/addCategory", isAdmin, function(req, res) {
    res.render("admin/addCategory.ejs");
});
router.post("/admin/categories", isAdmin, function(req, res) {
    var newCat = {
        name: req.body.name,
        logo: req.body.logo
    };
    Category.create(newCat, function(err, created) {
        res.redirect("/admin/categories");
    })
})
router.get("/admin/categories/:id/edit", isAdmin, function(req, res) {
    Category.findById(req.params.id, function(err, user) {
        res.render("admin/editCategory.ejs", {
            category: user
        });
    });
});
router.put("/admin/categories/:id", isAdmin, function(req, res) {
    Category.findByIdAndUpdate(req.params.id, req.body.category, function(err, updated) {
        res.redirect("/admin/categories");
    })
})
router.delete("/admin/categories/:id", isAdmin, function(req, res) {
        Category.findByIdAndRemove(req.params.id, function(err) {
            res.redirect("/admin/categories");
        })
    })
    // League Routes
router.get("/admin/leagues", isAdmin, function(req, res) {
    League.find({}).populate("matches").exec(function(err, found) {
        res.render("admin/leagues.ejs", {
            leagues: found
        });
    })
})
router.get("/admin/addLeague", isAdmin, function(req, res) {
    Category.find({}, function(err, found) {
        res.render("admin/addLeague.ejs", {
            categories: found
        });

    })
});
router.post("/admin/leagues", isAdmin, function(req, res) {
    var newLeague = {
        name: req.body.name,
        logo: req.body.logo
    };
    League.create(newLeague, function(err, created) {
        Category.findOne({
            name: req.body.category
        }, function(err, cat) {
            cat.leagues.push(created);
            cat.save();
            res.redirect("/admin/leagues");
        })
    })
})
router.get("/admin/leagues/:id/edit", isAdmin, function(req, res) {
    League.findById(req.params.id, function(err, user) {
        res.render("admin/editLeague.ejs", {
            league: user
        });
    });
});
router.put("/admin/leagues/:id", isAdmin, function(req, res) {
    League.findByIdAndUpdate(req.params.id, req.body.category, function(err, updated) {
        res.redirect("/admin/leagues");
    })
})
router.delete("/admin/leagues/:id", isAdmin, function(req, res) {
    League.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/admin/leagues");
    })
})

//match routes
router.get("/admin/matches", isSubAdmin, function(req, res) {



    Match.find({
        isSpecial: false
    }, function(err, found) {

        res.render("admin/matches.ejs", {
            matches: found
        });



    })
})
router.get("/admin/matches/addMatch", isSubAdmin, function(req, res) {
    League.find({}, function(err, leagues) {
        res.render("admin/addMatch.ejs", {
            leagues: leagues
        });
    })

})
router.post("/admin/matches", isSubAdmin, function(req, res) {
    Match.create(req.body.match, function(err, created) {
        if (req.body.display == "true")
            created.display = true;
        else created.display = false;
        var time = req.body.date + " " + req.body.time + " GMT";
        var date = new Date(time);
        created.time = date;
        created.save();
        League.findOne({
            name: req.body.league
        }, function(err, league) {

            league.matches.push(created);
            league.save();
            res.redirect("/admin/matches");
        })
    })
})
router.get("/admin/matches/:id/edit", isSubAdmin, function(req, res) {
    Match.findById(req.params.id, function(err, match) {
        if (match.status == "NS")
            res.render("admin/updateResult.ejs", {
                match: match
            });
        else
            res.redirect("/admin/matches");
    })

})
router.get("/admin/matches/edit/:id", isSubAdmin, function(req, res) {
    Match.findById(req.params.id, function(err, match) {
        res.render("admin/editMatch.ejs", {
            match: match
        });

    })

})
router.put("/admin/matches/edit/:id", isSubAdmin, function(req, res) {
    if (req.body.display == "true")
        req.body.match.display = true;
    else req.body.match.display = false;
    Match.findByIdAndUpdate(req.params.id, req.body.match, function(err, updated) {

        var time = req.body.date + " " + req.body.time + " GMT";
        var date = new Date(time);
        updated.time = date;
        updated.save();
        res.redirect("/admin/matches");
    })
})
router.put("/admin/matches/:id", isSubAdmin, function(req, res) {
    var obj = {
        status: "F",
        winner: req.body.winner
    };

    Match.findByIdAndUpdate(req.params.id, obj, function(err, updated) {
        console.log("updated");
    })
    setTimeout(function() {
        Match.findById(req.params.id).populate("bets").exec(function(err, found) {
            found.bets.forEach(function(bet) {
                console.log(bet.betOn);
                console.log(found);
                if (found.winner == bet.betOn) bet.result = 1;
                else bet.result = 0;
                bet.save();
            })


        })
    }, 500);
    setTimeout(function() {
        res.redirect("/admin/matches");
    }, 2000);
})
router.delete("/admin/matches/:id", isAdmin, function(req, res) {
    Match.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/admin/matches");
    })
})
router.post("/admin/matches/cancel/:id", isSubAdmin, function(req, res) {
    var obj = {
        status: "F",
        winner: 4
    };

    Match.findByIdAndUpdate(req.params.id, obj, function(err, updated) {
        console.log("updated");
    })
    setTimeout(function() {
        Match.findById(req.params.id).populate("bets").exec(function(err, found) {
            found.bets.forEach(function(bet) {
                bet.result = 2;
                bet.save();
            })

        })
    }, 500);
    setTimeout(function() {
        res.redirect("/admin/matches");
    }, 2000);
})

router.get("/accumulators", isLoggedIn, function(req, res) {
    User.findById(req.user._id).populate("accumulators").exec(function(err, user) {
        res.render("accumulator.ejs", {
            user: user
        });
    })
})
router.post("/accumulators/:id/payment", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        if (user.balance < req.body.amount)
            res.redirect("/deposit");
        else {
            Accumulator.findByIdAndUpdate(req.params.id, {
                payment: true,
                amount: req.body.amount
            }, function(err, accumulator) {
                user.balance -= req.body.amount;
                user.save();
                req.flash("success", "Successfully completed payment for the accumulator.");
                res.redirect("/accumulators");
            })
        }
    })
})

router.post("/accumulators", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        Accumulator.create({
            name: req.body.name,
            username: user.username
        }, function(err, created) {
            user.accumulators.push(created);
            user.save();
            res.redirect("/accumulators/" + created._id);
        })
    })
})
router.post("/accumulator/:id/bet/:id1/:id2", isLoggedIn, function(req, res) {
    Accumulator.findById(req.params.id, function(err, accumulator) {
        if (accumulator.bets.length > 11) {
            res.redirect("/accumulators/" + accumulator._id);
        } else {
            Match.findById(req.params.id1, function(err, match) {

                if (req.params.id2 == 1) odds = match.t1_odds;
                if (req.params.id2 == 2) odds = match.t2_odds;
                if (req.params.id2 == 3) odds = match.d_odds;
                var bet = {
                    t1_name: match.t1_name,
                    t2_name: match.t2_name,
                    odds: odds,
                    amount: 0,
                    betOn: req.params.id2,
                    isAcm: true,
                    match: match
                };
                Bet.create(bet, function(err, bet) {
                    match.bets.push(bet);
                    match.save();
                    accumulator.bets.push(bet);
                    accumulator.odds *= bet.odds;
                    accumulator.matches.push(match);
                    accumulator.save();
                    res.redirect("/accumulators/" + accumulator._id);
                })
            })
        }
    })
})
router.get("/accumulators/:id", isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        Match.find({
            status: "NS",
            isSpecial: false
        }, function(err, match) {
            Accumulator.findById(req.params.id).populate("bets matches").exec(function(err, accumulator) {
                if (accumulator.payment == true)
                    res.render("singleACM2.ejs", {
                        user: user,
                        accumulator: accumulator
                    })
                else {
                    res.render("singleACM.ejs", {
                        user: user,
                        matches: match,
                        accumulator: accumulator
                    });
                }
            })
        })
    })
})

router.delete("/accumulators/:id/bet/:id1", function(req, res) {
    Accumulator.findById(req.params.id).populate("matches").exec(function(err, accumulator) {
        Bet.findById(req.params.id1).populate("match").exec(async function(err, bet) {
            accumulator.odds /= bet.odds;
            accumulator.save();
            Bet.findByIdAndRemove(bet._id, function(err) {
                res.redirect("/accumulators/" + accumulator._id);
            })
        })
    })
})
router.delete("/accumulators/:id", isLoggedIn, function(req, res) {
    Accumulator.findByIdAndRemove(req.params.id, function(err) {
        res.redirect("/accumulators");
    })
})


function isAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, function(err, user) {
            if (user.isAdmin) return next();
            else if (user.isSubAdmin) {
                req.flash("error", "You don't have permission to do that");
                return res.redirect("/admin", )
            } else res.redirect("/");
        })
    } else
        res.redirect("/login");

}

function isSubAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        User.findById(req.user._id, function(err, user) {
            if (user.isAdmin || user.isSubAdmin) return next();
            else res.redirect("/");
        })
    } else
        res.redirect("/login");

}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect("/login");
}

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
module.exports = router;
var nodemailer = require('nodemailer');
const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs')
const multer = require('multer')
const app = express()

const https = require('https');
const path1 =require ('path');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(bodyParser.json())

const sslServer = https.createServer (
  {
  key: fs.readFileSync(path1.join(__dirname, 'cert', 'key.pem')),
  cert : fs.readFileSync(path1.join(__dirname, 'cert', 'cert.pem')),
  },
  app
)


var to;
var subject;
var body;
var path

var Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./images");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
    storage: Storage
}).single("image"); //Field name and max count

app.get('/',(req,res) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/sendemail',(req,res) => {
    upload(req,res,function(err){
        if(err){
            console.log(err)
            return res.end("Something went wrong!");
        }else{
            to = req.body.to
            subject = req.body.subject
            body = req.body.subject
            path = req.file.path
            console.log(to)
            console.log(subject)
            console.log(body)
            console.log(req.file)
            console.log(req.files)
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'sales.ecerasystem@gmail.com',
                  pass: 'hydjjfozloceecqe'
                }
              });
              
              var mailOptions = {
                from: 'sales.ecerasystem@gmail.com',
                to: to,
                subject:subject,
                text:body,
                attachments: [
                  {
                   path: path
                  }
               ]
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                  fs.unlink(path,function(err){
                    if(err){
                        return res.end(err)
                    }else{
                        console.log("deleted")
                        return res.redirect('/result.html')
                    }
                  })
                }
              });
        }
    })
})

sslServer.listen(3443,() => console.log("App started on Port 3443"))

var mysql = require('mysql');
var config = require('./config')
var con = mysql.createConnection({
  host    : '127.0.0.1',
  user    : 'owenyhae_owen',
  password: '',
  database: 'owenyhae_capstone'
});

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.json());

var router = express.Router();

var port = process.env.PORT || 8080;

// POST http://localhost:8080/api/users

// parameters sent with
router.post('/postUsers', function(req, res) {

    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var type = req.body.type;

    console.log('post ' + username);
    console.log('post ' + password);
    console.log('post ' + email);

     con.connect(function(err) {
       if (err) throw err;
       console.log("Connected!");
       //Insert a record in the "customers" table:
       var sql = "INSERT INTO users (name,password,email,type) VALUES ('" + username + "', '" + password + "', '" + email + "', '" + type + "')";
       con.query(sql, function (err, result) {
         if (err) throw err;
         console.log("1 record inserted");
       });
     });

});

// routes will go here

router.get('/getUsers', function(req, res) {
    res.json({password: "privacy"});

  });

app.use('/api', router);


// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);

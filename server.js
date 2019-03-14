var mysql = require('mysql');
//var config = require('./config')
var con = mysql.createConnection({
  host    : '127.0.0.1',
  user    : 'owenyhae',
  password: 'Roksa4123!cp',
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

function connectDB(){
  if(con.state==='disconnected'){
    con.connect(function(err) {
      if (err) throw err;
      console.log("DB Connection Success");
    });
  }
}

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

    connectDB();

    var sql = "INSERT INTO users (name,password,email,type) VALUES ('" + username + "', '" + password + "', '" + email + "', '" + type + "')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 user created");
    //  alert("Account Created!");
    });

});

// routes will go here
router.get('/getEmailExists', function(req, res){
    var email = req.param('email');
    console.log("Received: " + email);

    connectDB();

    var sql = "SELECT * FROM users WHERE email='" + email + "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Account Found.");
          res.json({
            accountExists: 1,
            firstName: result[0].name
          });
      } else {
        console.log("No Account Found.");
        res.json({
          accountExists: 0,
          firstName: ''
        });
      }
    });
});

router.get('/signIn', function(req, res){
  var email = req.param('email');
  var password = req.param('password');
  console.log("Received: " + email + ', ' + password);

  connectDB();

  var sql = "SELECT name, type FROM users WHERE email='" + email + "' AND password='" + password + "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.json({
      accountExists: result.length!=0,
      type: result[0].type,
      firstName: result[0].name
    });
  });
});


// routes will go here
router.get('/getServicePreviews', function(req, res){
    //var email = req.param('email');
    //console.log("Received: " + email);
    connectDB();

    var sql = "SELECT * FROM services";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Services Found");
          res.json({
            servicePreviews: result
          });
      } else {
        console.log("No Services Found");

      }
    });
});

router.get('/getServiceInfo', function(req, res){
    //var email = req.param('email');
    //console.log("Received: " + email);
    connectDB();
    var id = req.param('service');
    var sql = "SELECT * FROM services WHERE id=" + id;
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Services Found");
          res.json({
            serviceInfo: result
          });
      } else {
        console.log("No Services Found");

      }
    });
});


app.use('/api', router);
// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);

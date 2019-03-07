var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.json());

var port = process.env.PORT || 8080;

// POST http://localhost:8080/api/users
// parameters sent with 
app.post('/api/users', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    console.log(username);
    console.log(password);
    
    res.send(username + ' ' + password);
});

// routes will go here
app.get('/api/users', function(req, res) {
    var username = req.param('username');
    var password = req.param('password');
    
    console.log(username);
    console.log(password);
  
    res.send(username + ' ' + password);
  });

// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);
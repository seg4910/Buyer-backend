var mysql = require('mysql');
//var config = require('./config')
var con = mysql.createConnection({
  host    : '127.0.0.1',
  user    : 'owenyhae',
  password: 'Roksa4123!cp',
  database: 'owenyhae_capstone'
});

const multer = require('multer')
var stripe = require("stripe")("sk_test_guejfZRO6qW0hAQ1ZZawcWLu00cENZq563");
var express = require('express');
var cloudinary = require('cloudinary');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.json());

cloudinary.config({
  cloud_name: 'dwx46un2p',
  api_key: '779422868541215',
  api_secret: '2N7lYlIQ5ARTECYoG7LsTC2dU5Q'
});

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

const Storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './images')
  },
  filename(req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`)
  },
})

const upload = multer({ storage: Storage })

router.post('/uploadImage', upload.array('photo', 3), (req, res) => {
  console.log('file', req.files)
  console.log('body', req.body)
  res.status(200).json({
    message: 'success!',
  })
})

connectDB();

// make purchase
router.post('/purchaseService', function(req, res) {

  var serviceId = req.body.serviceId;
  var userId = req.param('id');
  var sellerId = req.body.sellerId;
  var sellerName = req.body.sellerName;
  var serviceName = req.body.serviceName;
  var serviceCategory = req.body.serviceCategory;
  var serviceDescription = req.body.serviceDescription;
  var minPrice = req.body.minPrice;
  var maxPrice = req.body.maxPrice;

  console.log(sellerId);

var date = new Date().toISOString().slice(0, 19).replace('T', ' ');


  stripe.charges.create({
    amount: 2000,
    currency: "cad",
    source: "tok_amex", // obtained with Stripe.js
    description: "Charge for jenny.rosen@example.com"
  }, function(err, charge) {

    var sql = "INSERT INTO orders (sellerId, buyerId, serviceId, dateOrdered, price, serviceCategory, sellerName) VALUES ('" + sellerId + "', '" + userId + "', '" + serviceId + "', '" + date + "', '" + maxPrice + "', '" + serviceCategory + "', '" + sellerName + "')";
    console.log(sql);

    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Service Order Added")
    });
  });
});


// get stripe customer
router.post('/newCardStripe', function(req, res) {

  console.log('here1');
  var cusID = req.param('id');
  var token = req.param('token');
  console.log(token);
  console.log('here');
  var sql = "SELECT stripeCusId FROM users WHERE id='" + cusID + "'";
  var stripeCusId = '';

  con.query(sql, function (err, result) {
    if (err) throw err;
    stripeCusId = result[0].stripeCusId;
    console.log(token[0]);
    stripe.customers.createSource(
      stripeCusId,
      { source: token },
      function(err, card) {
        console.log(card);// asynchronously called
        console.log(err);
      }
    );
  });
});

// get stripe customer
router.get('/getStripeCustomer', function(req, res) {

  var cusID = req.param('id');
  //console.log(cusID);
  //retreive a customer and their payment info from stripeCusId
  var sql = "SELECT stripeCusId FROM users WHERE id='" + cusID + "'";
  var stripeCusId = '';

  con.query(sql, function (err, result) {
    if (err) throw err;
    stripeCusId = result[0].stripeCusId;
    stripe.customers.retrieve(
      stripeCusId,
      function(err, customer) {
        console.log(customer.sources.data);
        res.json({
          stripeCustomerCards: customer.sources.data
        });
      }
    );
  });
});

// create location
router.get('/createLocation', function(req, res){
  var userId = req.param('userId');
  var streetNumber = req.param('streetNumber');
  var streetName = req.param('streetName');
  var city = req.param('city');
  var province = req.param('province');
  var postalCode = req.param('postalCode');


  console.log(userId);

  var sql = "INSERT INTO location (userId, streetNumber, streetName, city, province, postalCode) VALUES ('" + userId + "', '" + streetNumber + "', '" + streetName + "', '" + city + "', '" + province + "', '" + postalCode + "')";
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Location added!")
  });

})

// create user to db
router.get('/createUser', function(req, res) {
    var email = req.param('email');
    var name = req.param('name');
    var password = req.param('password');
    var type = req.param('type');


    // post a new user to the database
    var sql = "INSERT INTO users (name,password,email,type) VALUES ('" + name + "', '" + password + "', '" + email + "', " + type + ")";
    con.query(sql, function (err, result) {
      if (err) throw err;

      // get the id of the newly registered user
      var sql2 = "SELECT LAST_INSERT_ID() AS userId";
      con.query(sql2, function (err, result2) {
        if (err) throw err;
        var userId = result2[0].userId

        //create a customer within stripe for payments
        console.log('attempting to create customer');
        stripe.customers.create({
          description: 'Customer for' + name,
          email: email,
          source: "tok_amex" // obtained with Stripe.js
        }, function(err, customer) {
          console.log(customer);
          var cusStripeID = customer.id

          // update the user in the database to add their new stripe id
           var sql = "UPDATE users SET stripeCusId ='" + cusStripeID + "' WHERE id='" + userId + "'";
           console.log(sql);
           con.query(sql, function (err, result) {
             if (err) throw err;
             console.log('added stripe id');
           });
        });
        console.log(userId);
        res.json({
          userId: userId
        })
      });
    });
});

//edit a field
router.post('/editField', function(req, res){
  var userId = req.body.userId;
  var fieldType = req.body.fieldType;
  var fieldValue = req.body.fieldValue;


  var sql = "UPDATE users SET " + fieldType + "='" + fieldValue + "' WHERE id=" + userId;
  console.log(sql)
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Field Updated");
  });
})

// post service to db
router.post('/postService', function(req, res) {

    var sellerId = req.body.sellerId;
    var sellerName = req.body.sellerName;
    var serviceName = req.body.serviceName;
    var serviceCategory = req.body.serviceCategory;
    var serviceDescription = req.body.serviceDescription;
    var minPrice = req.body.minPrice;
    var maxPrice = req.body.maxPrice;
    var city = '';

    var sql = "SELECT city FROM location WHERE userId=" + sellerId;
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Location found");
        city = result[0].city;
        console.log(city);
        var sql = "INSERT INTO services (sellerID,sellerName,serviceName,serviceCategory,serviceDescription,city,minPrice,maxPrice) VALUES ('" + sellerId + "', '" + sellerName + "', '" + serviceName + "', '" + serviceCategory + "', '" + serviceDescription + "', '" + city + "', '" + minPrice +"', '" + maxPrice +"')";
        console.log(sql);
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("1 service created");
        //  alert("Account Created!");
        });
      }
    });

});


// routes will go here
router.get('/getEmailExists', function(req, res){
    var email = req.param('email');
    console.log("Received: " + email);


    var sql = "SELECT * FROM users WHERE email='" + email + "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Account Found.");
          res.json({
            accountExists: 1,
            firstName: result[0].name,
            id: result[0].id
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

router.get('/getSellerName', function(req, res){
    var id = req.param('id');
    console.log("Received id: " + id);


    var sql = "SELECT sellerName FROM users WHERE id='" + id + "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      console.log(result[0].name);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("SellerName Found");
          res.json({
            sellerName: result[0].sellerName,
          });
      } else {
        console.log("No Account Found.");
      }
    });
});

router.get('/getAccountInfo', function(req, res){
    var id = req.param('id');
    console.log("Received id: " + id);


    var sql = "SELECT * FROM users WHERE id='" + id + "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      console.log(result[0].name);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Account Found.");
          res.json({
            name: result[0].name,
            email: result[0].email,
            password: result[0].password,
          });
      } else {
        console.log("No Account Found.");
      }
    });
});


router.get('/signIn', function(req, res){
  var email = req.param('email');
  var password = req.param('password');
  console.log("Received: " + email + ', ' + password);


  var sql = "SELECT id, name, type FROM users WHERE email='" + email + "' AND password='" + password + "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.json({
      accountExists: result.length!=0,
      type: result[0].type,
      firstName: result[0].name,
      id: result[0].id,
    });
  });
});


// routes will go here
router.get('/getServicePreviews', function(req, res){
    //var email = req.param('email');
    //console.log("Received: " + email);

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


// routes will go here
router.get('/getMyServicePreviews', function(req, res){
    var id = req.param('id');
    console.log("Received id: " + id);

    var sql = "SELECT * FROM services WHERE sellerID='" + id + "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Services Found");
          res.json({
            servicePreviews: result,
            serviceExists: 1,
          });
      } else {
        console.log("No Services Found");
        res.json({
          serviceExists: 0,
        });
      }
    });
});

// routes will go here
router.get('/getMyOrders', function(req, res){
    var id = req.param('id');
    console.log("Received id: " + id);

    var sql = "SELECT * FROM orders WHERE buyerId='" + id + "'";
    console.log(sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      //console.log(result);

      if (result[0] !== null && result[0] !== undefined) {
          console.log("Orders Found");
          res.json({
            orders: result,
            ordersExist: true
          });

      } else {
        console.log("No Orders Found");
        res.json({
          orders: null,
          ordersExist: false
        });
      }
    });
});

// create location
router.get('/viewOrder', function(req, res){

  var orderId = req.param('id');
  var sql = "SELECT * FROM orders WHERE id='" + orderId + "'";
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result);
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Order Found.");
        res.json({
          order: result
        });
    } else {
      console.log("No Order Found.");
      res.json({
        order: null
      });
    }
  });
})

// create location
router.get('/cancelOrder', function(req, res){

  var orderId = req.param('id');
  var sql = "DELETE FROM orders WHERE id='" + orderId + "'";
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) { throw err } else { console.log("Canceled Service"); }
  });
})

router.post('/addSellerName', function(req, res){
  var userId = req.param('id');
  var sellerName = req.param('sellerName');


  console.log(userId);

  var sql = "UPDATE users SET sellerName='" + sellerName + "' WHERE id='" + userId + "'";
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(err);
    console.log("Seller name added")
  });

})

router.get('/getServiceInfo', function(req, res){
    //var email = req.param('email');
    //console.log("Received: " + email);
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

var mysql = require('mysql');
var fs = require('fs');


//var config = require('./config')
 var con = mysql.createConnection({
  host    : 'db-mysql-nyc1-23316-do-user-6507550-0.db.ondigitalocean.com',
  user    : 'owenadley',
  password: 'm2anpro10t7cl7lr',
  database: 'defaultdb',
  port: 25060,
  ssl: {
    ca : fs.readFileSync('./ca-certificate.crt')
  }
});

//var connectionString = "mysql://doadmin:cjd7mheqntz9e8mr@db-mysql-nyc1-23316-do-user-6507550-0.db.ondigitalocean.com:25060/defaultdb?ssl-mode=REQUIRED";
//var con= mysql.createConnection(connectionString); 



const multer = require('multer')
var stripe = require("stripe")("sk_test_fTlfHnvlI6jfS34mU7Prokqq00X4ultmWL");
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

connectDB();


// image upload processing to backend directory
var imgPath = '';
 const Storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './images')
  },
  filename(req, file, callback) {
    imgPath = `${file.fieldname}_${Date.now()}_${file.originalname}`;
    callback(null, imgPath)
  },
}) 
const upload = multer({ storage: Storage })

// upload image path to database
router.post('/uploadImage', upload.array('photo', 3), (req, res) => {
  var id = req.param('id');
  var sql = `UPDATE users SET img='${imgPath}' WHERE id=${id}`;

  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Image Added");
    res.json({
      imgPath: imgPath
    });    
  });  
})


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
  var selectedTime = req.body.selectedTime;

  console.log(sellerId);

var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  stripe.charges.create({
    amount: 2000,
    currency: "cad",
    source: "tok_amex", // obtained with Stripe.js
    description: "Charge for jenny.rosen@example.com"
  }, function(err, charge) {

    var sql = "INSERT INTO orders (sellerId, buyerId, serviceId, dateOrdered, price, serviceCategory, sellerName, dateScheduled) VALUES ('" + sellerId + "', '" + userId + "', '" + serviceId + "', '" + date + "', '" + maxPrice + "', '" + serviceCategory + "', '" + sellerName + "', '" + selectedTime + "')";

    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Service Order Added")
    });
  });
});


// create new stripe customer
router.post('/newCardStripe', function(req, res) {
  var cusID = req.param('id');
  var token = req.param('token');
  var sql = "SELECT stripeCusId FROM users WHERE id='" + cusID + "'";
  var stripeCusId = '';

  con.query(sql, function (err, result) {
    if (err) throw err;
    stripeCusId = result[0].stripeCusId;
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

  var sql = `INSERT INTO location (userId, streetNumber, streetName, city, province, postalCode) VALUES ('${userId}', '${streetNumber}', '${streetName}', '${city}', '${province}', '${postalCode}')`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Location added!")
  });

})

// create user to db
router.get('/createAccount', function(req, res) {
    var email = req.param('email');
    var name = req.param('name');
    var password = req.param('password');
    var type = req.param('type');
    // post a new user to the database
    var sql = `INSERT INTO ${type} (name,password,email) VALUES ('${name}', '${password}', '${email}')`;
    con.query(sql, function (err, result) {
      if (err) throw err;

      // get the id of the newly registered user
      var sql2 = "SELECT LAST_INSERT_ID() AS userId";
      con.query(sql2, function (err, result2) {
        if (err) throw err;
        var userId = result2[0].userId

        //create a customer within stripe for payments
        console.log(`attempting to create ${type}`);
        stripe.customers.create({
          description: 'Customer for' + name,
          email: email,
          source: "tok_amex" // obtained with Stripe.js
        }, function(err, customer) {
          var cusStripeID = customer.id

          // update the user in the database to add their new stripe id
           var sql = "UPDATE users SET stripeCusId ='" + cusStripeID + "' WHERE id='" + userId + "'";
           con.query(sql, function (err, result) {
             if (err) throw err;
             console.log('added stripe id');
           });
        });
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
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Field Updated");
  });
})

// post service to db
router.get('/createService', function(req, res) {

  var sellerId = req.param('sellerId');
  var sellerName = req.param('sellerName');
  var serviceName = req.param('serviceName');
  var serviceCategory = req.param('serviceCategory');
  var serviceDescription = req.param('serviceDescription');
  var minPrice = req.param('minPrice');
  var maxPrice = req.param('maxPrice');
  var priceHr = req.param('priceHr');
  var city = req.param('city');

  var sql = `INSERT INTO services (sellerID,sellerName,serviceName,serviceCategory,serviceDescription,
    city,minPrice,maxPrice,priceHr) VALUES ('${sellerId}', '${sellerName}', '${serviceName}', '${serviceCategory}',
    '${serviceDescription}', '${city}', '${minPrice}', '${maxPrice}', '${priceHr}')`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.json({
      success: 1
    })
    console.log("1 service created");
  });
});

// check if an email is already associated with an account
router.get('/getEmailExists', function(req, res){
    var email = req.param('email');
    var type = req.param('type');
    var sql = `SELECT * FROM ${type} WHERE email='${email}'`;
    con.query(sql, function (err, result) {
      if (err) throw err;
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

// do we need this?
// get a sellers name
router.get('/getSellerName', function(req, res){
    var id = req.param('id');

    var sql = "SELECT sellerName FROM users WHERE id='" + id + "'";
    con.query(sql, function (err, result) {
      if (err) throw err;
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


// get all info for a users account
router.get('/getAccountInfo', function(req, res){
    var id = req.param('id');
    var account_type = req.param('account_type');

    var sql = `SELECT * FROM ${account_type} WHERE id='${id}'`;
    //var sqlImg = `SELECT img from images WHERE userId=${id}`;
    
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Account Found.");
            res.json({
              id: result[0].id,
              name: result[0].name,
              email: result[0].email,
              password: result[0].password,
              img: result[0].img,
              phone: result[0].phone
            });            
      } else {
        console.log("No Account Found.");
      }
    });
});

// sign in
router.get('/signIn', function(req, res){
  var email = req.param('email');
  var password = req.param('password');
  var type = req.param('type');

  var sql = `SELECT id, name FROM ${type} WHERE email='${email}' AND password='${password}'`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.json({
      accountExists: result.length!=0,
      firstName: result[0].name,
      id: result[0].id,
    });
  });
});


// get services
router.get('/getServicePreviews', function(req, res){

    var serviceCat = req.param('serviceCat');

    // if a specific category is selected, retrieve only those services
    if (serviceCat != 'ALL') {
      var sql = `SELECT * FROM services WHERE serviceCategory='${serviceCat}'`;
    } else {
      var sql = `SELECT * FROM services`;
    }

    console.log(sql);

    con.query(sql, function (err, result) {
      if (err) throw err;
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

    var sql = "SELECT * FROM services WHERE sellerID='" + id + "'";
    con.query(sql, function (err, result) {
      if (err) throw err;
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

// get sellers orders
router.get('/getSellerOrders', function(req, res){
  var id = req.param('id');

  var sql = "SELECT * FROM orders WHERE sellerId='" + id + "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    if (result[0] !== null && result[0] !== undefined) {
        console.log("Orders Found");
        res.json({
          orders: result
        });
    } else {
      console.log("No Orders Found");
      res.json({
        orders: null
      });
    }
  });
});

// get a buyers orders
router.get('/getMyOrders', function(req, res){
    var id = req.param('id');

    var sql = "SELECT * FROM orders WHERE buyerId='" + id + "'";
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

router.get('/viewOrder', function(req, res){

  var orderId = req.param('id');
  var sql = "SELECT * FROM orders WHERE id='" + orderId + "'";

  con.query(sql, function (err, result) {
    if (err) throw err;
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

  var sql = "UPDATE users SET sellerName='" + sellerName + "' WHERE id='" + userId + "'";

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
    con.query(sql, function (err, result) {
      if (err) throw err;
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


router.get('/getSellerAvailability', function(req, res){

  var sellerId = req.param('sellerId');
  var serviceId = req.param('serviceId');

  var sql = `SELECT * FROM shifts WHERE sellerId=${sellerId} AND serviceId=${serviceId}`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result);
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Shifts Found");
        res.json({
          shiftInfo: result
        });
    } else {
      console.log("No Shifts Found");
    }
  });
});

router.get('/getDailyShifts', function(req, res){
  var day = req.param('day');
  var sql = "SELECT * FROM shifts WHERE day='" + day + "'";
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result);
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Daily Shifts Found");
        res.json({
          dailyShifts: result
        });
    } else {
      console.log("No Daily Shifts Found");
    }
  });
});



app.use('/api', router);
// start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);

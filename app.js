var mysql = require('mysql');
var fs = require('fs');
const multer = require('multer')
var stripe = require("stripe")("sk_test_fTlfHnvlI6jfS34mU7Prokqq00X4ultmWL");
var express = require('express');
var cloudinary = require('cloudinary');
var bodyParser = require('body-parser');
var moment = require("moment");

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


var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.json());

cloudinary.config({
  cloud_name: 'dwx46un2p',
  api_key: '779422868541215',
  api_secret: '2N7lYlIQ5ARTECYoG7LsTC2dU5Q'
});

var router = express.Router();

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
  if (id === undefined) { res.status(404).send(); throw err; };
  var sql = `UPDATE users SET img='${imgPath}' WHERE id=${id}`;

  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Image Added");
    res.json({
      imgPath: imgPath
    });
    res.status(200).send();
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
  var selectedTime = req.body.selectedTime;
  var noteToSeller = req.body.note;
  var status = 'PENDING';
  console.log(sellerId);
  if (serviceId === undefined || userId === undefined) { res.status(404).send(); throw err; };

  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  stripe.charges.create({
    amount: 2000,
    currency: "cad",
    source: "tok_amex", // obtained with Stripe.js
    description: "Charge for jenny.rosen@example.com"
  }, function(err, charge) {

    var sql = `INSERT INTO orders (sellerId, buyerId, serviceId, dateOrdered, serviceCategory, sellerName, dateScheduled, status, serviceName, note) 
    VALUES ('${sellerId}', '${userId}', '${serviceId}', '${date}', '${serviceCategory}', '${sellerName}', '${selectedTime}', '${status}', '${serviceName}', '${noteToSeller}')`;

    console.log(sql);

    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      console.log(result.insertId);
        res.json({
          orderId: result.insertId
        })
        res.status(200).send();
    });
  });
});


// create new stripe customer
router.post('/newCardStripe', function(req, res) {
  var cusID = req.param('id');
  var token = req.param('token');
  var type = req.param('type');  
  if (cusID === undefined || token === undefined) { res.status(404).send(); throw err; };

  var sql = `SELECT stripeCusId FROM ${type} WHERE id='${cusID}'`;
  var stripeCusId = '';
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    stripeCusId = result[0].stripeCusId;
    stripe.customers.createSource(
      stripeCusId,
      { source: token },
      function(err, card) {
        console.log(card);// asynchronously called
        console.log(err);
      }
    );
    res.status(200).send();
  });
});

// get stripe customer
router.get('/getStripeCustomer', function(req, res) {

  var cusID = req.param('id');
  var type = req.param('type');  
  //console.log(cusID);
  if (cusID === undefined) { res.status(404).send(); throw err; };
  //retreive a customer and their payment info from stripeCusId
  var sql = `SELECT stripeCusId FROM ${type} WHERE id='${cusID}'`;
  console.log(sql);

  var stripeCusId = '';

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    stripeCusId = result[0].stripeCusId;
    stripe.customers.retrieve(
      stripeCusId,
      function(err, customer) {
        console.log(JSON.stringify(customer));
        return res.status(200).json({
          stripeCustomerCards: customer.sources.data
        });
      }
    );
  });
});

// create location
router.get('/createLocation', function(req, res){
  var userId = req.param('userId');
  var type = req.param('type');
  var streetNumber = req.param('streetNumber');
  var streetName = req.param('streetName');
  var city = req.param('city');
  var province = req.param('province');
  var postalCode = req.param('postalCode');
  if (userId === undefined || streetNumber === undefined || streetName === undefined ||
      city === undefined || province === undefined || postalCode === undefined)
        { res.status(404).send(); throw err; };
  var sql = `INSERT INTO location (userId, streetNumber, streetName, city, province, postalCode) VALUES ('${userId}', '${streetNumber}', '${streetName}', '${city}', '${province}', '${postalCode}')`;

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Location added!")
    var get_locationId_qry = "SELECT LAST_INSERT_ID() AS locationId";
    con.query(get_locationId_qry, function (err, result2) {
      if (err) { res.status(404).send(); throw err; };
      var locationId = result2[0].locationId;
      var update_users_qry = `UPDATE ${type} SET locationId = ${locationId} WHERE (id = ${userId})`;
      con.query(update_users_qry, function (err, result3) {
        if (err) { res.status(404).send(); throw err; };
        console.log(`Added locationId to ${type}`);
        res.status(200).send();
      });
    });
  });

})

// create user to db
router.get('/createAccount', function(req, res) {
    var email = req.param('email');
    var name = req.param('name');
    var password = req.param('password');
    var type = req.param('type');
    var phone = req.param('phone');

    // HANDLE ERROR
    if (email === undefined || name === undefined || password === undefined || phone === undefined || type === undefined) { res.status(404).send(); throw err; };
    // post a new user to the database
    var sql = `INSERT INTO ${type} (name,password,email,phone) VALUES ('${name}', '${password}', '${email}', '${phone}')`;
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };

      // get the id of the newly registered user
      var sql2 = "SELECT LAST_INSERT_ID() AS userId";
      con.query(sql2, function (err, result2) {
        if (err) { res.status(404).send(); throw err; };
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
           var sql = `UPDATE ${type} SET stripeCusId='${cusStripeID}' WHERE id=${userId}`;
           console.log(sql);
           con.query(sql, function (err, result) {
            if (err) { res.status(404).send(); throw err; };
            console.log('added stripe id');
           });
        });
        res.json({
          userId: userId
        })
        res.status(200).send();
      });
    });
});

//edit a field
router.post('/editField', function(req, res){
  var type = req.body.type;
  var userId = req.body.userId;
  var fieldType = req.body.fieldType;
  var fieldValue = req.body.fieldValue;
  var sql = `UPDATE ${type} SET ` + fieldType + "='" + fieldValue + "' WHERE id=" + userId;
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Field Updated");
    res.status(200).send();
  });
})

// post service to db
router.get('/createService', function(req, res) {

  var sellerId = req.param('sellerId');
  var sellerName = req.param('sellerName');
  var serviceName = req.param('serviceName');
  var serviceCategory = req.param('serviceCategory');
  var serviceDescription = req.param('serviceDescription');
  var priceHr = req.param('priceHr');
  var city = req.param('city');
  if (sellerId === undefined || sellerName === undefined) { res.status(404).send(); throw err; };
  var sql = `INSERT INTO services (sellerID,sellerName,serviceName,serviceCategory,serviceDescription,
    city,priceHr) VALUES ('${sellerId}', '${sellerName}', '${serviceName}', '${serviceCategory}',
    '${serviceDescription}', '${city}', '${priceHr}')`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    res.json({
      success: 1
    })
    console.log("1 service created");
    res.status(200).send();
  });
});

// check if an email is already associated with an account
router.get('/getEmailExists', function(req, res){
    var email = req.param('email');
    var type = req.param('type');
    if (email === undefined || type === undefined) { res.status(404).send(); throw err; };
    var sql = `SELECT * FROM ${type} WHERE email='${email}'`;
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Account Found.");
          return res.status(200).json({
            accountExists: 1,
            firstName: result[0].name,
            id: result[0].id
          });
      } else {
        console.log("No Account Found.");
        return res.status(200).json({
          accountExists: 0,
          firstName: ''
        });
      }
    });
});

// get all info for a users account
router.get('/getAccountInfo', function(req, res){
  var id = req.param('id');
    var type = req.param('type');
    if (id === undefined || type === undefined) { res.status(404).send(); throw err; };
    var sql = `SELECT * FROM ${type} WHERE id='${id}'`;
    //var sqlImg = `SELECT img from images WHERE userId=${id}`;
    
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Account Found.");
            return res.status(200).json({
              id: result[0].id,
              name: result[0].name,
              email: result[0].email,
              password: result[0].password,
              img: result[0].img,
              phone: result[0].phone,
              fcmToken: result[0].fcmToken,
              photo: result[0].photo
            });            
      } else {
        console.log("No Account Found.");
        res.status(200).send();

      }
    });
});

// sign in
router.get('/signIn', function(req, res){
  var email = req.param('email');
  var password = req.param('password');
  var type = req.param('type');
  if (email === undefined || password === undefined || type === undefined) { res.status(404).send(); throw err; };
  var sql = `SELECT id, name FROM ${type} WHERE email='${email}' AND password='${password}'`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    return res.status(200).json({
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
      if (err) { res.status(404).send(); throw err; };
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Services Found");
          return res
            .status(200)
            .json({servicePreviews: result});

      } else {
        console.log("No Services Found");
      }
    });
});


// routes will go here
router.get('/getMyServicePreviews', function(req, res){
    var id = req.param('id');
    if (id === undefined) { res.status(404).send(); throw err; };
    var sql = "SELECT * FROM services WHERE sellerID='" + id + "'";
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Services Found");
          return res.status(200).json({
            servicePreviews: result,
            serviceExists: 1,
          });
      } else {
        console.log("No Services Found");
        return res.status(200).json({
          serviceExists: 0,
        });
      }
    });
});

// get sellers orders
router.get('/getSellerOrders', function(req, res){
  var id = req.param('id');
  console.log(id);
  if (id === undefined) { res.status(404).send(); throw err; };
  var sql = "SELECT * FROM orders WHERE sellerId='" + id + "'";
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    if (result[0] !== null && result[0] !== undefined) {
        console.log("Orders Found");
        return res
          .status(200).json({
          orders: result
        });
    } else {
      console.log("No Orders Found");
      return res
      .status(200).json({
        orders: null
      });
    }
  });
});

// get a buyers orders
router.get('/getMyOrders', function(req, res){
    var id = req.param('id');
    if (id === undefined) { res.status(404).send(); throw err; };
    var sql = "SELECT * FROM orders WHERE buyerId='" + id + "'";
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      //console.log(result);

      if (result[0] !== null && result[0] !== undefined) {
          console.log("Orders Found");
          return res
          .status(200)
          .json({
            orders: result,
            ordersExist: true
          });

      } else {
        console.log("No Orders Found");
        return res.status(200).json({
          orders: null,
          ordersExist: false
        });
      }
    });
});

router.get('/viewOrder', function(req, res){
  var orderId = req.param('id');
  if (orderId === undefined) { res.status(404).send(); throw err; };
  var sql = "SELECT * FROM orders WHERE id='" + orderId + "'";

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Order Found.");
        return res
          .status(200)
          .json({
            order: result
           });
    } else {
      console.log("No Order Found.");
      return res
      .status(200)
      .json({
        order: null
      });
    }
  });
})

//NOT BEING USED
router.get('/cancelOrder', function(req, res){

  var orderId = req.param('id');
  var sql = "DELETE FROM orders WHERE id='" + orderId + "'";
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; }
    else {
        console.log("Canceled Service");
        res.status(200).send();
    }
  });
})

router.get('/getServiceInfo', function(req, res){
    var id = req.param('id');
    if (id === undefined) { res.status(404).send(); throw err; };
    var sql = "SELECT * FROM services WHERE id=" + id;
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      if (result[0] !== null && result[0] !== undefined) {
        console.log("Services Found");
          return res
            .status(200)
            .json({
            serviceInfo: result
          });
      } else {
        console.log("No Services Found");
        res.status(200).send();
      }
    });
});

//setSellerSchedule
router.get('/setSellerAvailability', function(req, res){

  var sellerId = req.param('sellerId');
  var startHour = req.param('startHour');
  var endHour = req.param('endHour');
  var day = req.param('day');

  if (sellerId === undefined 
    //|| serviceId === undefined
    ) { res.status(404).send(); throw err; };
  
  var sql = `INSERT INTO shifts (sellerID,startHour,endHour,day) 
            VALUES ('${sellerId}', '${startHour}', '${endHour}', '${day}')`;
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    res.json({
      success: 1
    })
    console.log("Shifts successfully added");
    res.status(200).send();
  });
});

router.get('/getSellerAvailability', function(req, res){

  var sellerId = req.param('sellerId');
  if (sellerId === undefined) { res.status(404).send(); throw err; };
  var sql = `SELECT * FROM shifts WHERE sellerId=${sellerId}`;
  console.log(sql);
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log(result);
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Shifts Found");
        return res
          .status(200)
          .json({
          shiftInfo: result
        });
    } else {
      console.log("No Shifts Found");
      res.status(200).send();
    }
  });
});

router.get('/getDailyShifts', function(req, res){
  var day = req.param('day');
  var sql = "SELECT * FROM shifts WHERE day='" + day + "'";
  if (day === undefined) { res.status(404).send(); throw err; };
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log(result);
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Daily Shifts Found");
        return res
        .status(200).
        json({
          dailyShifts: result
        });
    } else {
      console.log("No Daily Shifts Found");
      res.status(200).send();      
    }
  });
});

// possible status' : PENDING, ACCEPTED, COMPLETE, DECLINED
// respondToOrderRequest
router.post('/respondToRequest', function(req, res){
    console.log('here');  
    var orderId = req.param('id');
    var resp = req.param('resp');

    var sql = `UPDATE orders SET status='${resp}' WHERE id='${orderId}'`;
    
    con.query(sql, function (err, result) {
      if (err) { res.status(404).send(); throw err; };
      console.log("Field Updated");
      res.status(200).send();
    });
});

router.post('/respondToRequestCompleted', function(req, res){
  var orderId = req.param('id');
  var resp = req.param('resp');
  var duration = req.param('duration');
  var cost = req.param('cost');

  var sql = `UPDATE orders SET status='${resp}', totalCost='${cost}', actualDuration='${duration}' WHERE id=${orderId}`;
  
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Field Updated");
    res.status(200).send();
  });
});

// log time when a service order is started and finished
router.post('/startstopService', function(req, res){
  console.log('here');  
  var orderId = req.param('id');
  var action = req.param('action');

  var currentTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

  var sql = `UPDATE orders SET ${action}='${currentTime}' WHERE id='${orderId}'`;
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Field Updated");
    res.status(200).send();
  });
});

// get ratings
router.get('/getRatings', function(req, res){
  var id = req.param('id');
  if (id === undefined) { res.status(404).send(); throw err; };
  var sql = "SELECT * FROM ratings WHERE serviceId=" + id;
  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    if (result[0] !== null && result[0] !== undefined) {
      console.log("Ratings Found");
        return res
          .status(200)
          .json({
          ratingInfo: result
        });
    } else {
      return res
        .status(200)
        .json({
        ratingInfo: null
    });
    }
  });
});

// add a buyers rating for a seller
router.post('/addRating', function(req, res){
  var sellerId = req.param('sellerId');
  var serviceId = req.param('serviceId');
  var orderId = req.param('orderId');
  var buyerId = req.param('buyerId');
  var rating = req.param('rating');
  var comment = req.param('comment');

  var sql = `INSERT INTO ratings (sellerId, serviceId, orderId, buyerId, rating, comment) VALUES (${sellerId}, ${serviceId}, ${orderId}, ${buyerId}, ${rating}, '${comment}')`;
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Rating Added");
    res.status(200).send();
  });
});

router.post('/makePayment', function(req, res){
  var orderId = req.param('id');

  var sql = `SELECT WHERE id='${orderId}'`;
  console.log(sql);

  con.query(sql, function (err, result) {
    if (err) { res.status(404).send(); throw err; };
    console.log("Field Updated");
    res.status(200).send();
  });
});

app.use('/api', router);
module.exports = app;
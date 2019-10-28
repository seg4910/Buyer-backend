var mysql = require('mysql');
var fs = require('fs');
const request = require('supertest');
const app = require('../app.js');

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

describe('API end point 404 test', () => {
    beforeAll(() => {
        con.connect(function(err) { if (err) throw err; });
    });
    it("getDailyShifts", async () => {
        return request(app).get('/api/getDailyShifts').expect(404);
    });
    it("getSellerAvailability", async () => {
        return request(app).get('/api/getSellerAvailability').expect(404);
    });
    it("getServiceInfo", async () => {
        return request(app).get('/api/getServiceInfo').expect(404);
    });
    it("viewOrder", async () => {
        return request(app).get('/api/viewOrder').expect(404);
    });
    it("getMyOrders", async () => {
        return request(app).get('/api/getMyOrders').expect(404);
    });
    it("getMyServicePreviews", async () => {
        return request(app).get('/api/getMyServicePreviews').expect(404);
    });
    it("signIn", async () => {
        return request(app).get('/api/signIn').expect(404);
    });
    it("getAccountInfo", async () => {
        return request(app).get('/api/getAccountInfo').expect(404);
    });
    it("getEmailExists", async () => {
        return request(app).get('/api/getEmailExists').expect(404);
    });
    it("getStripeCustomer", async () => {
        return request(app).get('/api/getStripeCustomer').expect(404);
    });
    it("createService", async () => {
        return request(app).get('/api/createService').expect(404);
    });
    it("editField", async () => {
        return request(app).get('/api/editField').expect(404);
    });
    it("createAccount", async () => {
        return request(app).get('/api/createAccount').expect(404);
    });
    it("createLocation", async () => {
        return request(app).get('/api/createLocation').expect(404);
    });
    it("newCardStripe", async () => {
        return request(app).get('/api/newCardStripe').expect(404);
    });
    it("purchaseService", async () => {
        return request(app).get('/api/purchaseService').expect(404);
    });
    it("uploadImage", async () => {
        return request(app).get('/api/uploadImage').expect(404);
    });
    afterAll((done) => {
        con.end(done);
    });
  });
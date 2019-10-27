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

const signin_input = {
    type: 'sellers',
    email: 'owen.adley@gmail.com',
    password: 'pass',
}

describe('API end point test', () => {
    beforeAll(() => {
        con.connect(function(err) { if (err) throw err; });
    });
    it("getDailyShifts", async () => {
        return request(app).get('/api/getDailyShifts/?day=2019-09-18').expect(200);
    });
    it("getSellerAvailability", async () => {
        return request(app).get('/api/getSellerAvailability/?sellerId=1&serviceId=1').expect(200);
    });
    it("getServiceInfo", async () => {
        return request(app).get('/api/getServiceInfo/?id=1').expect(200);
    });
    it("viewOrder", async () => {
        return request(app).get('/api/viewOrder/?id=1').expect(200);
    });
    it("getMyOrders", async () => {
        return request(app).get('/api/getMyOrders/?id=1').expect(200);
    });
    it("getMyServicePreviews", async () => {
        return request(app).get('/api/getMyServicePreviews/?id=1').expect(200);
    });
    it("getServicePreviews", async () => {
        return request(app).get('/api/getMyServicePreviews/?serviceCat=LM').expect(200);
    });
    it("signIn users", async () => {
        return request(app).get('/api/signIn/?email=test@gmail.com&password=test&type=users').expect(200);
    });
    it("signIn sellers", async () => {
        return request(app).get('/api/signIn/?email=owen.adley@gmail.com&password=pass&type=sellers').expect(200);
    });
    it("getAccountInfo users", async () => {
        return request(app).get('/api/getAccountInfo/?id=1&type=users').expect(200);
    });
    it("getAccountInfo sellers", async () => {
        return request(app).get('/api/getAccountInfo/?id=1&type=sellers').expect(200);
    });
    it("getEmailExists users", async () => {
        return request(app).get('/api/getAccountInfo/?email=test@gmail.com&type=users').expect(200);
    });
    it("getEmailExists sellers", async () => {
        return request(app).get('/api/getAccountInfo/?email=owen.adley@gmail.com&type=sellers').expect(200);
    });
/*     it("getStripeCustomer", async () => {
        return request(app).get('/api/getStripeCustomer/?id=1').expect(200);
    }); */
    /*it("editField users", async () => {
        return request(app).get('/api/editField/?userId=1&fieldType=name&fieldValue=test&type=users').expect(200);
    });
    it("editField sellers", async () => {
        return request(app).get('/api/editField/?userId=1&fieldType=name&fieldValue=test&type=sellers').expect(200);
    });*/
    afterAll((done) => {
        con.end(done);
    });
  });
const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");

app.use(bodyParser.json());

module.exports = app;

// Database for clients
let clientDB = new Datastore({
    filename: process.env.APPDATA + "/POS/server/databases/clients.db",
    autoload: true
});

clientDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function (req, res) {
    res.send("Clients API");
});

// Get all clients
app.get("/all", function (req, res) {
    clientDB.find({}, function (err, docs) {
        if (err) res.status(500).send(err);
        else res.send(docs);
    });
});

// Get single client by ID
app.get("/client/:clientId", function (req, res) {
    if (!req.params.clientId) {
        res.status(500).send("ID field is required.");
    } else {
        clientDB.findOne({
            _id: req.params.clientId
        }, function (err, client) {
            if (err) res.status(500).send(err);
            else res.send(client);
        });
    }
});

// Create new client
app.post("/client", function (req, res) {
    var newClient = {
        name: req.body.name,
        phone: req.body.phone || "",
        email: req.body.email || "",
        address: req.body.address || "",
        balance: 0, // Outstanding balance
        totalPurchases: 0, // Total amount of all purchases
        totalPaid: 0, // Total amount paid
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentHistory: [] // Array of payment records
    };
    
    clientDB.insert(newClient, function (err, client) {
        if (err) res.status(500).send(err);
        else res.send(client);
    });
});

// Update client
app.put("/client", function (req, res) {
    let clientId = req.body._id;
    
    clientDB.update({
        _id: clientId
    }, req.body, {}, function (err, numReplaced, client) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

// Delete client
app.delete("/client/:clientId", function (req, res) {
    clientDB.remove({
        _id: req.params.clientId
    }, function (err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

// Add payment to client
app.post("/client/:clientId/payment", function (req, res) {
    let clientId = req.params.clientId;
    
    clientDB.findOne({ _id: clientId }, function (err, client) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        
        if (!client) {
            res.status(404).send("Client not found");
            return;
        }
        
        let paymentAmount = parseFloat(req.body.amount);
        let newBalance = client.balance - paymentAmount;
        
        let paymentRecord = {
            amount: paymentAmount,
            date: new Date(),
            transactionId: req.body.transactionId || "",
            paymentType: req.body.paymentType || "Cash",
            note: req.body.note || ""
        };
        
        client.balance = newBalance;
        client.totalPaid = (client.totalPaid || 0) + paymentAmount;
        client.paymentHistory = client.paymentHistory || [];
        client.paymentHistory.push(paymentRecord);
        client.updatedAt = new Date();
        
        clientDB.update({ _id: clientId }, client, {}, function (err, numReplaced) {
            if (err) res.status(500).send(err);
            else res.send(client);
        });
    });
});

// Add purchase/debt to client
app.post("/client/:clientId/purchase", function (req, res) {
    let clientId = req.params.clientId;
    
    clientDB.findOne({ _id: clientId }, function (err, client) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        
        if (!client) {
            res.status(404).send("Client not found");
            return;
        }
        
        let purchaseAmount = parseFloat(req.body.total);
        let paidAmount = parseFloat(req.body.paid || 0);
        let remaining = purchaseAmount - paidAmount;
        
        client.totalPurchases = (client.totalPurchases || 0) + purchaseAmount;
        client.totalPaid = (client.totalPaid || 0) + paidAmount;
        client.balance = (client.balance || 0) + remaining;
        client.updatedAt = new Date();
        
        clientDB.update({ _id: clientId }, client, {}, function (err, numReplaced) {
            if (err) res.status(500).send(err);
            else res.send(client);
        });
    });
});

// Get clients with outstanding balance
app.get("/clients/with-balance", function (req, res) {
    clientDB.find({ balance: { $gt: 0 } }, function (err, docs) {
        if (err) res.status(500).send(err);
        else res.send(docs);
    });
});


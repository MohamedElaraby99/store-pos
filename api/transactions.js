let app = require("express")();
let server = require("http").Server(app);
let bodyParser = require("body-parser");
let Datastore = require("nedb");
let Inventory = require("./inventory");

app.use(bodyParser.json());

module.exports = app;

let transactionsDB = new Datastore({
  filename: process.env.APPDATA + "/POS/server/databases/transactions.db",
  autoload: true
});


transactionsDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function (req, res) {
  res.send("Transactions API");
});


app.get("/all", function (req, res) {
  transactionsDB.find({}, function (err, docs) {
    if (err) {
      console.error("Error fetching transactions:", err);
      return res.status(500).send({ error: "Error fetching transactions" });
    }
    res.send(docs || []);
  });
});




app.get("/on-hold", function (req, res) {
  transactionsDB.find(
    { $and: [{ ref_number: { $ne: "" } }, { status: 0 }] },
    function (err, docs) {
      if (docs) res.send(docs);
    }
  );
});



app.get("/customer-orders", function (req, res) {
  transactionsDB.find(
    { $and: [{ customer: { $ne: "0" } }, { status: 0 }, { ref_number: "" }] },
    function (err, docs) {
      if (docs) res.send(docs);
    }
  );
});



app.get("/by-date", function (req, res) {

  let startDate = new Date(req.query.start);
  let endDate = new Date(req.query.end);

  if (req.query.user == 0 && req.query.till == 0) {
    transactionsDB.find(
      { $and: [{ date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } }, { status: parseInt(req.query.status) }] },
      function (err, docs) {
        if (docs) res.send(docs);
      }
    );
  }

  if (req.query.user != 0 && req.query.till == 0) {
    transactionsDB.find(
      { $and: [{ date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } }, { status: parseInt(req.query.status) }, { user_id: parseInt(req.query.user) }] },
      function (err, docs) {
        if (docs) res.send(docs);
      }
    );
  }

  if (req.query.user == 0 && req.query.till != 0) {
    transactionsDB.find(
      { $and: [{ date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } }, { status: parseInt(req.query.status) }, { till: parseInt(req.query.till) }] },
      function (err, docs) {
        if (docs) res.send(docs);
      }
    );
  }

  if (req.query.user != 0 && req.query.till != 0) {
    transactionsDB.find(
      { $and: [{ date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } }, { status: parseInt(req.query.status) }, { till: parseInt(req.query.till) }, { user_id: parseInt(req.query.user) }] },
      function (err, docs) {
        if (docs) res.send(docs);
      }
    );
  }

});



app.post("/new", function (req, res) {
  let newTransaction = req.body;
  
  // Initialize payment history if not present
  if (!newTransaction.paymentHistory) {
    newTransaction.paymentHistory = [];
  }
  
  // Add initial payment to history if paid amount exists
  if (newTransaction.paid && parseFloat(newTransaction.paid) > 0) {
    newTransaction.paymentHistory.push({
      amount: parseFloat(newTransaction.paid),
      date: new Date(),
      paymentType: newTransaction.payment_type || 0,
      paymentInfo: newTransaction.payment_info || ""
    });
  }

  transactionsDB.insert(newTransaction, function (err, transaction) {
    if (err) res.status(500).send(err);
    else {
      res.sendStatus(200);

      if (newTransaction.paid >= newTransaction.total) {

        Inventory.decrementInventory(newTransaction.items);
      }

    }
  });
});



app.put("/new", function (req, res) {
  let oderId = req.body._id;
  transactionsDB.update({
    _id: oderId
  }, req.body, {}, function (
    err,
    numReplaced,
    order
  ) {
    if (err) res.status(500).send(err);
    else res.sendStatus(200);
  });
});


app.post("/delete", function (req, res) {
  let transaction = req.body;
  transactionsDB.remove({
    _id: transaction.orderId
  }, function (err, numRemoved) {
    if (err) res.status(500).send(err);
    else res.sendStatus(200);
  });
});



app.get("/:transactionId", function (req, res) {
  transactionsDB.find({ _id: req.params.transactionId }, function (err, doc) {
    if (doc) res.send(doc[0]);
  });
});

// Add payment to existing transaction
app.post("/add-payment/:transactionId", function (req, res) {
  let transactionId = req.params.transactionId;
  
  transactionsDB.findOne({ _id: transactionId }, function (err, transaction) {
    if (err) {
      res.status(500).send(err);
      return;
    }
    
    if (!transaction) {
      res.status(404).send("Transaction not found");
      return;
    }
    
    let paymentAmount = parseFloat(req.body.amount);
    let currentPaid = parseFloat(transaction.paid || 0);
    let newPaid = currentPaid + paymentAmount;
    
    // Initialize payment history if not present
    if (!transaction.paymentHistory) {
      transaction.paymentHistory = [];
    }
    
    // Add payment to history
    transaction.paymentHistory.push({
      amount: paymentAmount,
      date: new Date(),
      paymentType: req.body.paymentType || 0,
      paymentInfo: req.body.paymentInfo || ""
    });
    
    transaction.paid = newPaid.toFixed(2);
    transaction.change = (newPaid - transaction.total).toFixed(2);
    
    // Update status if fully paid
    if (newPaid >= transaction.total) {
      transaction.status = 1;
      // Decrement inventory if this is the first time it's fully paid
      if (currentPaid < transaction.total) {
        Inventory.decrementInventory(transaction.items);
      }
    }
    
    transactionsDB.update({ _id: transactionId }, transaction, {}, function (err, numReplaced) {
      if (err) res.status(500).send(err);
      else res.send(transaction);
    });
  });
});

// Get unpaid/partially paid transactions
app.get("/unpaid/all", function (req, res) {
  transactionsDB.find({ status: 0 }, function (err, docs) {
    if (err) res.status(500).send(err);
    else res.send(docs);
  });
});

// Get transactions by client
app.get("/client/:clientId/transactions", function (req, res) {
  transactionsDB.find({ "client._id": req.params.clientId }, function (err, docs) {
    if (err) res.status(500).send(err);
    else res.send(docs);
  });
});

let express = require("express"),
  http = require("http"),
  app = require("express")(),
  server = http.createServer(app),
  bodyParser = require("body-parser");

// Try multiple ports to avoid conflicts
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    testServer.listen(startPort, () => {
      testServer.close(() => resolve(startPort));
    });
    testServer.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

console.log("Server starting...");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all("/*", function(req, res, next) {
 
  res.header("Access-Control-Allow-Origin", "*");  
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-type,Accept,X-Access-Token,X-Key"
  );
  if (req.method == "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

app.get("/", function(req, res) {
  res.send("POS Server Online.");
});

app.use("/api/inventory", require("./api/inventory"));
app.use("/api/customers", require("./api/customers"));
app.use("/api/clients", require("./api/clients"));
app.use("/api/categories", require("./api/categories"));
app.use("/api/settings", require("./api/settings"));
app.use("/api/users", require("./api/users"));
app.use("/api/transactions", require("./api/transactions")); // Mount at /api/transactions for new features
app.use("/api", require("./api/transactions")); // Also mount at /api for backward compatibility

// Start server with automatic port selection
const startPort = process.env.PORT || 8001;
findAvailablePort(startPort).then(port => {
  server.listen(port, () => {
    console.log(`Server started successfully on PORT ${port}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});

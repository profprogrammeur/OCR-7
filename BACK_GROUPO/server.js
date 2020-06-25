// Imports
var express = require('express');
var bodyParser = require('body-parser');
var apiRouter = require('./apiRouter').router;

// Instantiate server
var server = express();


// Body Parser configuration
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json()); 

server.use((req, res, next) => {
    console.log("req.body : " + JSON.stringify(req.method))
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500' );
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    
if (req.method === 'OPTIONS'){
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
}
    next();
});
// server.options('*', function (req, res) { res.sendStatus(200); });



// Configure routes
server.get('/', function (req, res) { 
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>Bonjour sur mon super server</h1>');
});

server.use('/api/', apiRouter);

// Launch server
server.listen(8080, function () {
    console.log('Server en écoute :)');
});

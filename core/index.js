var mongoose = require('mongoose');

// data model
var Bubble = mongoose.model('Bubble', {
    specURI: String,
    section: Number,
    x: String,
    y: String,
    text: String,
    name: String,
    timestamp: String
});

var resources = {
    noConnection: 'MongoDB connection is inactive.',
    dbError: 'Could not get information from DB.'
};

var config = {
    statusCodes: {
        OK: 200,
        notFound: 404,
        error: 500
    }
};

var connectionErrorHandler = function(res){
    res.status(config.statusCodes.notFound).send(resources.noConnection);
};

var DBErrorHandler = function(res, err){
    res.status(config.statusCodes.error).send(resources.dbError);
    console.log('Bubble: ', resources.dbError, err);
};

var getBubbles = function(req, res){
    if (mongoose.connection.readyState === 0) {
        connectionErrorHandler(res);
        return;
    }

    var specURI = req.query.pathToDataFile;

    var opts = {};

    if (specURI != null) {
        opts = {
            specURI: specURI
        };
    }

    Bubble.find(opts, function(err, data){
        if (err) {
            DBErrorHandler(res, err);
            return;
        }

        res.jsonp(data);
    })
};

var setBubble = function(req, res){
    if (mongoose.connection.readyState === 0) {
        connectionErrorHandler(res);
        return;
    }

    var bubble = new Bubble({
                specURI: req.query.specURI,
                section: req.query.section,
                x: req.query.x,
                y: req.query.y,
                text: req.query.text,
                name: req.query.name,
                timestamp: req.query.timestamp
            }
    );

    bubble.save(function (err, data) {
        if (err) {
            DBErrorHandler(res, err);
            return;
        }

        res.jsonp(data);
    });
};

var removeBubble = function(req, res){
    if (mongoose.connection.readyState === 0) {
        connectionErrorHandler(res);
        return;
    }

    var id = req.query.id;

    Bubble.remove({_id : id }, function (err, data) {
        if (err) {
            DBErrorHandler(res, err);
            return;
        }

        res.jsonp(data);
    });
};

var countBubbles = function(req, res){
    if (mongoose.connection.readyState === 0) {
        connectionErrorHandler(res);
        return;
    }

    var specURI = req.query.specURI;

    Bubble.count({specURI : specURI }, function (err, data) {
        if (err) {
            DBErrorHandler(res, err);
            return;
        }

        res.jsonp(data);
    });
};

var removeAllBubbles = function(req, res){
    if (mongoose.connection.readyState === 0) {
        connectionErrorHandler(res);
        return;
    }

    Bubble.remove(function (err, data) {
        if (err) {
            DBErrorHandler(res, err);
            return;
        }

        res.send('removed all');
    });
};

global.app.get('/getBubbles', getBubbles);
global.app.get('/setBubble', setBubble);
global.app.get('/removeBubble', removeBubble);
global.app.get('/countBubbles', countBubbles);
global.app.get('/removeAllBubbles', removeAllBubbles);

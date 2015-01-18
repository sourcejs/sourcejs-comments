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

var getBubbles = function(req, res){
    var specURI = req.query.pathToDataFile;

    var opts = {};

    if (specURI != null) {
        opts = {
            specURI: specURI
        };
    }

    Bubble.find(opts, function(err, data){
        if(!err) {
            res.jsonp(data);
        }
    })
};

var setBubble = function(req, res){
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
        if (!err){
            res.jsonp(data);
        }
    });
};

var removeBubble = function(req, res){
    var id = req.query.id;

    Bubble.remove({_id : id }, function (err, data) {
        if (!err){
            res.jsonp(data);
        }
    });
};

var countBubbles = function(req, res){
    var specURI = req.query.specURI;

    Bubble.count({specURI : specURI }, function (err, data) {
        if (!err){
            res.jsonp(data);
        } else {
            res.send(err);
        }
    });
};

var removeAllBubbles = function(req, res){
    Bubble.remove(function (err, data) {
        if (!err){
            res.send('removed all');
        }
    });
};

global.app.get('/getBubbles', getBubbles);
global.app.get('/setBubble', setBubble);
global.app.get('/removeBubble', removeBubble);
global.app.get('/countBubbles', countBubbles);
global.app.get('/removeAllBubbles', removeAllBubbles);
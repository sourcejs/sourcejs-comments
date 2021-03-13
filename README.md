Comments plugin
===============

Comments plugin for [SourceJS](http://sourcejs.com) for commenting Spec examples.

![image](http://d.pr/i/kISN+)

Compatible with SourceJS v.0.5.6+.

## Looking for maintainers

Because of the limited resources capacity, SourceJS team currently can't invest time into this project. We will continue supporting the project, providing fixes for only critical issues, but new feature development will rely only on the community efforts.

If you want to maintain the plugin, please drop a note.

As an altenrative service, we can recommend using third party commenting plugins like [TrackDuck](https://app.trackduck.com/auth/ref/637dd630-a1b2-11e5-a099-5b1f885a8fb2).

## Install

To install, run npm in `sourcejs/user` folder:

```
npm install sourcejs-comments --save
```

Then run build command in SourceJS root:

```
cd sourcejs
npm run build
```

After installation, all your Specs pages will have "Add description" tumbler in inner menu, that will active the plugin.

## Dependencies

### MongoDB

As [MongoDB](http://www.mongodb.org/) is not essential dependency for SourceJS, you must install it separately, to work with plugins that expect data storage.

[Install MongoDB locally](http://docs.mongodb.org/manual/installation/) or get it from [MongoLab](https://mongolab.com) and configure your SourceJS in `sourcejs/user/options.js`:

```json
core: {
  "production": {
    "host": "localhost",
    "dbName": "sourcejs"
  }
}
```

Host could point to remote service. Database name could be custom as well.

#### Connect to DB from app

Then prepare `mongoose` dependency - as it must be common for every plugins, install it in `sourcejs/user`

```
npm install mongoose --save
```

And edit `/sourcejs/user/core/app.js`, that extends main SourceJS application. Just add this code snippet, for connection to database:

```js
/* Connect to DB */
var mongoose = require('mongoose');

var dbAdress = 'mongodb://' + global.opts.core.production.host + '/' + global.opts.core.production.dbName;

mongoose.connection.on("connecting", function() {
    return console.log("Started connection on " + (dbAdress).cyan + ", waiting for it to open...".grey);
});
mongoose.connection.on("open", function() {
    return console.log("MongoDB connection opened!".green);
});
mongoose.connection.on("error", function(err) {
    console.log("Could not connect to mongo server!".red);
    return console.log(err.message.red);
});

mongoose.connect(dbAdress);
/* /Connect to DB */
```

## Legacy versions

For SourceJS v0.3.* use older plugin version [0.0.x](https://github.com/sourcejs/sourcejs-comments/archive/v0.0.9.zip).

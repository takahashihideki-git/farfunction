var express = require( 'express' );
var bodyParser = require( 'body-parser' );
var cookieParser = require( 'cookie-parser' );
var session = require('express-session');
var basicAuth = require('basic-auth-connect');
var fs = require( 'fs' );
var MongoClient = require( 'mongodb' ).MongoClient;
if( ! process.env.USERNAME ) { // for dev
    require('dotenv').config();
}

/* Express */
var app = express();
app.use( bodyParser.urlencoded( { extended : false } ) );
app.use( cookieParser() );
app.use(
  session( {
    secret: process.env.OPENSHIFT_APP_UUID || "aobadai",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  } )
);
app.use( express.static( __dirname + '/static' ) );


/* Server */

var localHost = "localhost"; // for dev
var ipaddr  = process.env.IP   || localHost;
var port    = process.env.PORT || 3000;

var dataDir = process.env.DATA_DIR || "./data";
var moduleDir = dataDir + "/farfunction";

var authUsername = "admin";
var authPassword = "admin";

var dbName  = process.env.MONGODB_DB_NAME || "farfunction";
var dbURI   = process.env.MONGODB_DB_URI || "mongodb://localhost:27017";

console.log( dbURI );

/* Far Function */

/* Make Writable Module Directory */
try {
  fs.statSync( moduleDir )
} catch ( e ) {
  fs.mkdirSync( moduleDir, 0777 );
}
/* Make Symbolic Link of "node_modules" on Module Directory */
try {
  fs.statSync( moduleDir + "/node_modules" )
} catch ( e ) {
  try {
    fs.symlinkSync(
      __dirname + "/node_modules",
      moduleDir + "/node_modules",
      "dir"
    );
  }
  catch ( e ) {
    // console.log( e );
  }
}

/* Response Wrapper */
var wrapper = function ( req, res ) {

  var moduleName = req.params[0];
  var method     = req.params[1];

  // responser
  res.return = function ( reply ) {
    if ( Object.prototype.toString.apply( reply ) == "[object Object]" ) {
      res.setHeader( 'Content-Type', 'application/json' );
      if ( req.query.callback ) { // as JSONP
        res.setHeader( 'Content-Type', 'text/javascript' );
        reply = req.query.callback + "(" + JSON.stringify( reply ) + ");";
      }
    }
    res.send( reply );
  }

  var module  = require( moduleDir + "/" + moduleName );
  var reply   = module[ method ]( req, res, mdb );

}

/* GET & POST Module */
app.all( /^\/call\/(.+)\/([^\/]+)$/, function ( req, res ) { wrapper( req, res ) } );

/* Admin Tools */

/* Need Basic Authentication */

var auth = function ( user, pass ) {
    return user === process.env.USERNAME && pass === process.env.PASSWORD;
};

app.all( '/admin', basicAuth( auth ) );
app.all( '/admin/*', basicAuth( auth ) );

/* Write Module */
app.post( /^\/admin\/post\/([^\/]+)$/, function ( req, res ) {

  var moduleName = req.params[0];

  fs.writeFile( moduleDir + "/" + moduleName + ".js", req.body.source, function ( err ) {
    if ( err ) {
      res.send( { status: 0 } );
    }
    else {
      res.send( { status: 1 } );
    }
  } );

  return false;

} );

/* Check Exist Module */
app.get( /^\/admin\/exists\/(.+)$/, function ( req, res ) {

  var moduleName = req.params[0];
  var exists = 1;

  try {
    fs.statSync( moduleDir + "/" + moduleName + ".js" );
  } catch ( e ) {
    exists = 0;
  }

  res.send( { status: exists } );

} );

/* Read Module */
app.get( /^\/admin\/get\/([^\/]+)$/, function ( req, res ) {

  var moduleName = req.params[0];

  fs.readFile( moduleDir + "/" + moduleName + ".js", "utf8", function ( err, data ) {
    if ( err ) {
      res.send( { status: 0 } );
    }
    else {
      res.send( {
        status: 1,
        source: data
      } );
    }
  } );

  return false;

} );

/* List Modules */
app.get( /^\/admin\/list$/, function ( req, res ) {

  fs.readdir( moduleDir, function ( err, files ) {
    if ( err ) {
      res.send( { status: 0 } );
    }
    else {
      res.send( files );
    }
  } );

} );

/* Remove Module */
app.get( /^\/admin\/delete\/([^\/]+)$/, function ( req, res ) {

  var moduleName = req.params[0];

  fs.unlink( moduleDir + "/" + moduleName + ".js", function ( err ) {
    if ( err ) {
      res.send( { status: 0 } );
    }
    else {
      res.send( { status: 1 } );
    }
  } );

  return false;

} );

/* Module Cache Clear */
app.get( /^\/admin\/refresh\/(.+)$/, function ( req, res ) {

  var moduleName = req.params[0];
  var module = require.resolve( moduleDir + "/" + moduleName );
  var status = 1;
  try {
    delete require.cache[ module ];
  } catch ( e ) {
    status = 0;
  }
  res.send( {
    status: status,
    module: module
  } );

} );

/* Admin UI */
app.get( '/admin', function( req, res ) {
  fs.readFile( "admin.html", "utf8", function ( err, data ) {
    if ( err ) {
      res.send( "Can not open admin.html" );
    }
    else {
      res.send( data );
    }
  } );
} );

/* Document Root */
app.get( '/', function( req, res ) {

  if ( req.headers.host.match( new RegExp( localHost ) ) ) { // for dev
    res.redirect( '/admin' );
  }
  else {
    res.redirect( 'https://' + req.headers.host + req.url + 'admin' );
  }

} );

/* Rear Guard ! */
process.on( 'uncaughtException', function ( error ) {
  console.log( 'error: ' + error );
} );

// Sserver start with mongodb

var mdb;

MongoClient.connect( dbURI, function( err, client ) {
    if ( err ) {
        console.log( err );
    }
    else {
        mdb = client.db( dbName );
        app.listen( port );
    }
} );

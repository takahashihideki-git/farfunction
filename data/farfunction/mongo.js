// the "db" parameter is mongodb handler.

exports.insert = function ( request, response, db ) {

  var collection = db.collection( "test" );
  collection.insert( { text: request.query.text }, function ( err, result ) {
    if ( err ) {
      response.return( { status: 0, error: err } );
    }
    else {
      response.return( { status: 1, result: result } );
    }
  } );

}

exports.find = function ( requst, response, db ) {

  var collection = db.collection( "test" );

  collection.find().toArray( function( err, docs ) {
    if ( err ) {
      response.return( { status: 0, error: err } );
    }
    else {
      response.return( docs );
    }
  } );

}
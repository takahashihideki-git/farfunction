//Internet Paste Board

var success = "<html><body style='font-family:sans-serif;color:#36A9D8'><center>success!</center></body></html>";
var error = "<html><body style='font-family:sans-serif;color:#FF3B2F'><center>error.</center></body></html>";

exports.check = function ( req, res, db ) {

 if ( ! req.query.name ) {
   res.return( { status: 0, error: "Bad Request: name is null" } );
   return;
 }

 var collection = db.collection( "internetPasteBoard" );

 collection.findOne( { name: req.query.name }, function ( err, doc ) {

   if ( err ) {
     res.return( { status: 0, error: err } );
   }
   else {
       var sw = doc ? doc.switch : 0;
       res.return( { status: 1, switch: sw } );
   }

 } );

}


exports.get = function ( req, res, db ) {

 if ( ! req.query.name ) {
   res.return( { status: 0, error: "Bad Request: name is null" } );
   return;
 }

 var collection = db.collection( "internetPasteBoard" );

 collection.findOne( { name: req.query.name }, function ( err, doc ) {
   if ( err ) {
     res.return( { status: 0, error: err } );
   }
   else {
     if ( doc && doc.switch ) { // paste
       collection.update( { name: req.query.name }, { $set: { text: "", switch: 0 } }, function ( err, result ) {
         if ( err ) {
           res.return( { status: 0, error: err } );
         }
         else {
           res.return( { status: 1, doc: doc } );
         }
       } );
     }
     else {
       res.return( { status: 0, error: "Bad Request: text is blank" } );
     }
   }
 } );

}


exports.post = function ( req, res, db ) {

 if ( ! req.body.name ) {
   res.return( { status: 0, error: "Bad Request: name is null" } );
   return;
 }

 var collection = db.collection( "internetPasteBoard" );

 collection.findOne( { name: req.body.name }, function ( err, doc ) {

   if ( err ) {
     res.return( { status: 0, error: err } );
   }
   else {
     if ( doc ) { // copy

       var text = req.body.text ? req.body.text : "";
       var sw = text ? 1 : 0;

       collection.update( { name: req.body.name }, { $set: { text: text, switch: sw } }, function ( err, result ) {
         if ( err ) {
           res.return( error );
         }
         else {
           res.return( success );
         }
       } );

     }
     else { // create and copy

       var text = req.body.text ? req.body.text : "";
       var sw = text ? 1 : 0;

       collection.insert( { name: req.body.name, text: text, switch: sw }, function ( err, result ) {
        if ( err ) {
           res.return( error );
         }
         else {
           res.return( success );
         }
       } );

     }
   }

 } );

}

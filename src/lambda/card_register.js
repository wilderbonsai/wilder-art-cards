//POST {'cardId','email','cardPin' }

//Check to see if card pin matches

//Check to see if the card is already registered

//

/*
If Registered
  Throw already registered error

Else
  Attach email to card
 */

'use strict'
var MongoClient = require('mongodb').MongoClient;
var passwordHash = require('password-hash');

/* export our lambda function as named "handler" export */
exports.handler = (event, context, callback) => {
  const data = JSON.parse(event.body)
  const email = data.email
  const cardId = data.cardId
  const pin = data.pin
  //TODO Validate cardId and Pin existing

  var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
  // //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    MongoClient.connect(uri, function (err, client) {
      if (err) console.log(err)
      const collection = client.db("wilderCommunity").collection("artCards");
      var query = {cardId: cardId};
      collection.findOne(query, function (err, result) {
        //find one callback
        let updatedArtCard = result

        //TODO Check if pin hashes match
        if(!passwordHash.verify(pin,result.pinHash)) {
          return callback(null, {
            statusCode: 400,
            body: JSON.stringify({
              code: 'incorrect_pin',
              message: 'The pin/id combination does not match'
            })
          });
        }

        updatedArtCard.registeredEmail = email
        var query = {cardId: cardId}
        collection.update(query, updatedArtCard, function( err, result ) {
          //Update callback
          if (err) console.log(err)
          return callback(null, {
            statusCode: 200,
            body: JSON.stringify(result)
          })
        })
      })
    })
  } catch(err) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify(err)
    });
  }

}

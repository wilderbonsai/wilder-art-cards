//POST {'cardId','email','cardPin}


//Set card status to pending transfer

'use strict'
var MongoClient = require('mongodb').MongoClient;
var passwordHash = require('password-hash');
var transfersUtil = require('./util/transfers')

/* export our lambda function as named "handler" export */
exports.handler = (event, context, callback) => {
  const data = JSON.parse(event.body)
  const { email, cardId, pin } = data
  //TODO Validate cardId, Pin, and toEmail existing
  var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
  // //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    MongoClient.connect(uri, function (err, client) {
      if (err) console.log(err)
      const collection = client.db("wilderCommunity").collection("artCards");
      var query = {cardId: cardId};
      collection.findOne(query, function (err, result) {
        try {
          //find one callback
          const card = result

          if (!passwordHash.verify(pin, result.pinHash)) {
            return callback(null, incorrectPinResponse)
          }

          const transferCollection = client.db("wilderCommunity").collection("artCardTransfers");
          transferCollection.insert(createTransferDocument(result, email), function (err, result) {
            if (err) console.log(err)
            //TODO Send Email Notifiying The Current Registered
            return callback(null, {
              statusCode: 200,
              body: JSON.stringify(result)
            })
          })
        } catch(err) {
          console.log(err)
        }
      })
    })
  } catch(err) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify(err)
    });
  }

}

function createTransferDocument(card, email) {
  var date = new Date();

  var transfer = {
    cardId: card.cardId,
    from: card.registeredEmail,
    to: email,
    status: 'requested',
    createdAt: date.toISOString()
  }

  const transferHash = passwordHash.generate(transfersUtil.createTransferToken(transfer))
  transfer.transferHash = transferHash
  return transfer
}

const incorrectPinResponse = {
  statusCode: 400,
  body: JSON.stringify({
    code: 'incorrect_pin',
    message: 'The pin/id combination does not match'
  })
}
//POST {transferHash, cardId}

//Check from email is same as cardId
'use strict'
var MongoClient = require('mongodb').MongoClient;

const missingFieldResponse = (field) => {
  return {
    statusCode: 400,
    body: JSON.stringify({
      code: 'missing_field',
      message: `Required field ${field} is missing`
    })
  };
}

const transferNonExistentResponse =  {
  statusCode: 404,
  body: JSON.stringify({
    code: 'non_existent',
    message: `Transfer Request does not exist`
  })
};

/* export our lambda function as named "handler" export */
exports.handler = (event, context, callback) => {
  const data = JSON.parse(event.body)
  const { cardId, transferHash } = data
  if(!cardId) return callback(null, missingFieldResponse('cardId'));
  if(!transferHash) return callback(null, missingFieldResponse('transferHash'));

  var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
  // //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    MongoClient.connect(uri, function (err, client) {
      if (err) console.log(err)
      const collection = client.db("wilderCommunity").collection("artCardTransfers");

      let transfer = {}
      //Check if this transfer request exists
      var query = {cardId: cardId, transferHash: transferHash, status:'requested'};
      collection.findOne(query, function(err, result) {
        if (err) console.log(err)
        if (!result) return callback(null, transferNonExistentResponse)
        transfer = result;
        //Change all pending requests to rejected and then change the correct one to accepted
        collection.updateMany({cardId: cardId}, {$set: {status: 'rejected'}}, function () {
          if (err) console.log(err)
          var query = {cardId: cardId, transferHash: transferHash};
          var date = new Date();
          collection.update(query, {$set: {status: 'accepted', acceptedAt: date.toISOString()}}, function (err, result) {
            if (err) console.log(err)
            //Update original card with new email
            const collection = client.db("wilderCommunity").collection("artCards");
            collection.update({cardId:cardId}, {$set: {registeredEmail: transfer.to, active: true}}, function() {
              return callback(null, {
                statusCode: 200,
                body: JSON.stringify(result)
              })
            })
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



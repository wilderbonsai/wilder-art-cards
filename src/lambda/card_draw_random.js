'use strict'
var shuffle = require('lodash.shuffle');
var MongoClient = require('mongodb').MongoClient;


/* export our lambda function as named "handler" export */
exports.handler = (event, context, callback) => {
  var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
  // //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
   context.callbackWaitsForEmptyEventLoop = false;
    MongoClient.connect(uri, function (err, client) {
      if(err) console.log(err)
      try {
        const collection = client.db("wilderCommunity").collection("artCards");

        var query = {active: true};
        collection.find(query).toArray(function(err, result) {
          const random = getRandom(result)
          return callback(null, {
            statusCode: 200,
            body: JSON.stringify(random)
          })
        })
      } catch(err) {
        return callback(null, {
          statusCode: 500,
          body: JSON.stringify(err)
        })
      }
    });

}


function getRandom(arr) {
  return shuffle(arr)[0]
}

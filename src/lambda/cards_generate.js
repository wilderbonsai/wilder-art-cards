'use strict'

var MongoClient = require('mongodb').MongoClient;
var randomstring = require('randomstring');
var passwordHash = require('password-hash');

/* export our lambda function as named "handler" export */
exports.handler = (event, context, callback) => {
  const data = JSON.parse(event.body)
  let amount = data.amount
  if(!amount) amount = 5;
  //MONGODB_ATLAS_CLUSTER_URI=mongodb+srv://wildercommunity:ZRCHpsEVvK86Jvt@wildercommunity-ma8ia.mongodb.net/test?retryWrites=true
  var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];

  //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
   context.callbackWaitsForEmptyEventLoop = false;

  try {
    MongoClient.connect(uri,{ useNewUrlParser: true }, function (err, client) {
      if(err) console.log(err)
      const collection = client.db("wilderCommunity").collection("artCards");
      collection.countDocuments().then(function(count) {
        const newCards = generateCards(count+1, amount)
        const cardPins = extractPinsFromCards(newCards)

        collection.insertMany(newCards, function (err, result) {
          const cards = mergePinsToCards(result.ops, cardPins);
          return callback(null, {
            statusCode: 200,
            body: JSON.stringify(cards),
            headers : {
              "Access-Control-Allow-Methods" : "*",
              "Access-Control-Allow-Origin" : "*",
              "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
            },
          })
        })
      })

    });
  } catch(err) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify(err)
    })
  }
}

function generateCards(startId, amount) {
  var newCards = []
  for(var i = 0; i < amount; i++) {
    let pin = randomstring.generate({
      length: 4,
      charset:'alphanumeric',
      capitalization: 'uppercase',
      readable: true
    })
    let cardId = startId+i
    var hashedPassword = passwordHash.generate(pin)
    newCards.push({cardId: cardId, active: true, pinHash: hashedPassword, pin:pin})
  }
  return newCards;
}

function extractPinsFromCards(cards) {
  var cardPins = []
  cards.forEach(function(card) {
    cardPins[card.cardId] = card.pin
    delete card.pin
  })

  return cardPins
}

function mergePinsToCards(cards,pins) {
  cards.forEach(function(card) {
    card.pin = pins[card.cardId]
  })

  return cards;
}

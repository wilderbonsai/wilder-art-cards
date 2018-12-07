function createTransferToken(card) {
  return `${card.cardId}-${card.registeredEmail}-${card.transterToEmail}`;
}

module.exports = {
  createTransferToken: createTransferToken,
}
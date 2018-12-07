function createTransferToken(transfer) {
  return `${transfer.cardId}-${transfer.from}-${transfer.to}`;
}

module.exports = {
  createTransferToken: createTransferToken,
}
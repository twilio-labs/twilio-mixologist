const {
  sendMessage,
  sendMessageToAll,
  sendMessageToAllOpenOrders
} = require('./twilio');

async function requestHandler(req, res, next) {
  const { sendTo, message, identity } = req.body;
  try {
    let notification;
    if (sendTo === 'all') {
      notification = await sendMessageToAll(message);
    } else if (sendTo === 'activeOrders') {
      notification = await sendMessageToAllOpenOrders(message);
    } else if (sendTo === 'individual') {
      notification = await sendMessage(identity, message);
    }
    if (notification) {
      req.log.info(`Sent notification ${notification.sid}`);
      res.send({ sid: notification.sid });
    } else {
      res.send({});
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).send(err.message);
  }
}

module.exports = { handler: requestHandler };

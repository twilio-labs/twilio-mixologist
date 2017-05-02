

function listOrders(req, res, next) {
  res.render('orders-index');
}

function getCreatePage(req, res, next) {
  res.render('orders-create')
}

function createOrder(req, res, next) {
  res.render('orders-index');
}

function getOrder(req, res, next) {
  res.render('orders-details');
}

function getEditOrderPage(req, res, next) {
  res.render('orders-index');
}

function editOrder(req, res, next) {
  res.render('orders-edit');
}

function getDeleteOrderPage(req, res, next) {
  res.render('orders-delete');
}

function deleteOrder(req, res, next) {
  res.render('orders-index');
}

const router = require('express').Router();
router.get('/', listOrders);
router.get('/create', getCreatePage);
router.post('/', createOrder);
router.get('/:orderId', getOrder);
router.get('/:orderId/edit', getEditOrderPage);
router.post('/:orderId/edit', editOrder);
router.get('/:orderId/delete', getDeleteOrderPage);
router.post('/:orderId/delete', deleteOrder);
router.delete('/:orderId', deleteOrder);

module.exports = router;
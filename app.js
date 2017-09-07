const express = require('express');
const bodyparser = require('body-parser');
const Sequelize = require('sequelize');

//Configure server
const server = express();

//Body-parser
server.use(bodyparser.urlencoded({ extended: false }));

/******** ITEM SCHEMA ********/
//Create db
const db = new Sequelize('vending_machine', 'savannahlowder', '', {
    dialect: 'postgres',//TODO: npm install pg --> done
});

//TODO: run create db "vending_machine" in terminal --> done

//Create schema
const Item = db.define('item', {
    name: Sequelize.STRING(10),
    description: Sequelize.STRING(20),
    cost: Sequelize.INTEGER,
    quantity: Sequelize.INTEGER,
});

//Sync schema
Item.sync().then(function () {
    console.log('item syncd');

    // Item.create ({
    //   name: 'Extra',
    //   description: 'Gum',
    //   cost: 1,
    //   quantity: 10,
    // });
});

/******** PURCHASES SCHEMA ********/
const Purchases = db.define('purchases', {
  name: Sequelize.STRING(10),
  cost: Sequelize.INTEGER,
})

//Sync schema
Purchases.sync().then(function () {
  console.log('purchases syncd');
});

/******** CUSTOMERS ********/
//Get request to display list of current items
server.get('/api/customer/items', function (req, res) {
  Item.findAll().then(function (item) {
    res.json(item);
  })
});

//Post request for purchasing an item
server.post('/api/customer/items/:itemId/purchases', function (req, res) {
  const id = parseInt(req.params.itemId);
  const amountPaid = req.body.amountPaid;
  let amountOwed = 0;
	Item.find({ where: {
    id: id
    }
}).then(function (item) {
    if ( item.cost <= amountPaid && item.quantity > 0 ) {
      amountOwed = amountPaid - item.cost
      let quantity = item.quantity
      Item.update({
        quantity: quantity - 1
      }, {
        where: {
          id: id,//_id is mongo specific, don't need it in sequelize
        }
}).then(function (item) {
        res.json({
          'status': 'success',
          'item': id,
          'itemName': item.name,
          'cost': item.cost,
          'amountPaid': amountPaid,
          'amountOwed': amountOwed
        })
      })
//Create row purchase table for the item that was purchased
      Purchases.create({
        name: item.name,
        cost: item.cost,
      })
} else if ( item.cost >= amountPaid && item.quantity === 0 ){
      res.json({
        'status': 'error',
        'item': id,
        'itemName': item.name,
        'cost': item.cost,
        'amountPaid': amountPaid,
      });
    }
//Item out of stock
  }).catch(function (item){
    res.json({
      'status': 'out of stock',
    });
  });
});

/******** VENDORS ********/
//Get request for vendors to see list of purchases
server.get('/api/vendor/purchases', function (req, res) {
  Purchases.findAll().then(function (purchases) {
    res.json(purchases);
  })
})

//Get request to see money in machine
server.get('/api/vendor/money', function (req, res) {
  Purchases.findAll().then(function (purchases) {
    let machineTotal = 0;
    for ( let i = 0; i < purchases.length; i++ ) {
      machineTotal += purchases[i].cost
    }
    res.json({
      'machineTotal': machineTotal,
    })
  });
});

//Post request for vendors to add new item
server.post('/api/vendor/items', function (req, res) {
  Item.create({
    name: req.body.name,
    description: req.body.description,
    cost: parseFloat(req.body.cost),
    quantity: parseInt(req.body.quantity),
  }).then(function (items) {
    res.json({
      'status': 'added',
      'name': req.body.name,
      'description': req.body.description,
      'cost': parseFloat(req.body.cost),
      'quantity': parseInt(req.body.quantity),
    });
  })
});

server.listen(4000, function () {
  console.log('yeet');
});




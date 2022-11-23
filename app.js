var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const Web3 = require('web3');
const contract = require('truffle-contract');
const artifacts = require('./build/contracts/OpenSign.json');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

if (typeof web3 !== 'undefined') {
  var web3 = new Web3(web3.currentProvider)
} else {
  let network = process.env.GANACHE_NETWORK;
  var web3 = new Web3(new Web3.providers.HttpProvider(network))
  
  // TODO: after this is ready, move to Ropsten TestNet
  // var web3 = new Web3(new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/0a9e187089314ee885161954501f4f9d"))
}

const LMS = contract(artifacts)
LMS.setProvider(web3.currentProvider)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

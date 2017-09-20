var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
server.listen(80);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
var sendmy ='';
// http.get('http://data.bter.com/api2/1/marketlist',(res) =>{
//   res.setEncoding('utf8');
//   let rawData = '';
//   res.on('data', (chunk) => { rawData += chunk; });
//   res.on('end', () => {
//       const parsedData = JSON.parse(rawData);
//       console.log(parsedData);
//   });
// })
var coinData =function(callback){
  //汇率查询
  function huilv(){
    return new Promise(function(resolve,reject){
      console.log('start')
      http.get('http://api.k780.com:88/?app=finance.rate&scur=USD&tcur=CNY&appkey=28391&sign=30139467983e695395494daabd41e74e',(res)=>{
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          const parsedData = JSON.parse(rawData);
          console.log('first'+rawData);
          if(parsedData.result && parsedData.result.rate){
            const rate = parsedData.result.rate || "";
            const update = parsedData.result.update;
            console.log(rate)
            resolve(rate,update)
          }
        });
      })
    })
  }
  //bitfinex 基准
  function getFinex(rate,update){
    return new Promise(function() {
      http.get('https://api.bitfinex.com/v2/tickers?symbols=tBTCUSD,tLTCUSD,tETHUSD,tETCUSD,tZECUSD,tXMRUSD,tDASHUSD,tIOTAUSD,tEOSUSD,tOMGUSD,tBCHUSD,tRRTUSD,tBCCUSD,tBCUUSD,tXRPUSD,tSANUSD,tNEOUSD',(res)=>{
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data',(chunk) => {rawData += chunk;});
        res.on('end',() =>{
          const parsedData = JSON.parse(rawData);
          //数据处理
          let outdata = {
            'BTC':{'CNY':'','USD':parsedData[0][7],'Percent':''}
          }
          resolve(rate,update)
        })
      })
    })
  }
  //比特儿api
  function getBiter(rate,update) {
    return new Promise(function (resolve, reject) {
      http.get('http://data.bter.com/api2/1/marketlist',(res) =>{
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
            resolve(rate,update,sendmy)
        });
      })
    });
  }
  // 0.5秒后返回input+input的计算结果:
  function add() {
    return new Promise(function (resolve, reject) {
      http.get('http://data.bter.com/api2/1/marketlist',(res) =>{
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            const parsedData = JSON.parse(rawData);
            sendmy = sendmy+JSON.stringify(parsedData);
            console.log(parsedData);
        });
      })
      resolve(sendmy);
    });
  }

  var p = new Promise(function (resolve, reject) {
    resolve();
  });
  p.then(huilv)
  .then(function (result) {
    callback(result);
  });
}
io.on('connection', function (socket) {
  coinData(function (msg) {
    socket.volatile.emit('send data', msg);
  });
  var tweets = setInterval(function () {
    coinData(function (msg) {
      socket.volatile.emit('send data', msg);
    });
  }, 120000);

  socket.on('disconnect', function () {
    clearInterval(tweets);
  });
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

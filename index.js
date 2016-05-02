var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 3000));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.get('*', function (req, res) {
  res.send('It works!');
});

var server = app.listen(app.get('port'));
var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
  var addedUser, routeId;

  //when client first connects
  socket.on('add user to van', function (data) {
    addedUser = true;
    routeId = data.routeId;
    // store the user in the socket session for this client
    socket.user = data.user;
    // join the route
    socket.join(routeId);
  });

  // when the route starts, emits 'driver location updated' every 'n' seconds
  socket.on('update driver location', function (location) {
    // console.log('update driver location');
    if(location) { // Only driver has a location
      // echo globally that a driver has changed location
      io.sockets.in(routeId).emit('driver location updated', location);
    }
  });

  // when the route stops, emits 'driver location stopped'
  socket.on('clear driver location', function () {
    // console.log('clear driver location');
    // echo globally that the driver's location is not available anymore
    io.sockets.in(routeId).emit('driver location stopped');
  });

  // when an action requires to update the map markers, emits 'user bypassed'
  socket.on('redraw markers', function () {
    // console.log('redraw markers');
    // echo globally to redraw the map markers
    io.sockets.in(routeId).emit('markers redrawed');
  });

  // when the driver disconnects.. perform this
  socket.on('disconnect', function () {
    // console.log('disconnect');
    if(addedUser && socket.user.driver) {
      socket.broadcast.to(routeId).emit('driver location stopped');
    }
  });
});

const mongoose = require('mongoose');

mongoose.connect(process.env.mongo_URI, {
  useNewUrlParser: true,   
  useUnifiedTopology: true
}).then( res => console.log('Base de datos conectada!!'))
  .catch( err => console.log('Error al conectar la base de datos!!'))

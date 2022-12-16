const { fork } = require('child_process')
const { Router } = require('express');
const router = Router();
const { logger_info } = require('../logger/log_config');


router.get('/', (req, res) => {
  
  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);

  let { cant } = req.query;
  if(!cant) cant = 1e10;  // puse este nro porq demora mucho en mi pc un nro mas grande

  const calculo = fork('./child_calculo/calculo.js')
  calculo.send(cant);

  calculo.on('message', (calculo) => {
    res.send({cant, calculo});
  })
})

module.exports = router;
const { fork } = require('child_process')

const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
  
  let { cant } = req.query;
  if(!cant) cant = 1e10;  // puse este nro porq demora mucho en mi pc un nro mas grande

  const calculo = fork('./child_calculo/calculo.js')
  calculo.send(cant);

  calculo.on('message', (calculo) => {
    res.send({cant, calculo});
  })
})

module.exports = router;
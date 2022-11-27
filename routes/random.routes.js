const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
  
  let { cant } = req.query;
  if(!cant) cant = 1e10;  // puse este nro porq demora mucho en mi pc un nro mas grande

  let result = 0;

  for (let i = 0; i < cant; i++) result += i;

  res.send({cant, result})
})

module.exports = router;
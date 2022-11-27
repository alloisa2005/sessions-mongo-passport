const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
  
  let { cant } = req.query;
  if(!cant) cant = 0;
  
  res.send({res: 'Random', cant})
})

module.exports = router;
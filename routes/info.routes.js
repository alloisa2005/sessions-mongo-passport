const { Router } = require('express');
const router = Router();
const yargs = require('yargs');
const core = require('os');

router.get('/', (req, res) => {

  res.send({
    argumentos: yargs.argv,    
    plataforma: process.platform,
    node_version: process.version,
    memoria_rss: process.memoryUsage().rss,
    path: process.execPath,
    pid: process.pid, 
    carpeta: process.cwd(),
    procesadores: core.cpus().length,
  })  
})


module.exports = router;
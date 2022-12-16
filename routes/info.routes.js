const { Router } = require('express');
const router = Router();
const yargs = require('yargs');
const core = require('os');
const { logger_dev } = require('../logger/log_config');

router.get('/', (req, res) => {

  logger_dev.info(`Ruta "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  res.send({
    argumentos: yargs.argv,    
    plataforma: process.platform,
    node_version: process.version,
    memoria_rss: process.memoryUsage().rss,
    path: process.execPath,
    pid: process.pid, 
    carpeta: process.cwd(),
    nro_procesadores: core.cpus().length,
  })  
})


module.exports = router;
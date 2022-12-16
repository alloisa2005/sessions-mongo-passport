const log4js = require('log4js');

log4js.configure({  
  appenders: {
    consola: { type: "console" },
    file_info: { type: "file", filename: "./logger/files/info.log" },
    file_error: { type: "file", filename: "./logger/files/error.log" },
    file_warning: { type: "file", filename: "./logger/files/warning.log" },
  },
  categories: {
    default: {
      appenders: ["consola"],
      level: "all"
    },
    DEV: {
      appenders: ["file_info"],
      level: "all"
    }
  }
});

const logger_dev = log4js.getLogger('DEV');

module.exports = { logger_dev };
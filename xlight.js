#!/usr/bin/env node
var argv = require('yargs')
.usage('Usage: $0 <command> [options]')
.help('h')
.alias('h', 'help')
.option('p', {
       alias: 'port',
       demandOption: false,
       default: 36000,
       describe: 'Specifies the http server port',
       type: 'number'
   })
.option('u', {
        required:false,
       alias: 'udp',
       demandOption: false,
       default: 7755,
       describe: 'Specifies the UDP light port',
       type: 'number'
   })
.epilog('copyright 2017 xperiments')
.argv;

'use strict';

const Bravia = require('bravia');

module.exports = (RED) => {
  class BraviaIrccNode {
    constructor(config) {
      RED.nodes.createNode(this, config);

      this.tv = RED.nodes.getNode(config.tv);
      this.ircc = config.ircc;
      this.name = config.name;

      let node = this;
      this.on('input', msg => {
        let codes = (node.ircc || msg.payload);
        let promises = [];

        if (!codes) {
          node.error('No IRCC code given. Specify either in the config or via msg.payload!');
          return;
        }

        if (typeof codes === 'object' && !Array.isArray(codes)) {
          codes = [codes];
        }

        if (typeof codes === 'string') {
          codes = codes.split(',');
        }

        for (let code of codes) {
          promises.push(new Promise((resolve, reject) => {
            let promise;

            if (typeof code === 'object') {
              if (code.value) {
                promise = node.tv.sendIRCC(code.value);
              } else {
                promise = node.tv.sendCode(code.name);
              }
            } else {
              promise = node.tv.sendCode(code);
            }

            promise
              .then(resolve)
              .catch(reject);
          }));
        }

        node.status({ fill: 'blue', shape: 'dot', text: 'Sending...' });
        Promise.all(promises)
          .then(() => {
            node.status({ fill: 'green', shape: 'dot', text: 'Successful' });
            setTimeout(() => node.status({}), 3000);
          })
          .catch(error => {
            node.error(error);
            node.status({ fill: 'red', shape: 'dot', text: 'Failed' });
            setTimeout(() => node.status({}), 3000);
          });
      });
    }
  }

  RED.nodes.registerType('bravia-ircc', BraviaIrccNode);

  RED.httpAdmin.get('/bravia/ircc', (request, response) => {
    if (!request.query.host || !request.query.port || !request.query.psk) {
      response.status(500).send('Missing arguments.');
    } else {
      let bravia = new Bravia(request.query.host, request.query.port, request.query.psk);
      bravia.getIRCCCodes()
        .then(commands => response.end(JSON.stringify(commands)))
        .catch(error => response.status(500).send(error.message));
    }
  });
};

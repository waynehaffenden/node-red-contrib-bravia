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
        if (!codes) {
          node.error('No IRCC code given. Specify either in the config or via msg.payload!');
          return;
        }

        if (typeof codes === 'string') {
          codes = codes.split(',');
        }

        node.status({ fill: 'blue', shape: 'dot', text: 'Sending...' });
        node.tv.sendIRCC(codes)
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

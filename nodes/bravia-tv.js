'use strict';

const Bravia = require('bravia');

module.exports = (RED) => {
  class BraviaTvNode {
    constructor(config) {
      RED.nodes.createNode(this, config);

      this.name = config.name;
      this.host = config.host;
      this.port = config.port;
      this.psk = config.psk;
      this.timeout = config.timeout || 5000;
      this.node = this;

      if (this.host && this.port && this.psk) {
        this.bravia = new Bravia(this.host, this.port, this.psk, this.timeout);
      }
    }

    invoke(protocol, method, version, payload) {
      if (!this.bravia) {
        this.node.error('The Sony BRAVIA TV is not configured properly, please check your settings.');
        return;
      }

      return this.bravia[protocol].invoke(method, version, payload);
    }

    sendIRCC(codes) {
      if (!this.bravia) {
        this.node.error('The Sony BRAVIA TV is not configured properly, please check your settings.');
        return;
      }

      return this.bravia.send(codes);
    }
  }

  RED.nodes.registerType('bravia-tv', BraviaTvNode);

  RED.httpAdmin.get('/bravia/discover', (request, response) => {
    Bravia.discover()
      .then(devices => response.end(JSON.stringify(devices)))
      .catch(error => response.status(500).send(error.message));
  });
};

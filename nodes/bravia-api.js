'use strict';

const Bravia = require('bravia');

module.exports = (RED) => {
  class BraviaApiNode {
    constructor(config) {
      RED.nodes.createNode(this, config);

      this.tv = RED.nodes.getNode(config.tv);
      this.method = config.method;
      this.payload = config.payload;
      this.name = config.name;

      let node = this;
      this.on('input', msg => {
        let method = (node.method || msg.method);
        if (!method) {
          node.error('No method given. Specify either in the config or via msg.method!');
          return;
        }

        let parts = method.split(':');
        if (parts.length !== 3) {
          node.error(`Invalid method string "${method}". It must be in the format "protocol:version:method."`);
          return;
        }

        let payload = (node.payload || msg.payload);
        if (payload && typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch(e) {
            node.error(`Invalid JSON payload: ${payload}`);
            return;
          }
        }

        node.status({ fill: 'blue', shape: 'dot', text: 'Invoking...' });
        node.tv.invoke(parts[0], parts[2], parts[1], payload)
          .then(response => {
            msg.payload = response;
            node.send(msg);
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

  RED.nodes.registerType('bravia-api', BraviaApiNode);

  RED.httpAdmin.get('/bravia/methods', (request, response) => {
    if (!request.query.host || !request.query.port || !request.query.psk) {
      response.status(500).send('Missing arguments.');
    } else {
      let bravia = new Bravia(request.query.host, request.query.port, request.query.psk);
      let protocols = bravia.protocols;
      let methods = [];
      let index = 0;

      let next = (results) => {
        if (results) {
          methods.push({ protocol: protocols[index - 1], versions: results });
        }

        if (index < protocols.length) {
          bravia[protocols[index++]].getMethodTypes()
            .then(next)
            .catch(_ => next());
        } else {
          if (methods.length > 0) {
            response.end(JSON.stringify(methods));
          } else {
            response.status(500).send("Error getting methods, check the connection to your TV.")
          }
        }
      };

      next();
    }
  });

  RED.httpAdmin.get('/bravia/method', (request, response) => {
    if (!request.query.host || !request.query.port || !request.query.psk || !request.query.protocol || !request.query.version || !request.query.method) {
      response.status(500).send('Missing arguments.');
    } else {
      let bravia = new Bravia(request.query.host, request.query.port, request.query.psk);
      try {
        bravia[request.query.protocol].getMethodTypes(request.query.version)
          .then(version => response.end(JSON.stringify(version.methods.find(method => method[0] === request.query.method))))
          .catch(error => response.status(500).send(error.message));
      } catch (e) {
        response.status(500).send(e.message);
      }
    }
  });
}

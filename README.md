# Sony BRAVIA Node-RED Nodes

This package contains nodes to control Sony BRAVIA Android TVs from Node-RED.

## Setup

### TV Setup

* Turn on your TV
* On the TV go to Settings > Network > Home network setup > Remote device/Renderer > On
* On the TV go to Settings > Network > Home network setup > IP Control > Authentication > Normal and Pre-Shared Key
* On the TV go to Settings > Network > Home network setup > Remote device/Renderer > Enter Pre-Shared Key > 0000 (or whatever you want your PSK Key to be)
* On the TV go to Settings > Network > Home network setup > Remote device/Renderer > Simple IP Control > On

### Install with NPM

``` npm install node-red-contrib-bravia --save ```

## Usage

There are 2 new nodes which appear in the category 'devices' in your Node-Red palette. Use the config node to set the hostname, port and PSK of your TV.

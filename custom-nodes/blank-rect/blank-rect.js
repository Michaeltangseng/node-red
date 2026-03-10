/**
 * Simple "blank rectangle" node that holds layout metadata
 * such as background color, width and height. It does not
 * process messages and has 0 inputs / 0 outputs.
 */

module.exports = function(RED) {
    "use strict";

    function BlankRectNode(config) {
        RED.nodes.createNode(this, config);

        // Store visual config on the node instance for reference
        this.bgColor = config.bgColor || "#FFEFD5";
        this.width = Number(config.width || 200);
        this.height = Number(config.height || 120);
        this.note = config.note || "";

        var node = this;

        // This node is just a visual/layout element; it does nothing on input.
        // However, if someone wires it by mistake, we simply pass messages through.
        this.on("input", function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };
            send(msg);
            if (done) done();
        });

        this.on("close", function() {
            // No resources to clean up.
        });
    }

    RED.nodes.registerType("blank-rect", BlankRectNode);
};


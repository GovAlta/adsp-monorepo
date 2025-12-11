"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonSocketMessenger = void 0;
const perf_hooks_1 = require("perf_hooks");
const consume_messages_from_socket_1 = require("../../utils/consume-messages-from-socket");
const socket_utils_1 = require("../socket-utils");
class DaemonSocketMessenger {
    constructor(socket) {
        this.socket = socket;
    }
    async sendMessage(messageToDaemon, force) {
        perf_hooks_1.performance.mark('daemon-message-serialization-start-' + messageToDaemon.type);
        const serialized = (0, socket_utils_1.serialize)(messageToDaemon, force);
        perf_hooks_1.performance.mark('daemon-message-serialization-end-' + messageToDaemon.type);
        perf_hooks_1.performance.measure('daemon-message-serialization-' + messageToDaemon.type, 'daemon-message-serialization-start-' + messageToDaemon.type, 'daemon-message-serialization-end-' + messageToDaemon.type);
        this.socket.write(serialized);
        // send EOT to indicate that the message has been fully written
        this.socket.write(consume_messages_from_socket_1.MESSAGE_END_SEQ);
    }
    listen(onData, onClose = () => { }, onError = (err) => { }) {
        this.socket.on('data', (0, consume_messages_from_socket_1.consumeMessagesFromSocket)(async (message) => {
            onData(message);
        }));
        this.socket.on('close', onClose);
        this.socket.on('error', onError);
        return this;
    }
    close() {
        this.socket.destroy();
    }
}
exports.DaemonSocketMessenger = DaemonSocketMessenger;

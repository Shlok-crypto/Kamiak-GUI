const { Client } = require('ssh2');
const net = require('net');

// Get arguments
// Usage: node tunnel_script.js <host> <username> <password> <privateKey> <remoteHost> <remotePort> <localPort>
const args = process.argv.slice(2);
const host = args[0];
const username = args[1];
const password = args[2];
const privateKey = args[3];
const remoteHost = args[4];
const remotePort = args[5];
const localPort = args[6];

if (!host || !username || !remoteHost || !remotePort || !localPort) {
    console.error('Usage: node tunnel_script.js <host> <username> <password> <privateKey> <remoteHost> <remotePort> <localPort>');
    process.exit(1);
}

const conn = new Client();
const config = {
    host: host,
    port: 22,
    username: username,
};

if (password && password !== 'null' && password !== 'undefined') {
    config.password = password;
}
if (privateKey && privateKey !== 'null' && privateKey !== 'undefined') {
    // Handle potential newlines passed as string literals if necessary, though spawn usually passes correctly
    config.privateKey = privateKey.replace(/\\n/g, '\n');
}

conn.on('ready', () => {
    console.log('SSH Connection Ready');

    const server = net.createServer((socket) => {
        conn.forwardOut('127.0.0.1', 12345, remoteHost, parseInt(remotePort), (err, stream) => {
            if (err) {
                console.error('Forwarding error:', err);
                socket.end();
                return;
            }
            socket.pipe(stream).pipe(socket);
        });
    });

    server.listen(parseInt(localPort), '127.0.0.1', () => {
        console.log(`Tunnel listening on 127.0.0.1:${localPort} -> ${remoteHost}:${remotePort}`);
    });

    server.on('error', (err) => {
        console.error('Tunnel server error:', err);
        conn.end();
    });

}).on('error', (err) => {
    console.error('SSH Connection Error:', err);
}).connect(config);

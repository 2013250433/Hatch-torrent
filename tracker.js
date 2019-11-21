const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        let announceReq;
        if (respType(response) === 'connect'){
            const connResp = parseConnResp(response);
            announceReq = buildAnnounceReq(connResp.connectionId);
            udpSend(socket, announceReq, url);
        } else if(respType(response) === 'announce'){
            announceReq = parseAnnounceResp(response);
            callback(announceReq.peers);
        }
    })
}

function udpSend(socket, message, rawUrl, callback=()=>{}){
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp){

}

function parseConnResp(resp){

}

function buildAnnounceReq(connId){

}
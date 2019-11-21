const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');

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

/*
    BEP: connection request
    Offset  Size            Name            Value
    0       64-bit integer  connection_id   0x41727101980
    8       32-bit integer  action          0 // connect
    12      32-bit integer  transaction_id  ? // random
    16 
*/

function buildConnReq(){
    const buf = Buffer.alloc(16);
    
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    buf.writeUInt32BE(0, 8);
    crypto.randomBytes(4).copy(buf,12);

    return buf;
}

function respType(resp){

}

/*  
    BEP: connect response
    Offset  Size            Name            Value
    0       32-bit integer  action          0 // connect
    4       32-bit integer  transaction_id
    8       64-bit integer  connection_id
*/

function parseConnResp(resp){
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.reqdUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId){

}
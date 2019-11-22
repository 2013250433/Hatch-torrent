const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');

const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        let announceReq;
        if (respType(response) === 'connect'){
            const connResp = parseConnResp(response);
            announceReq = buildAnnounceReq(connResp.connectionId, torrent);
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

/*
    BEP: IPv4 announce request

    Offset  Size    Name    Value
    0       64-bit integer  connection_id
    8       32-bit integer  action          1 // announce
    12      32-bit integer  transaction_id
    16      20-byte string  info_hash
    36      20-byte string  peer_id
    56      64-bit integer  downloaded
    64      64-bit integer  left
    72      64-bit integer  uploaded
    80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
    84      32-bit integer  IP address      0 // default
    88      32-bit integer  key
    92      32-bit integer  num_want        -1 // default
    96      16-bit integer  port
    98
*/

function buildAnnounceReq(connId, torrent, port=6882){
    const buf = Buffer.allocUnsafe(98);
    connId.copy(buf,0);
    buf.writeUInt32BE(1,8);
    crypto.randomBytes(4).copy(buf,12);
    //info hash
    torrentParser.info_hash(torrent).copy(buf,16);
    util.getId().copy(buf,36);
    Buffer.alloc(8).copy(buf,56);
    //left
    torrentParser.size(torrent).copy(buf,64);
    Buffer.alloc(8).copy(buf,72);
    buf.writeUInt32BE(buf,80);
    buf.writeUInt32BE(buf,84);
    crypto.randomBytes(4).copy(buf,88);
    buf.writeInt32BE(-1,92);
    buf.writeUInt16BE(port,96);

    return buf;
}

/*
    Offset      Size            Name            Value
    0           32-bit integer  action          1 // announce
    4           32-bit integer  transaction_id
    8           32-bit integer  interval
    12          32-bit integer  leechers
    16          32-bit integer  seeders
    20 + 6 * n  32-bit integer  IP address
    24 + 6 * n  16-bit integer  TCP port
    20 + 6 * N
*/

function parseAnnounceResp(res){
    return{
        action: res.readUInt32BE(0),
        transactionId: res.readUInt32BE(4),
        leechers: res.readUInt32BE(8),
        seeders: res.readUInt32BE(12),
        peers: group(res.slice(20), 6).map(address =>{
            return {
                ip: address.slice(0,4).join('.'),
                port: address.readUInt32BE(4)
            }
        })
    }
}

function group(iterable, groupSize){
    let groups = [];
    for(let i=0; i<iterable.length; i+=groupSize){
        groups.push(iterable.slice(i, i+groupSize));
    }
    return groups;
}
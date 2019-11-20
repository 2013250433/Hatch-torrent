const fs = require('fs');
const bencode = require('bencode');

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;

const torrent = bencode.decode(fs.readFileSync('test.torrent'));

const url = urlParse(torrent.announce.toString('utf8'));
const socket = dgram.createSocket('udp4');
const myMsg = Buffer.from('test','utf8');

//will not get result because the message is not in format
socket.send(myMsg, 0, myMsg.length, url.port, url.host, ()=>{});
socket.on('message', msg=>{
    console.log('message:',msg);
})

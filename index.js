const fs = require('fs');
const bencode = require('bencode');
const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser');

const torrent = torrentParser.open('test.torrent');

tracker.getPeers(torrent, peers => {
    console.log('list of peers', peers);
})
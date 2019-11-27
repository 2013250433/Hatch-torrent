const crypto = require('crypto');
const Buffer = require('buffer').Buffer;

let id = null;

module.exports.getId = ()=>{
    if(!id){
        id = crypto.randomBytes(20);
        Buffer.from('HATCHACT-').copy(id,0);
    }

    return id;
};
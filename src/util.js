const crypto = require('crypto');

let id = null;

module.exports.genId = ()=>{
    if(!id){
        id = crypto.randomBytes(20);
        Buffer.from('HATCHACT-').copy(id,0);
    }
};
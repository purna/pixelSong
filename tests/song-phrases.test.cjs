const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const songsDir = path.join(__dirname, '../data/songs');
const genres = fs.readdirSync(songsDir).filter(name=>name.endsWith('_16step.json')).map(name=>name.replace('_16step.json',''));
function prefix(song,part,length){
 if(part==='rhythm')return Object.fromEntries(Object.entries(song.rhythm).map(([name,steps])=>[name,steps.filter(step=>step<length).sort((a,b)=>a-b)]).filter(([,steps])=>steps.length));
 return Object.fromEntries(Object.entries(song[part]).filter(([key,value])=>value&&Number(key.split('-')[0])<length).sort());
}
test('All 280 songs develop the same phrase across 16, 32 and 64 steps',()=>{
 let total=0;
 for(const genre of genres){
  const variants=Object.fromEntries([16,32,64].map(length=>[length,JSON.parse(fs.readFileSync(path.join(songsDir,`${genre}_${length}step.json`),'utf8')).songs]));
  for(const short of variants[16]){
   const medium=variants[32].find(song=>song.key===short.key),long=variants[64].find(song=>song.key===short.key);
   assert(medium&&long);
   for(const part of ['melody','bass','lead','rhythm']){
    assert.deepEqual(prefix(short,part,16),prefix(medium,part,16),`${genre}/${short.key}/${part}: 16→32`);
    assert.deepEqual(prefix(medium,part,32),prefix(long,part,32),`${genre}/${short.key}/${part}: 32→64`);
   }
   total++;
  }
 }
 assert.equal(total,280);
});

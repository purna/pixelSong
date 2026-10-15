const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const scales = [
 ['C4','D4','E4','F4','G4','A4','B4','C5'], ['G4','A4','B4','C5','D5','E5','F#5','G5'],
 ['F4','G4','A4','Bb4','C5','D5','E5','F5'], ['D4','E4','F4','G4','A4','Bb4','C5','D5'], ['A4','B4','C5','D5','E5','F5','G5','A5']
];
const names = ['kick','snare','hihat','tom','conga','bongo','shaker','cymbal'];
function fixture(protocol = 'https:') {
 const nodes = {}, requests = [];
 const context = {console, structuredClone, URL, Tone:{Transport:{bpm:{value:120}}}, window:{location:{protocol}}, document:{getElementById:id=>nodes[id]||null,querySelector:()=>null,createElement:()=>({})},fetch:async url=>{
  requests.push(url);
  const file=path.join(root,url);
  return {ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};
 }};
 context.document.baseURI='file:///pixelSong/index.html';
 context.document.head={appendChild(script){
  requests.push('bundle');
  queueMicrotask(()=>{
   vm.runInContext(fs.readFileSync(path.join(root,'data/presetBundle.js'),'utf8'),context);
   script.onload();
  });
 }};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'js/presetData.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'js/songDesigner.js'),'utf8')+'\nwindow.TestApp=SongDesignerApp;',context);
 const App=context.window.TestApp;
 App.prototype.setupEventListeners=function(){};
 vm.runInContext(fs.readFileSync(path.join(root,'js/tuneHelper.js'),'utf8'),context);
 function make(length=16,scale=scales[0]) {
  const a=Object.create(App.prototype);
  Object.assign(a,{patternLength:length,tempo:120,currentGroupIndex:0,groupLoopCounts:[1,1,1,1],patternGroups:{harmonics:[],melody:[],bass:[],lead:[],rhythm:[]},bassNotes:['C1','D1','E1','F1','G1','A1','B1','C2','D2','E2','F2','G2'],harmonicNotes:['C3','E3','G3','C4','E4','G4','B4','D5'],getCurrentScale:()=>scale,rhythmVelocity:Object.fromEntries(names.map(n=>[n,new Map()])),notices:[]});
  for(const name of ['melodyVelocity','bassVelocity','leadVelocity','harmonyVelocity'])a[name]=new Map();
  for(const name of ['rebuildGrids','createSectionTimelines','createStepTimeline','updatePatternLengthUI','createSectionRepeatsControl','updateHarmonicsUI'])a[name]=()=>{};
  a.stop=()=>{a.isPlaying=false};a.showNotification=(...args)=>a.notices.push(args);
  return a;
 }
 return {context,nodes,requests,make};
}
test('Tune Helper loads all 27 files at all five scales with complete, bounded parts',async()=>{
 const f=fixture();let count=0;
 for(const scale of scales)for(const length of [16,32,64])for(const mood of ['bright','dreamy','moody'])for(const energy of ['gentle','steady','lively']) {
  const app=f.make(length,scale);await app.createHelperTune({mood,energy});
  assert.equal(app.patternLength,length);assert.equal(app.patternGroups.melody.length,length/16);
  for(let g=0;g<length/16;g++){
   for(const part of ['harmonics','melody','bass','lead'])assert(app.patternGroups[part][g].size>0,part);
   for(const part of ['melody','bass','lead'])for(const [step,row]of app.patternGroups[part][g]){assert(step>=0&&step<16);assert(row>=0&&row<(part==='bass'?12:8));}
   for(const name of ['kick','snare','hihat','conga','bongo','shaker','cymbal'])assert(app.patternGroups.rhythm[g][name].size>0,name);
  }
  assert(app.leadEnabled&&app.percussionEnabled);count++;
 }
 assert.equal(count,135);assert.equal(new Set(f.requests).size,27);
});
test('Melody only preserves backing, failed loads preserve tune and Undo, stale requests cannot apply',async()=>{
 const f=fixture(),app=f.make(32);const backing=app.patternGroups.bass;
 await app.createHelperTune({scope:'melody'});assert.equal(app.patternGroups.bass,backing);
 const prior=app._tuneHelperUndo,melody=app.patternGroups.melody[0];
 f.context.fetch=async()=>({ok:false});await assert.rejects(app.createHelperTune());assert.equal(app._tuneHelperUndo,prior);assert.equal(app.patternGroups.melody[0],melody);
 let resolve;f.context.fetch=()=>new Promise(r=>resolve=r);
 const pending=app.createHelperTune();app.patternLength=64;resolve({ok:true,json:async()=>({})});await assert.rejects(pending,/selection changed/);assert.equal(app.patternGroups.melody[0],melody);
});
test('Full-tune Undo restores stage layout and part state',async()=>{
 const f=fixture(),app=f.make(64),events={};let active=false;
 const stage={stageArea:{},instruments:Object.fromEntries(['melody','rhythm','bass','lead','percussion'].map(n=>[n,{x:23,y:70,movement:'smooth'}])),stageToggle:{classList:{contains:()=>active}},renderMarkers(){},saveToStorage(){},toggleStage(){active=!active}};
 f.context.window.StageManager=stage;const original=structuredClone(stage.instruments);
 f.nodes.undoHelperTune={addEventListener:(_,fn)=>events.undo=fn};f.nodes.createHelperTune={addEventListener:(_,fn)=>events.create=fn};f.nodes.tuneHelperStatus={};
 app.setupEventListeners();await app.createHelperTune();assert.notDeepEqual(stage.instruments,original);events.undo();assert.deepEqual(stage.instruments,original);assert.equal(active,false);
});
test('Every genre loads its real 16/32/64 arrangements into the matching groups',async()=>{
 const f=fixture();vm.runInContext(fs.readFileSync(path.join(root,'js/songPresets.js'),'utf8'),f.context);
 f.nodes.genreSelect={value:''};f.nodes.tempoSlider={};f.nodes.tempoValue={};
 let total=0;
 for(const genre of f.context.window.getAllGenres()){
  f.nodes.genreSelect.value=genre;
  for(const length of [16,32,64]){
   const presets=await f.context.getPresetsByGenre(genre,length);
   for(const [key,preset]of Object.entries(presets)){
    const app=f.make(length);await app.loadSongPreset(key);
    assert.equal(app.notices.at(-1)?.[1],'success',`${genre}/${key}/${length}: ${app.notices.at(-1)}`);
    assert.equal(app.patternGroups.melody.length,length/16);assert.equal(app.tempo,preset.tempo);assert.equal(f.context.Tone.Transport.bpm.value,preset.tempo);assert.equal(Number(f.nodes.tempoSlider.value),preset.tempo);assert.equal(f.nodes.tempoValue.textContent,`${preset.tempo} BPM`);
    for(const part of ['melody','bass','lead']){
     const actual=app.patternGroups[part].flatMap((group,g)=>Array.from(group,([step,row])=>`${g*16+step}-${row}`));
     // A monophonic grid keeps the final row if the source has simultaneous notes.
     const expected=new Map(Object.entries(preset[part]||{}).filter(([,v])=>v).map(([k])=>k.split('-').map(Number)));
     assert.equal(JSON.stringify(actual.sort()),JSON.stringify(Array.from(expected,([step,row])=>`${step}-${row}`).sort()));
    }
    assert(app.patternGroups.harmonics[0].size>0);total++;
   }
  }
 }
 assert.equal(total,840);assert(f.requests.every(url=>url.startsWith('data/')));
});
test('Song cache separates lengths, retries failed requests, and stale song lists cannot win',async()=>{
 const f=fixture();vm.runInContext(fs.readFileSync(path.join(root,'js/songPresets.js'),'utf8'),f.context);
 await f.context.getPresetsByGenre('rock',16);await f.context.getPresetsByGenre('rock',32);const count=f.requests.length;
 await f.context.getPresetsByGenre('rock',16);assert.equal(f.requests.length,count);
 const app=f.make(16);let slow;
 f.context.getPresetsByGenre=genre=>genre==='rock'?new Promise(r=>slow=r):Promise.resolve({new:{name:'New',artist:'Artist'}});
 const select={innerHTML:'',disabled:false,options:[],appendChild(o){this.options.push(o)}};f.nodes.songSelect=select;
 const first=app.populateSongSelect('rock');await app.populateSongSelect('pop');slow({old:{name:'Old',artist:'Artist'}});await first;
 assert.equal(select.options.length,1);assert.equal(select.options[0].value,'new');
});

test('Malformed preset, network failure and rapid song changes never replace the tune', async () => {
 const f=fixture(), app=f.make(16);f.nodes.genreSelect={value:'rock'};f.nodes.tempoSlider={};f.nodes.tempoValue={};
 const previous=app.patternGroups;
 f.context.getSongPreset=async()=>{throw Error('Network unavailable')};
 await app.loadSongPreset('missing');assert.equal(app.patternGroups,previous);assert.equal(app.notices.at(-1)[1],'error');
 let resolve;f.context.getSongPreset=()=>new Promise(r=>resolve=r);
 const pending=app.loadSongPreset('slow');app._songLoadRequest++;resolve({});await pending;assert.equal(app.patternGroups,previous);
 f.context.getSongPreset=async()=>({patternLength:64,tempo:120,harmonics:[0],melody:{},rhythm:{}});
 await app.loadSongPreset('bad');assert.equal(app.patternGroups,previous);
});
test('Failed genre fetch is retried rather than cached', async () => {
 const f=fixture();vm.runInContext(fs.readFileSync(path.join(root,'js/songPresets.js'),'utf8'),f.context);
 const original=f.context.fetch;let calls=0;
 f.context.fetch=async url=>{if(url.includes('rock_16step')){calls++;if(calls===1)return {ok:false}}return original(url)};
 await assert.rejects(f.context.getPresetsByGenre('rock',16));
 const presets=await f.context.getPresetsByGenre('rock',16);assert(Object.keys(presets).length>0);assert.equal(calls,2);
});
test('Steps buttons reload the selected song at 16, 32 and 64 steps', async () => {
 const f=fixture();vm.runInContext(fs.readFileSync(path.join(root,'js/songPresets.js'),'utf8'),f.context);
 const app=f.make(16);f.context.window.testApp=app;
 f.nodes.patternExpansionMode={value:'song'};
 f.nodes.genreSelect={value:'rock'};f.nodes.tempoSlider={};f.nodes.tempoValue={};
 f.nodes.songSelect={value:'bohemian-rhapsody',appendChild(){}};
 const callbacks={};const buttons=[16,32,64].map(length=>({dataset:{patternLength:String(length)},addEventListener:(_,fn)=>callbacks[length]=fn}));
 f.context.document.querySelectorAll=selector=>selector==='[data-pattern-length]'?buttons:[];
 const source=fs.readFileSync(path.join(root,'js/songDesigner.js'),'utf8');
 const start=source.indexOf("        document.querySelectorAll('[data-pattern-length]')", source.indexOf("    setupEventListeners() {"));
 const end=source.indexOf("        document.getElementById('bassToggle')",start);
 vm.runInContext('(function(){'+source.slice(start,end)+'}).call(window.testApp)',f.context);
 const load=app.loadSongPreset;let pending;app.loadSongPreset=function(key){return pending=load.call(this,key)};
 for(const length of [16,32,64]){
  f.nodes.songSelect.value='bohemian-rhapsody';callbacks[length]();await pending;
  assert.equal(app.patternLength,length);assert.equal(app.patternGroups.melody.length,length/16);
  assert.equal(app.notices.at(-1)[1],'success');
  assert(f.requests.some(url=>url===`data/songs/rock_${length}step.json`));
 }
});

test('Opening index.html directly loads all song lengths and Tune Helper without fetch', async () => {
 const f=fixture('file:');
 f.context.fetch=async()=>{throw Error('file:// fetch must never be used')};
 vm.runInContext(fs.readFileSync(path.join(root,'js/songPresets.js'),'utf8'),f.context);
 let count=0;
 for(const genre of f.context.window.getAllGenres())for(const length of [16,32,64]){
  const songs=await f.context.getPresetsByGenre(genre,length);
  for(const preset of Object.values(songs)){assert.equal(preset.patternLength,length);count++;}
 }
 assert.equal(count,840);
 for(const length of [16,32,64])for(const mood of ['bright','dreamy','moody'])for(const energy of ['gentle','steady','lively']){
  const app=f.make(length);await app.createHelperTune({mood,energy});assert.equal(app.patternGroups.melody.length,length/16);
 }
 assert.equal(f.requests.filter(request=>request==='bundle').length,1);
 assert.equal(f.requests.filter(request=>request!=='bundle').length,0);
 const first=await f.context.window.loadPresetData('data/tune-helper/bright-steady-16.json');first.groups[0].melody=[];
 const second=await f.context.window.loadPresetData('data/tune-helper/bright-steady-16.json');assert(second.groups[0].melody.length>0);
});
test('Local bundle contains exactly the source JSON data', () => {
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data/presetBundle.js'),'utf8'),context);
 const entries=Object.entries(context.window.PIXELSONG_PRESET_DATA);assert.equal(entries.length,66);
 for(const [file,data]of entries)assert.equal(JSON.stringify(data),JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))));
});

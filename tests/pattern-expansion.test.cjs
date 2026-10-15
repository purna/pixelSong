const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/songDesigner.js'), 'utf8');
function fixture(length) {
 const nodes={},context={window:{},structuredClone,document:{getElementById:id=>nodes[id]||null}};
 vm.createContext(context);vm.runInContext(source+'\nwindow.App=SongDesignerApp;',context);
 const app=Object.create(context.window.App.prototype);
 app.patternLength=length;app.currentGroupIndex=0;app.groupLoopCounts=[2,3,1,1];app.patternGroups={};
 for(const part of ['harmonics','melody','bass','lead'])app.patternGroups[part]=Array.from({length:4},(_,g)=>part==='harmonics'?new Set([g]):new Map([[2,g+1]]));
 app.patternGroups.rhythm=Array.from({length:4},(_,g)=>({kick:new Set([g]),snare:new Set([4]),hihat:new Set([0,2]),tom:new Set([15]),conga:new Set([6]),bongo:new Set([7]),shaker:new Set([10]),cymbal:new Set([0])}));
 for(const part of ['melody','harmony','bass','lead'])app[part+'Velocity']=new Map([[2,.4],[18,.7],[33,.99]]);
 app.rhythmVelocity={kick:new Map([[0,.6],[16,.8],[33,.9]])};app.effectAutomation={lowpass:new Map([[0,40],[16,70],[33,90]])};
 for(const name of ['rebuildGrids','createStepTimeline','createSectionTimelines','updatePatternLengthUI','createSectionRepeatsControl'])app[name]=()=>{};
 app.showNotification=()=>{};
 return {app,context,nodes};
}
test('16 to 32 and 64 copies every musical part, velocity, automation and repeat count',()=>{
 for(const length of [32,64]){
  const {app}=fixture(16);app.setPatternLength(length,{addedSteps:'repeat'});
  for(let g=1;g<length/16;g++){
   for(const name of ['harmonics','melody','bass','lead'])assert.equal(JSON.stringify([...app.patternGroups[name][g]]),JSON.stringify([...app.patternGroups[name][0]]));
   for(const name of Object.keys(app.patternGroups.rhythm[0]))assert.deepEqual([...app.patternGroups.rhythm[g][name]],[...app.patternGroups.rhythm[0][name]]);
   for(const part of ['melody','harmony','bass','lead'])assert.equal(app[part+'Velocity'].get(g*16+2),.4);
   assert.equal(app.effectAutomation.lowpass.get(g*16),40);assert.equal(app.rhythmVelocity.kick.get(g*16),.6);assert.equal(app.groupLoopCounts[g],2);
  }
  app.patternGroups.melody[1].set(2,7);assert.equal(app.patternGroups.melody[0].get(2),1);
  app.patternGroups.rhythm[1].kick.add(8);assert(!app.patternGroups.rhythm[0].kick.has(8));
  assert.equal(app.melodyVelocity.has(17),false);
  if(length===64){assert.equal(app.melodyVelocity.has(33),false);assert.equal(app.effectAutomation.lowpass.has(33),false);}
 }
});
test('32 to 64 repeats both source bars in order and keeps distinct automation',()=>{
 const {app}=fixture(32);app.setPatternLength(64,{addedSteps:'repeat'});
 assert.equal(app.patternGroups.melody[2].get(2),1);assert.equal(app.patternGroups.melody[3].get(2),2);
 assert.equal(app.melodyVelocity.get(34),.4);assert.equal(app.melodyVelocity.get(50),.7);
 assert.equal(app.effectAutomation.lowpass.get(32),40);assert.equal(app.effectAutomation.lowpass.get(48),70);
 assert.equal(app.groupLoopCounts[2],2);assert.equal(app.groupLoopCounts[3],3);
});
test('Empty mode clears stale added steps without modifying the original bar',()=>{
 const {app}=fixture(16);app.setPatternLength(64,{addedSteps:'empty'});
 assert.equal(app.patternGroups.melody[0].get(2),1);
 for(let g=1;g<4;g++){
  for(const part of ['harmonics','melody','bass','lead'])assert.equal(app.patternGroups[part][g].size,0);
  for(const set of Object.values(app.patternGroups.rhythm[g]))assert.equal(set.size,0);
 }
 assert.equal(app.melodyVelocity.get(2),.4);assert.equal(app.melodyVelocity.has(18),false);assert.equal(app.effectAutomation.lowpass.has(33),false);
});
test('Shrinking and programmatic length changes preserve saved data',()=>{
 const {app}=fixture(64);const original=app.patternGroups.melody[1];app.setPatternLength(16,{addedSteps:'repeat'});
 assert.equal(app.patternGroups.melody[1],original);app.setPatternLength(32);assert.equal(app.patternGroups.melody[1],original);
});
test('Default repeat choice keeps edits instead of reloading a selected song',()=>{
 const {app,context,nodes}=fixture(16);nodes.genreSelect={value:'rock'};nodes.songSelect={value:'song'};
 const buttons=[{dataset:{patternLength:'32'},addEventListener:(_,fn)=>buttons[0].click=fn}];
 context.document.querySelectorAll=()=>buttons;context.window.testApp=app;
 let selected,loaded=false;app.populateSongSelect=(_,song)=>selected=song;app.loadSongPreset=()=>loaded=true;
 const start=source.indexOf("        document.querySelectorAll('[data-pattern-length]')",source.indexOf('    setupEventListeners() {'));
 const end=source.indexOf("        document.getElementById('bassToggle')",start);
 vm.runInContext('(function(){'+source.slice(start,end)+'}).call(window.testApp)',context);buttons[0].click();
 assert.equal(app.patternLength,32);assert.equal(app.patternGroups.melody[1].get(2),1);assert.equal(loaded,false);assert.equal(selected,'');
});

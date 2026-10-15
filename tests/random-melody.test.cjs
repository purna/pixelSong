const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function fixture(length,random,scale){
 const context={window:{getAllGenres:()=>['rock']},console:{log(){},error(){}},document:{addEventListener(){},getElementById:()=>null},setTimeout(){},getPresetsByGenre:()=>Promise.resolve({})};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'js/songDesigner.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'js/songDesigner.patch.js'),'utf8'),context);
 vm.runInContext(`
 Math.random=()=>${random};
 window.app=Object.create(SongDesignerApp.prototype);
 const app=window.app;
 app.patternLength=${length};app.currentGroupIndex=${length/16-1};app.melodyEnabled=false;app.percussionEnabled=false;
 app.patternGroups={harmonics:[],melody:[],bass:[],lead:[],rhythm:[]};
 for(let g=0;g<4;g++){
  app.patternGroups.harmonics.push(new Set());
  for(const part of ['melody','bass','lead'])app.patternGroups[part].push(new Map());
  app.patternGroups.rhythm.push(Object.fromEntries(['kick','snare','hihat','tom','conga','bongo','shaker','cymbal'].map(name=>[name,new Set()])));
 }
 for(const part of ['melody','bass','lead','harmony'])app[part+'Velocity']=new Map();
 app.harmonicNotes=['C3','E3','G3','C4','E4','G4','B4','D5'];app.harmonicsEnabled=false;
 app.rhythmVelocity=Object.fromEntries(['kick','snare','hihat','tom'].map(name=>[name,new Map()]));
 app.effectAutomation={lowpass:new Map()};
 app.getCurrentScale=()=>${JSON.stringify(scale || ['C4','D4','E4','F4','G4','A4','B4','C5'])};
 app.showNotification=()=>{};
 app.refreshTuneParts=function(){this.refreshed=true;this.displayEnabled=this.melodyEnabled};
 `,context);
 return context.window.app;
}
test('Random populates Melody Strings at 16, 32 and 64 steps, even if disabled and random skips optional notes',()=>{
 for(const length of [16,32,64])for(const random of [0,0.5,0.999999]){
  const app=fixture(length,random);app.randomize();
  assert.equal(app.melodyEnabled,true);assert.equal(app.displayEnabled,true);assert(app.refreshed);
  for(let g=0;g<length/16;g++){
   const notes=app.patternGroups.melody[g];assert(notes.size>=4);
   for(const step of [0,4,8,12])assert(notes.has(step));
   for(const [step,row]of notes){assert(step>=0&&step<16);assert(row>=0&&row<8);assert(app.melodyVelocity.get(g*16+step)>0)}
  }
  assert.equal(app.melodyRows,app.patternGroups.melody[app.currentGroupIndex]);
  const old=app.patternGroups.melody[0];app.randomize();assert.notEqual(app.patternGroups.melody[0],old);
 }
});

test('Random fills harmony in all bars with a playable chord in each supported scale',()=>{
 const scales=[['C4','D4','E4','F4','G4','A4','B4','C5'],['G4','A4','B4','C5','D5','E5','F#5','G5'],['F4','G4','A4','Bb4','C5','D5','E5','F5'],['D4','E4','F4','G4','A4','Bb4','C5','D5'],['A4','B4','C5','D5','E5','F5','G5','A5']];
 const pitch=note=>note.replace(/-?\d+$/,'');
 for(const scale of scales)for(const length of [16,32,64])for(const random of [0,0.5,0.999999]){
  const app=fixture(length,random,scale);app.randomize();assert(app.harmonicsEnabled);
  for(let g=0;g<length/16;g++){
   const chord=app.patternGroups.harmonics[g];assert.equal(chord.size,3);
   for(const row of chord){assert(app.harmonicNotes[row]);assert(scale.map(pitch).includes(pitch(app.harmonicNotes[row])));}
   assert(app.harmonyVelocity.get(g*16)>0);
   if(g>0)assert.notEqual(chord,app.patternGroups.harmonics[0]);
  }
  assert.equal(app.harmonics,app.patternGroups.harmonics[app.currentGroupIndex]);
 }
});
test('Harmony playback follows the playing bar rather than the currently edited bar',()=>{
 const app=fixture(32,0);app.randomize();let played;
 app.patternGroups.harmonics[0].clear();app.patternGroups.harmonics[0].add(0);
 app.patternGroups.harmonics[1].clear();app.patternGroups.harmonics[1].add(6);
 app.harmonics=app.patternGroups.harmonics[0];app.polySynth={triggerAttackRelease:notes=>played=notes};app._voiceChord=notes=>notes;
 app.harmonicsEnabled=true;app.melodyEnabled=app.bassEnabled=app.leadEnabled=app.rhythmEnabled=app.percussionEnabled=false;
 app._playStepAtTime(16,10);assert.equal(played.length,1);assert.equal(played[0],'B4');
});

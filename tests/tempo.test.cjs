const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const slider={min:60,max:180,_value:120,get value(){return this._value},set value(v){this._value=Math.max(Number(this.min),Math.min(Number(this.max),Number(v)))}};
 const label={};const context={window:{},Tone:{Transport:{bpm:{value:120}}},document:{getElementById:id=>id==='tempoSlider'?slider:id==='tempoValue'?label:null}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/songDesigner.js'),'utf8')+'\nwindow.App=SongDesignerApp;',context);
 const app=Object.create(context.window.App.prototype);app.tempo=120;let visual;
 app.rhythmVisualizer={enabled:true,setTempo:value=>visual=value};
 return {app,slider,label,context,visual:()=>visual};
}
test('Song BPM synchronises app, browser-clamped slider, display, clock and visualiser',()=>{
 const f=fixture();for(const bpm of [54,72,120,174,188,280,285,54]){
  assert(f.app.setTempo(bpm));assert.equal(f.app.tempo,bpm);assert.equal(f.slider.value,bpm);assert.equal(f.label.textContent,`${bpm} BPM`);assert.equal(f.context.Tone.Transport.bpm.value,bpm);assert.equal(f.visual(),bpm);
 }
});
test('Invalid BPM cannot replace current tempo',()=>{
 const f=fixture();f.app.setTempo(72);for(const value of [0,-1,NaN,Infinity,'bad'])assert.equal(f.app.setTempo(value),false);
 assert.equal(f.app.tempo,72);assert.equal(f.context.Tone.Transport.bpm.value,72);assert.equal(f.slider.value,72);
});

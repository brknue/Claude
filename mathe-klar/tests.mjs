import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {visual} from './visuals.js';
import {checkAnswer} from './answers.js';
const context={window:{}};vm.runInNewContext(fs.readFileSync(new URL('./curriculum.js',import.meta.url),'utf8'),context);const lessons=context.window.LESSONS;
assert.equal(lessons.length,77);assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
const svg=[];
for(const l of lessons){assert.ok(l.steps.length>=5,l.title);assert.ok(l.description&&l.rule&&l.error&&l.quiz.solution,l.title);assert.ok(l.grade>=5&&l.grade<=10);assert.ok(checkAnswer(String(l.quiz.answer),l.quiz.answer),'Accepted canonical answer: '+l.title);assert.equal(checkAnswer('nonsense',l.quiz.answer),false);assert.equal(checkAnswer('1/0',l.quiz.answer),false);for(let i=0;i<l.steps.length;i++){assert.ok(l.steps[i].text.length>20,l.title);for(const p of [0,.5,1]){const s=visual(l,i,p);assert.ok(s.startsWith('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(s),'Valid SVG numbers: '+l.title);svg.push(s);}}}
for(let grade=5;grade<=10;grade++)assert.ok(lessons.filter(l=>l.grade===grade).length>=10);
assert.equal(checkAnswer('0,35',.35),true);assert.equal(checkAnswer('2/4','1/2'),true);assert.equal(checkAnswer('25 %',25),true);assert.equal(checkAnswer('2+2',4),false);assert.equal(checkAnswer('3/0',0),false);
fs.writeFileSync('/tmp/mathe-klar-svg-tests.json',JSON.stringify(svg));
console.log(`PASS: ${lessons.length} lesson records, ${svg.length} scene render states, answer checking and grade coverage.`);

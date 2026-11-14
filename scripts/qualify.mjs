#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const COMMANDS=['help','contacts','detail','models','scores','explain','prioritise','attention','stale-signals','score-changes','source-freshness','outcomes','compliance','imports','audit','weekly-review','add','update-contact','event','log','suppress','model-add','model-activate','score','import','export','draft-handover'];
const epoch=v=>new Date(v).getTime();
const kinds=['demo_requested','trial_started','pricing_viewed','active_day','meeting_held'];
const requireText=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k} is required`);return o[k].trim();};
export function timestamp(v){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v||'')||!Number.isFinite(epoch(v)))throw Error('Timestamp requires a valid date and UTC offset');const day=v.slice(0,10);date(day);return new Date(v).toISOString();}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')||!Number.isFinite(epoch(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return v;}
function past(v){const t=timestamp(v);if(epoch(t)>Date.now())throw Error('Observed timestamp cannot be in the future');return t;}
function email(v){v=String(v||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('A valid contact email is required; account-only domain exports are not supported');return v;}
function integer(v,min=0,max=10000000){const n=Number(v);if(v===''||!Number.isSafeInteger(n)||n<min||n>max)throw Error(`Expected integer ${min}..${max}`);return n;}
function numberOrNull(v){if(v===undefined||v===null||String(v).trim()==='')return null;const n=Number(v);if(!Number.isFinite(n))throw Error('Vendor score must be numeric');return n;}
export function validatePolicy(p){
 const keys=['industries','countries','employees_min','employees_max','fit_points','event_points','lookback_days','accuracy_days','fit_weight','priority_threshold'];
 if(!p||typeof p!=='object'||keys.some(k=>!(k in p))||Object.keys(p).some(k=>!keys.includes(k)))throw Error('Policy has missing or unknown fields');
 for(const k of ['industries','countries'])if(!Array.isArray(p[k])||!p[k].length||p[k].some(x=>typeof x!=='string'||!x.trim()))throw Error(`${k} must be a nonempty list`);
 for(const k of ['employees_min','employees_max','lookback_days','accuracy_days','priority_threshold'])if(typeof p[k]!=='number')throw Error(`${k} must be numeric`);
 integer(p.employees_min);integer(p.employees_max,p.employees_min);integer(p.lookback_days,1,365);integer(p.accuracy_days,1,3650);integer(p.priority_threshold,1,100);
 if(typeof p.fit_weight!=='number'||p.fit_weight<0||p.fit_weight>1)throw Error('fit_weight must be 0..1');
 for(const [k,allowed] of [['fit_points',['industry','country','employees']],['event_points',kinds]]){
  if(!p[k]||Object.keys(p[k]).length!==allowed.length||allowed.some(x=>!(x in p[k])))throw Error(`Invalid ${k}`);
  for(const v of Object.values(p[k])){if(typeof v!=='number')throw Error(`${k} points must be numeric`);integer(v,0,100);}
 }
 return p;
}
export function blockers(c,p,at=new Date()){
 const out=[];if(c.suppressed)out.push('suppressed');if(c.outcome!=='open')out.push(`outcome ${c.outcome}`);
 if(!c.owner)out.push('no owner');if(!c.purpose||!c.purpose_evidence)out.push('missing purpose evidence');
 if(!c.accuracy_checked_at||epoch(c.accuracy_checked_at)<at.getTime()-p.accuracy_days*86400000)out.push('accuracy review overdue');
 if(!c.retain_until||String(c.retain_until).slice(0,10)<at.toISOString().slice(0,10))out.push('retention review due');return out;
}
export function calculate(c,events,p,at=new Date()){
 validatePolicy(p);const reasons=[];let fit=0,engagement=0;const eq=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
 for(const [key,hit] of [['industry',p.industries.some(x=>eq(x,c.industry))],['country',p.countries.some(x=>eq(x,c.country))],['employees',c.employees!==null&&c.employees>=p.employees_min&&c.employees<=p.employees_max]]){
  const points=hit?p.fit_points[key]:0;fit+=points;reasons.push({signal:key,points,observation:c[key]??'unknown'});
 }
 const cutoff=at.getTime()-p.lookback_days*86400000;
 for(const e of events){const eligible=epoch(e.occurred_at)>=cutoff&&epoch(e.occurred_at)<=at.getTime();const points=eligible?p.event_points[e.kind]:0;engagement+=points;reasons.push({signal:e.kind,event_key:e.event_key,points,observation:eligible?'inside activity window':'outside activity window'});}
 fit=Math.min(100,fit);engagement=Math.min(100,engagement);const total=Math.round(fit*p.fit_weight+engagement*(1-p.fit_weight));const holds=blockers(c,p,at);
 return {fit,engagement,total,segment:holds.length?'hold':total>=p.priority_threshold?'priority':'nurture',reasons,blockers:holds};
}
async function match(db,t,q){
 if(!q)throw Error(`Select a ${t==='contacts'?'contact':'model'}`);
 const rows=await db.query(`select * from ${t} order by name`);const lc=String(q).toLowerCase();const exact=rows.filter(r=>[r.id,r.name,r.email].some(x=>String(x||'').toLowerCase()===lc));
 const hits=exact.length?exact:rows.filter(r=>r.id.startsWith(lc)||[r.name,r.email,r.company].some(x=>String(x||'').toLowerCase().includes(lc)));
 if(hits.length!==1)throw Error(hits.length?`Ambiguous match: ${hits.map(r=>`${r.id} ${r.name} ${r.email||''}`).join('; ')}`:`No matching ${t}`);return hits[0];
}
async function activeModel(db){const m=(await db.query('select * from models where active'))[0];if(!m)throw Error('No active model. Add and activate a reviewed policy.');validatePolicy(m.policy);return m;}
async function audit(db,action,entity,actor,detail){await db.query('insert into audit_log(action,entity_id,actor,detail) values($1,$2,$3,$4)',[action,entity,actor,JSON.stringify(detail)]);}
const contactFields=['name','company','industry','country','employees','owner','purpose','purpose-evidence','accuracy-checked-at','retain-until','outcome'];
function contactValues(o){const obj={};for(const k of contactFields){if(o[k]===undefined)continue;let v=String(o[k]).trim();if(k==='employees')v=integer(v);if(k==='accuracy-checked-at')v=past(v);if(k==='retain-until')v=date(v);if(k==='outcome'&&!['open','won','lost','disqualified'].includes(v))throw Error('Unknown outcome');if(k==='name'&&!v)throw Error('Name cannot be empty');obj[k.replaceAll('-','_')]=v;}return obj;}
const defaultMap={email:['Email','email'],name:['Name','Full Name'],external_id:['Id','ID','Record ID'],company:['Company','Account Name'],industry:['Industry'],country:['Country'],employees:['NumberOfEmployees','Employees'],fit_score:['HG_Customer_Fit_Score__c','MK_Customer_Fit_Score__c','mk_customer_fit_score'],engagement_score:['HG_Lead_Engagement_Score__c','MK_Lead_Engagement_Score__c','MK_Likelihood_to_Buy_Score__c','mk_likelihood_to_buy_score'],fit_segment:['HG_Customer_Fit_Segment__c','MK_Customer_Fit_Segment__c','mk_customer_fit_segment'],engagement_segment:['HG_Lead_Engagement_Segment__c','MK_Lead_Engagement_Segment__c','MK_Likelihood_to_Buy_Segment__c'],signals:['HG_Customer_Fit_Signals__c','MK_Customer_Fit_Signals__c','mk_customer_fit_signals']};
async function importFile(db,o,actor){
 const source=requireText(o,'source'),exported=past(requireText(o,'exported-at')),raw=fs.readFileSync(requireText(o,'file'),'utf8');
 const custom=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 if(!custom||typeof custom!=='object'||Array.isArray(custom))throw Error('Mapping must be an object');
 for(const [k,v] of Object.entries(custom))if(!(k in defaultMap)||typeof v!=='string'||!v.trim())throw Error(`Invalid mapping: ${k}`);
 const mapping={...defaultMap,...Object.fromEntries(Object.entries(custom).map(([k,v])=>[k,[v]]))};
 const rows=parseCsv(raw);if(!rows.length)throw Error('CSV contains no contacts');
 for(const col of Object.values(custom))if(!Object.keys(rows[0]).includes(col))throw Error(`Mapped column missing: ${col}`);
 const seen=new Set();const parsed=rows.map((r,i)=>{
  const value=k=>pick(r,...mapping[k]);const em=email(value('email'));if(seen.has(em))throw Error(`Duplicate contact on row ${i+2}`);seen.add(em);
  const fit=numberOrNull(value('fit_score')),engagement=numberOrNull(value('engagement_score'));
  if(fit===null&&!value('fit_segment'))throw Error(`Row ${i+2} has no vendor fit score or segment; check mapping`);
  return {email:em,name:value('name')||em,company:value('company'),industry:value('industry'),country:value('country'),employees:value('employees')?integer(value('employees')):null,external_id:value('external_id'),fit_score:fit,engagement_score:engagement,fit_segment:value('fit_segment'),engagement_segment:value('engagement_segment'),signals:value('signals'),original:r};
 });
 const fingerprint=createHash('sha256').update(JSON.stringify({source,exported,raw,mapping})).digest('hex');
 const prior=(await db.query('select id from import_batches where fingerprint=$1',[fingerprint]))[0];if(prior)return {duplicate:true,batch_id:prior.id,rows:0};
 const latest=(await db.query('select max(exported_at) at from import_batches where source=$1',[source]))[0].at;
 if(latest&&epoch(exported)<=epoch(latest))throw Error('Changed export must be newer than the last export for this source');
 if(o['dry-run'])return {dry_run:true,rows:parsed.length,source,exported_at:exported,emails:parsed.map(x=>x.email)};
 const batch=(await db.query('insert into import_batches(fingerprint,source,exported_at,raw_csv,mapping,actor,row_count) values($1,$2,$3,$4,$5,$6,$7) returning id',[fingerprint,source,exported,raw,JSON.stringify(mapping),actor,parsed.length]))[0];
 let added=0;
 for(const r of parsed){let c=(await db.query('select * from contacts where email=$1',[r.email]))[0];if(!c){c=(await db.query('insert into contacts(email,name,company,industry,country,employees) values($1,$2,$3,$4,$5,$6) returning *',[r.email,r.name,r.company,r.industry,r.country,r.employees]))[0];added++;}
  await db.query('insert into vendor_scores(batch_id,contact_id,external_id,fit_score,engagement_score,fit_segment,engagement_segment,signals,original_row) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[batch.id,c.id,r.external_id,r.fit_score,r.engagement_score,r.fit_segment,r.engagement_segment,r.signals,JSON.stringify(r.original)]);
 }
 await audit(db,'import',batch.id,actor,{source,rows:parsed.length,added});return {batch_id:batch.id,rows:parsed.length,contacts_added:added,existing_contacts_preserved:parsed.length-added};
}
async function scoreContacts(db,o,actor){const model=await activeModel(db);const contacts=o.contact?[await match(db,'contacts',o.contact)]:await db.query('select * from contacts order by email');const at=new Date();const out=[];
 for(const c of contacts){const events=await db.query('select * from events where contact_id=$1 order by occurred_at,event_key',[c.id]);const s=calculate(c,events,model.policy,at);
 const row=(await db.query('insert into score_runs(contact_id,model_id,as_of,fit,engagement,total,segment,reasons,blockers,inputs,actor) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id',[c.id,model.id,at.toISOString(),s.fit,s.engagement,s.total,s.segment,JSON.stringify(s.reasons),JSON.stringify(s.blockers),JSON.stringify({contact:c,events,policy:model.policy}),actor]))[0];out.push({id:row.id,name:c.name,company:c.company,fit:s.fit,engagement:s.engagement,total:s.total,segment:s.segment,blockers:s.blockers.join('; ')});}
 await audit(db,'score',model.id,actor,{contacts:out.length});return out;
}
async function priority(db){const model=await activeModel(db);const rows=await db.query('select s.*,c.updated_at contact_updated from latest_scores s join contacts c on c.id=s.contact_id order by s.total desc,s.email');const out=[];
 for(const s of rows){const c=(await db.query('select * from contacts where id=$1',[s.contact_id]))[0];if(s.segment!=='priority'||s.model_id!==model.id||blockers(c,model.policy).length||epoch(s.as_of)<Date.now()-86400000||epoch(s.contact_updated)>epoch(s.created_at))continue;
 if((await db.query('select id from events where contact_id=$1 and created_at>$2 limit 1',[c.id,s.created_at])).length)continue;
 out.push({id:c.id,name:c.name,company:c.company,owner:c.owner,fit:s.fit,engagement:s.engagement,total:s.total,segment:s.segment});}return out;
}
async function dispatch(db,command,o,pos){
 const reads={contacts:'select id,name,email,company,owner,outcome,suppressed from contacts order by name,email',models:'select id,name,active,policy from models order by created_at',scores:'select name,company,fit,engagement,total,segment,blockers,as_of from latest_scores order by total desc,name',attention:'select name,company,owner,reason from qualification_attention order by name,reason',outcomes:'select * from qualification_outcomes order by segment,outcome','source-freshness':"select source,exported_at,rows_imported,batches,case when exported_at<now()-interval '7 days' then 'refresh export' else 'recent export' end finding from source_freshness order by source",imports:'select id,source,exported_at,row_count,actor from import_batches order by created_at desc',audit:'select action,entity_id,actor,detail,created_at from audit_log order by created_at desc', 'stale-signals':"select c.name,c.company,e.kind,e.occurred_at from events e join contacts c on c.id=e.contact_id join models m on m.active where e.occurred_at<now()-((m.policy->>'lookback_days')::integer*interval '1 day') order by e.occurred_at",'score-changes':`with r as(select s.*,row_number() over(partition by contact_id order by created_at desc,id desc) n from score_runs s) select c.name,a.total current_total,b.total previous_total,a.total-b.total delta,a.segment,a.model_id<>b.model_id model_changed from r a join r b on a.contact_id=b.contact_id and b.n=2 join contacts c on c.id=a.contact_id where a.n=1 order by abs(a.total-b.total) desc,c.name`};
 if(command==='help')return COMMANDS.map(command=>({command}));
 if(command in reads)return db.query(reads[command]);
 if(command==='prioritise')return priority(db);
 if(command==='detail'||command==='explain'){const c=await match(db,'contacts',o.contact);if(command==='explain'){const s=(await db.query('select * from latest_scores where contact_id=$1',[c.id]))[0];if(!s)throw Error('No local score yet');return {name:c.name,score:s.total,segment:s.segment,blockers:s.blockers,reasons:s.reasons,as_of:s.as_of,model_id:s.model_id};}return {contact:c,events:await db.query('select * from events where contact_id=$1 order by occurred_at',[c.id]),notes:await db.query('select * from notes where contact_id=$1 order by created_at',[c.id]),vendor_scores:await db.query('select v.*,b.source,b.exported_at from vendor_scores v join import_batches b on b.id=v.batch_id where v.contact_id=$1 order by b.exported_at desc',[c.id])};}
 if(command==='compliance'){const m=await activeModel(db);const out=[];for(const c of await db.query('select * from contacts order by name'))for(const finding of blockers(c,m.policy))out.push({name:c.name,finding,rule:finding.includes('accuracy')?'NZ-IPP8':finding.includes('retention')?'NZ-IPP9':finding.includes('purpose')?'NZ-IPP10':'LOCAL-POLICY'});return out;}
 if(command==='weekly-review')return {priority:await priority(db),attention:await dispatch(db,'attention',{},[]),compliance:await dispatch(db,'compliance',{},[]),outcomes:await dispatch(db,'outcomes',{},[]),sources:await dispatch(db,'source-freshness',{},[])};
 if(command==='export'){const data={format:'lead-qualification-v1',exported_at:new Date().toISOString()};for(const t of ['contacts','models','events','import_batches','vendor_scores','score_runs','notes','audit_log'])data[t]=await db.query(`select * from ${t} order by id`);const file=path.resolve(requireText(o,'file'));fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file,contacts:data.contacts.length,format:data.format};}
 const actor=requireText(o,'actor');
 if(command==='add'){const values={email:email(requireText(o,'email')),name:requireText(o,'name'),...contactValues(o)};const keys=Object.keys(values);const c=(await db.query(`insert into contacts(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];await audit(db,command,c.id,actor,{fields:keys});return c;}
 if(command==='update-contact'){const c=await match(db,'contacts',o.contact);const vals=contactValues(o);if(!Object.keys(vals).length)throw Error('No contact fields supplied');requireText(o,'reason');const keys=Object.keys(vals);const r=(await db.query(`update contacts set ${keys.map((k,i)=>k+'=$'+(i+2)).join(',')} where id=$1 returning *`,[c.id,...Object.values(vals)]))[0];await audit(db,command,c.id,actor,{reason:o.reason,before:c,after:r});return r;}
 if(command==='suppress'){const c=await match(db,'contacts',o.contact);const reason=requireText(o,'reason');await db.query('update contacts set suppressed=true where id=$1',[c.id]);await audit(db,command,c.id,actor,{reason});return {name:c.name,suppressed:true};}
 if(command==='event'){const c=await match(db,'contacts',o.contact),kind=requireText(o,'kind'),at=past(requireText(o,'at')),key=requireText(o,'key'),evidence=requireText(o,'evidence');if(!kinds.includes(kind))throw Error('Unknown event kind');const prior=(await db.query('select * from events where event_key=$1',[key]))[0];if(prior){if(prior.contact_id!==c.id||prior.kind!==kind||new Date(prior.occurred_at).toISOString()!==at||prior.evidence!==evidence)throw Error('Event key already has different content');return {duplicate:true,id:prior.id};}const e=(await db.query('insert into events(event_key,contact_id,kind,occurred_at,evidence,actor) values($1,$2,$3,$4,$5,$6) returning *',[key,c.id,kind,at,evidence,actor]))[0];await audit(db,command,e.id,actor,{contact_id:c.id});return e;}
 if(command==='log'){const c=await match(db,'contacts',o.contact);const n=(await db.query('insert into notes(contact_id,body,actor) values($1,$2,$3) returning *',[c.id,requireText(o,'body'),actor]))[0];await audit(db,command,n.id,actor,{contact_id:c.id});return n;}
 if(command==='model-add'){const p=validatePolicy(JSON.parse(fs.readFileSync(requireText(o,'file'),'utf8')));const m=(await db.query('insert into models(name,policy) values($1,$2) returning *',[requireText(o,'name'),JSON.stringify(p)]))[0];await audit(db,command,m.id,actor,{name:m.name});return m;}
 if(command==='model-activate'){const m=await match(db,'models',o.model);validatePolicy(m.policy);const reason=requireText(o,'reason');await db.query('update models set active=false where active');await db.query('update models set active=true where id=$1',[m.id]);await audit(db,command,m.id,actor,{reason});return {name:m.name,active:true};}
 if(command==='score')return scoreContacts(db,o,actor);
 if(command==='import'){if(pos[0]!=='madkudu')throw Error('Use import madkudu');return importFile(db,o,actor);}
 if(command==='draft-handover'){const rows=await priority(db);const dest=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dest,{recursive:true,mode:0o700});const file=path.join(dest,`handover-${randomUUID()}.md`);fs.writeFileSync(file,`# Qualification handover\n\nInternal working draft. Reviewed eligibility at ${new Date().toISOString()}. No permission to contact is implied.\n\n${human(rows)}\n\nPrepared by ${actor.replaceAll('\n',' ')}. Nothing sent.\n`,{flag:'wx',mode:0o600});await audit(db,command,null,actor,{contacts:rows.length,file:path.basename(file)});return {file,contacts:rows.length};}
 throw Error(`Unknown command: ${command}`);
}
const options={
 detail:['contact'],explain:['contact'],add:['email',...contactFields],
 'update-contact':['contact','reason',...contactFields],event:['contact','kind','at','key','evidence'],log:['contact','body'],suppress:['contact','reason'],
 'model-add':['file','name'],'model-activate':['model','reason'],score:['contact'],import:['file','source','exported-at','map','dry-run'],export:['file']
};
const mutating=new Set(['add','update-contact','event','log','suppress','model-add','model-activate','score','import','draft-handover']);
export async function execute(db,command,o={},pos=[]){if(!COMMANDS.includes(command))throw Error(`Unknown command: ${command}`);for(const k of Object.keys(o))if(!['json',...(mutating.has(command)?['actor']:[]),...(options[command]||[])].includes(k))throw Error(`Unknown option --${k} for ${command}`);for(const k of ['json','dry-run'])if(k in o&&o[k]!==true)throw Error(`--${k} is a boolean flag`);if(command!=='import'&&pos.length)throw Error('Unexpected positional argument');const write=mutating.has(command)&&!o['dry-run'];await db.exec(write?'BEGIN':'BEGIN READ ONLY');try{if(write)await db.query("select id from models order by id for update");const result=await dispatch(db,command,o,pos);await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
export function human(v){if(Array.isArray(v)){if(!v.length)return '  (none)';const rows=v.map(r=>Object.fromEntries(Object.entries(r).map(([k,x])=>[k,typeof x==='object'&&x!==null?JSON.stringify(x):x])));return table(rows,Object.keys(rows[0]).filter(k=>k!=='id').map(k=>({key:k,label:k.replaceAll('_',' '),width:70})));}return JSON.stringify(v,null,2);}
export function parseArgs(args){const o={},pos=[];for(const arg of args){if(arg.startsWith('--')){const eq=arg.indexOf('=');const k=arg.slice(2,eq<0?undefined:eq);if(k in o)throw Error(`Duplicate option: ${k}`);o[k]=eq<0?true:arg.slice(eq+1);}else pos.push(arg);}return {o,pos};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const [command='help',...rest]=process.argv.slice(2);const {o,pos}=parseArgs(rest);db=await getDb();const result=await execute(db,command,o,pos);console.log(o.json?JSON.stringify(result):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}

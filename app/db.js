// Couche de données : stockage localStorage + règles métier (remplace le backend)
const KEY='gestion-auto-v1',T=['vehicles','clients','reservations','maintenance','invoices'];
const COLS={vehicles:['marque','modele','annee','immatriculation','kilometrage','type','prix_vente','tarif_jour','photo','statut'],clients:['nom','prenom','email','telephone','permis_numero','piece_identite'],reservations:['vehicle_id','client_id','kind','date_debut','date_fin','montant','statut'],maintenance:['vehicle_id','client_id','date_prevue','description','cout','statut'],invoices:['client_id','kind','ref_id','montant','statut','date_emission']};
const NUM=new Set(['annee','kilometrage','prix_vente','tarif_jour','montant','cout','vehicle_id','client_id','ref_id']);
const REQ={vehicles:['marque','modele','immatriculation'],clients:['nom','prenom'],reservations:['vehicle_id','client_id','date_debut'],maintenance:['vehicle_id','date_prevue'],invoices:['client_id','kind']};
const DEF={vehicles:{kilometrage:0,type:'vente',statut:'disponible'},clients:{},reservations:{kind:'location',montant:0,statut:'reservee'},maintenance:{cout:0,statut:'planifie'},invoices:{montant:0,statut:'en_attente'}};
const today=(d=0)=>new Date(Date.now()+d*864e5).toISOString().slice(0,10);
const ACTIVE=['reservee','en_cours'];
function seed(){return{currency:'XAF',seq:{vehicles:4,clients:2,reservations:0,maintenance:1,invoices:0},
 vehicles:[{id:1,marque:'Renault',modele:'Clio',annee:2021,immatriculation:'AB-123-CD',kilometrage:42000,type:'vente',prix_vente:9117802,tarif_jour:null,photo:'https://images.unsplash.com/photo-1494976388901-0d0f5e5a6b92?auto=format&fit=crop&w=320&q=80',statut:'disponible'},
 {id:2,marque:'Peugeot',modele:'208',annee:2023,immatriculation:'EF-456-GH',kilometrage:9000,type:'location',prix_vente:null,tarif_jour:32142,photo:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=320&q=80',statut:'disponible'},
 {id:3,marque:'Toyota',modele:'Yaris',annee:2022,immatriculation:'IJ-789-KL',kilometrage:21000,type:'location',prix_vente:null,tarif_jour:36078,photo:'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=320&q=80',statut:'disponible'},
 {id:4,marque:'Citroën',modele:'C3',annee:2019,immatriculation:'MN-012-OP',kilometrage:78000,type:'entretien',prix_vente:null,tarif_jour:null,photo:'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=320&q=80',statut:'disponible'}],
 clients:[{id:1,nom:'Martin',prenom:'Léa',email:'lea.martin@example.com',telephone:'0600000001',permis_numero:'PC-889921',piece_identite:'CNI-123456'},
 {id:2,nom:'Dupont',prenom:'Karim',email:'karim.dupont@example.com',telephone:'0600000002',permis_numero:'PC-554410',piece_identite:'CNI-654321'}],
 reservations:[],maintenance:[{id:1,vehicle_id:4,client_id:2,date_prevue:today(3),description:'Vidange + freins',cout:183668,statut:'planifie'}],invoices:[]}}
let D=null;try{D=JSON.parse(localStorage.getItem(KEY))}catch{}
D=D||seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch{}};
if(!D.currency){
 const rate=655.957;
 D.vehicles?.forEach(v=>{if(v.prix_vente)v.prix_vente=Math.round(v.prix_vente*rate);if(v.tarif_jour)v.tarif_jour=Math.round(v.tarif_jour*rate);});
 D.reservations?.forEach(r=>{if(r.montant)r.montant=Math.round(r.montant*rate)});
 D.maintenance?.forEach(m=>{if(m.cout)m.cout=Math.round(m.cout*rate)});
 D.invoices?.forEach(i=>{if(i.montant)i.montant=Math.round(i.montant*rate)});
 D.currency='XAF';save();
}
const resetDb=()=>{D=seed();save()};
function exportDb(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,1)],{type:'application/json'}));a.download='gestion-automobile-'+today()+'.json';a.click()}
async function importDb(f){try{const x=JSON.parse(await f.text());if(!T.every(t=>Array.isArray(x[t]))||!x.seq)return false;D=x;D.currency='XAF';save();return true}catch{return false}}

const setStatus=(id,s)=>{const v=D.vehicles.find(x=>x.id==id);if(v)v.statut=s};
const hooks={ // le statut du véhicule suit le cycle de vie des opérations
 reservations:r=>{if(r.kind==='vente'&&r.statut==='conclue')setStatus(r.vehicle_id,'vendu');
  if(r.kind==='location'){if(r.statut==='en_cours')setStatus(r.vehicle_id,'loue');if(r.statut==='retourne')setStatus(r.vehicle_id,'disponible')}},
 maintenance:m=>{if(m.statut==='en_cours')setStatus(m.vehicle_id,'en_atelier');if(m.statut==='termine')setStatus(m.vehicle_id,'disponible')}};
function check(b,id){ // anti-chevauchement + calcul du montant de location
 if(b.kind!=='location'||!ACTIVE.includes(b.statut))return;
 if(!b.date_fin)throw new Error('Date de fin obligatoire pour une location');
 if(b.date_fin<b.date_debut)throw new Error('La date de fin précède la date de début');
 if(D.reservations.some(r=>r.id!=id&&r.vehicle_id==b.vehicle_id&&r.kind==='location'&&ACTIVE.includes(r.statut)&&r.date_debut<=b.date_fin&&r.date_fin>=b.date_debut))throw new Error('Véhicule indisponible sur cette période');
 if(!b.montant){const v=D.vehicles.find(x=>x.id==b.vehicle_id);b.montant=Math.max(1,Math.round((new Date(b.date_fin)-new Date(b.date_debut))/864e5)+1)*(v?.tarif_jour||0)}}
const clean=(t,b)=>Object.fromEntries(COLS[t].filter(c=>c in b).map(c=>{let v=b[c];v=v===''||v===undefined?null:v;return[c,v!==null&&NUM.has(c)?Number(v):v]}));
const grp=(rows,k,v)=>{const o={};rows.forEach(r=>o[r[k]]=(o[r[k]]||0)+(v?r[v]:1));return Object.entries(o).map(([k,n])=>({k,n}))};
function stats(){const i=D.invoices;return{clients:D.clients.length,rentals:D.reservations.filter(r=>r.kind==='location'&&ACTIVE.includes(r.statut)).length,
 ateliers:D.maintenance.filter(m=>m.statut!=='termine').length,unpaid:i.filter(x=>x.statut!=='payee').reduce((s,x)=>s+x.montant,0),
 vehicles:grp(D.vehicles,'statut'),revenue:grp(i.filter(x=>x.statut==='payee'),'kind','montant'),
 monthly:grp(i.map(x=>({m:x.date_emission.slice(0,7),montant:x.montant})),'m','montant').sort((a,b)=>a.k<b.k?1:-1).slice(0,6)}}

function route(s,q,m,b){
 const [a,x,y,z]=s;
  if(a==='available'){
   if(!q.debut||!q.fin)throw new Error('Les deux dates sont obligatoires');
   if(q.fin<q.debut)throw new Error('La date de fin précède la date de début');
   return D.vehicles.filter(v=>v.type==='location'&&!['vendu','en_atelier'].includes(v.statut)&&!D.reservations.some(r=>r.vehicle_id==v.id&&r.kind==='location'&&ACTIVE.includes(r.statut)&&r.date_debut<=q.fin&&r.date_fin>=q.debut));
  }
 if(a==='stats')return stats();
 if(a==='history'){const c=x==='clients'?'client_id':'vehicle_id',f=t=>D[t].filter(r=>r[c]==y);return{reservations:f('reservations'),maintenance:f('maintenance'),invoices:c==='client_id'?f('invoices'):[]}}
 if(a==='invoices'&&x==='from'){const t=y==='maintenance'?'maintenance':'reservations',r=D[t].find(r=>r.id==z);
  if(!r)throw new Error('Introuvable');if(!r.client_id)throw new Error('Aucun client associé');
  if(D.invoices.some(i=>i.kind==(t==='maintenance'?'entretien':r.kind)&&i.ref_id==r.id))throw new Error('Une facture existe déjà pour cet élément');
  const n={id:++D.seq.invoices,client_id:r.client_id,kind:t==='maintenance'?'entretien':r.kind,ref_id:r.id,montant:r.cout??r.montant??0,statut:'en_attente',date_emission:today()};D.invoices.push(n);save();return n}
 if(a==='reservations'&&y==='return'){const r=D.reservations.find(r=>r.id==x);r.statut='retourne';setStatus(r.vehicle_id,'disponible');save();return{ok:1}}
 if(!T.includes(a))throw new Error('Route inconnue');
 const rows=D[a];
 if(m==='GET'&&!x){const f=Object.entries(q).filter(([,v])=>v);return rows.filter(r=>f.every(([k,v])=>r[k]==v)).reverse()}
 if(m==='GET')return rows.find(r=>r.id==x)||{};
 if(m==='DELETE'){const k=a==='vehicles'?'vehicle_id':a==='clients'?'client_id':null;
  if(k&&['reservations','maintenance','invoices'].some(t=>D[t].some(r=>r[k]==x)))throw new Error('Suppression impossible : élément utilisé dans d\'autres enregistrements');
  D[a]=rows.filter(r=>r.id!=x);save();return{ok:1}}
 const c=clean(a,b);
 if(m==='POST'){const n={...DEF[a],...Object.fromEntries(Object.entries(c).filter(([,v])=>v!==null))};
  REQ[a].forEach(k=>{if(n[k]==null)throw new Error('Champ obligatoire : '+k.replace('_id','').replace('_',' '))});
  if(a==='vehicles'&&rows.some(v=>v.immatriculation===n.immatriculation))throw new Error('Immatriculation déjà enregistrée');
  if(a==='invoices'&&!n.date_emission)n.date_emission=today();
  if(a==='reservations')check(n);
  n.id=++D.seq[a];rows.push(n);hooks[a]?.(n);save();return n}
 if(m==='PUT'){const r=rows.find(r=>r.id==x);if(!r)throw new Error('Introuvable');const n={...r,...c};
  REQ[a].forEach(k=>{if(n[k]==null)throw new Error('Champ obligatoire : '+k.replace('_id','').replace('_',' '))});
  if(a==='vehicles'&&rows.some(v=>v.id!=x&&v.immatriculation===n.immatriculation))throw new Error('Immatriculation déjà enregistrée');
  if(a==='reservations')check(n,n.id);Object.assign(r,n);hooks[a]?.(r);save();return r}
 throw new Error('Opération inconnue');}
async function api(u,o={}){const [p,qs]=u.split('?');
 try{return JSON.parse(JSON.stringify(route(p.split('/'),Object.fromEntries(new URLSearchParams(qs||'')),o.m||'GET',o.b||{})))}catch(e){return{error:e.message}}}

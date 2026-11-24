const $=s=>document.querySelector(s),J=a=>a.join('');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cfa=n=>`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Math.round(n||0))} FCFA`;
const V_T=['vente','location','entretien'],V_S=['disponible','reserve','vendu','loue','en_atelier'],R_S=['reservee','en_cours','retourne','conclue','annulee'],M_S=['planifie','en_cours','termine'],F_S=['en_attente','partielle','payee'];
const M={
 vehicules:{t:'Véhicules',a:'vehicles',c:['photo','marque','modele','annee','immatriculation','kilometrage','type','statut','prix_vente','tarif_jour'],flt:{type:V_T,statut:V_S},
  f:[['marque'],['modele'],['annee','n'],['immatriculation'],['kilometrage','n'],['type','s',V_T],['prix_vente','n'],['tarif_jour','n'],['photo','url'],['statut','s',V_S]]},
 clients:{t:'Clients',a:'clients',c:['nom','prenom','email','telephone','permis_numero','piece_identite'],
  f:[['nom'],['prenom'],['email'],['telephone'],['permis_numero'],['piece_identite']]},
 reservations:{t:'Réservations & ventes',a:'reservations',c:['vehicle_id','client_id','kind','date_debut','date_fin','montant','statut'],flt:{kind:['location','vente'],statut:R_S},
  f:[['vehicle_id','r'],['client_id','r'],['kind','s',['location','vente']],['date_debut','d'],['date_fin','d'],['montant','n'],['statut','s',R_S]]},
 maintenance:{t:'Maintenance & entretien',a:'maintenance',c:['vehicle_id','client_id','date_prevue','description','cout','statut'],flt:{statut:M_S},
  f:[['vehicle_id','r'],['client_id','r'],['date_prevue','d'],['description'],['cout','n'],['statut','s',M_S]]},
 factures:{t:'Facturation & paiement',a:'invoices',c:['id','client_id','kind','ref_id','montant','statut','date_emission'],flt:{kind:V_T,statut:F_S},
  f:[['client_id','r'],['kind','s',V_T],['ref_id','n'],['montant','n'],['statut','s',F_S],['date_emission','d']]}};
const go_=n=>go(n);
const act={
 vehicules:[['Historique',r=>hist('vehicles',r.id)]],clients:[['Historique',r=>hist('clients',r.id)]],
 reservations:[['Retour',async r=>{const x=await api(`reservations/${r.id}/return`,{m:'POST'});if(x.error)return toast(x.error,'error');toast('Véhicule retourné');go('reservations')}],['Conclure',async r=>{const x=await api('reservations/'+r.id,{m:'PUT',b:{...r,statut:'conclue'}});if(x.error)return toast(x.error,'error');toast('Vente conclue');go('reservations')}],['Facturer',r=>inv('reservation',r.id)]],
 maintenance:[['Commencer',async r=>{const x=await api('maintenance/'+r.id,{m:'PUT',b:{...r,statut:'en_cours'}});if(x.error)return toast(x.error,'error');toast('Maintenance commencée');go('maintenance')}],['Terminer',async r=>{const x=await api('maintenance/'+r.id,{m:'PUT',b:{...r,statut:'termine'}});if(x.error)return toast(x.error,'error');toast('Maintenance terminée');go('maintenance')}],['Facturer',r=>inv('maintenance',r.id)]],
 factures:[['Marquer payée',async r=>{const x=await api('invoices/'+r.id,{m:'PUT',b:{statut:'payee'}});if(x.error)return toast(x.error,'error');toast('Facture payée');go('factures')}]]};
let refs={},cur={name:'dashboard',rows:[],q:{}};
const lab=(k,id)=>{const r=refs[k==='vehicle_id'?'vehicles':'clients'].find(x=>x.id==id);return r?(k==='vehicle_id'?`${r.marque} ${r.modele} (${r.immatriculation})`:`${r.prenom} ${r.nom}`):''};
const fallbackCar=(r={})=>{
 const label=esc(`${r.marque||'Voiture'} ${r.modele||''}`).replace(/'/g,'%27');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" rx="18" fill="#e8edf4"/><circle cx="68" cy="136" r="24" fill="#17212b"/><circle cx="252" cy="136" r="24" fill="#17212b"/><path d="M42 118l38-54h145l55 54 20 18H22z" fill="#315bea"/><path d="M91 72h120l37 46H56z" fill="#cbd8eb"/><rect x="135" y="82" width="74" height="32" rx="4" fill="#eef4fb"/><text x="160" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#17212b">${label}</text></svg>`;
 return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
const carImage=r=>esc(r.photo||r.image_url||fallbackCar(r));
const cell=(c,v,r)=>c==='photo'?`<img class="car-thumb" src="${carImage(r)}" alt="${esc(r.marque||'Voiture')} ${esc(r.modele||'')}" onerror="this.onerror=null;this.src='${fallbackCar(r)}'">`:c.endsWith('_id')&&c!=='ref_id'?esc(lab(c,v)):c==='statut'?`<span class="b b-${v}">${esc(v)}</span>`:/^(montant|cout|prix_vente|tarif_jour)$/.test(c)&&v!=null?cfa(v):esc(v);
const toast=(message,kind='')=>{const t=$('#toast');t.textContent=message;t.className=kind+' show';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.className='',2600)};
const tableSearch=(rows,query)=>{const q=query.trim().toLowerCase();if(!q)return rows;return rows.filter(r=>Object.values(r).some(v=>String(v??'').toLowerCase().includes(q)))};

async function go(name){
 if(name==='base')name='dashboard';
 cur.name=name;document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.p===name));
 refs={vehicles:await api('vehicles'),clients:await api('clients')};const main=$('main');
 if(name==='dashboard')return dash(main);if(name==='base')return base(main);
 const m=M[name],q=cur.q[name]||{};const apiQ=new URLSearchParams(Object.entries(q).filter(([k])=>k!=='search'));cur.rows=await api(m.a+'?'+apiQ);
 const visible=tableSearch(cur.rows,q.search||'');
 main.innerHTML=`<header><div><h2>${m.t}</h2><p class="page-subtitle">${visible.length} élément${visible.length>1?'s':''}</p></div><button class="p" data-n><span aria-hidden="true">＋</span> Ajouter</button></header>`+
 (name==='reservations'?`<div class="bar"><label>Disponibles du<input type="date" id="d1"></label><label>au<input type="date" id="d2"></label><button data-av>Voir les véhicules libres</button><span id="av"></span></div>`:'')+
 `<div class="bar"><label class="search-box">Rechercher<span class="search-wrap"><input id="table-search" type="search" placeholder="Nom, immatriculation, statut..." value="${esc(q.search||'')}"></span></label>${J(Object.entries(m.flt||{}).map(([k,o])=>`<label>${k.replace('_',' ')}<select data-f="${k}"><option value="">Tous</option>${J(o.map(x=>`<option ${q[k]==x?'selected':''}>${x}</option>`))}</select></label>`))}</div>`+
 `<div class="tw"><table><thead><tr>${J(m.c.map(c=>`<th>${c.replace(/_id$/,'').replaceAll('_',' ')}</th>`))}<th>Actions</th></tr></thead><tbody>${visible.length?J(visible.map(r=>{const i=cur.rows.indexOf(r);return `<tr>${J(m.c.map(c=>`<td>${cell(c,r[c],r)}</td>`))}<td class="a">${J((act[name]||[]).map((a,j)=>`<button data-k="${j}" data-i="${i}">${a[0]}</button>`))}<button data-e="${i}">Modifier</button><button class="x" data-d="${i}">Supprimer</button></td></tr>`})):`<tr><td class="row-empty" colspan="${m.c.length+1}">Aucune donnée ne correspond à votre recherche.</td></tr>`}</tbody></table></div>`;
}
async function form(m,row={}){
 const d=$('#dlg');
 d.innerHTML=`<form><h3>${row.id?'Modifier':'Ajouter'} — ${m.t}</h3>${J(m.f.map(([n,ty,o])=>`<label>${n.replace('_id','').replaceAll('_',' ')}${ty==='s'?`<select name="${n}">${J(o.map(x=>`<option ${row[n]==x?'selected':''}>${x}</option>`))}</select>`:ty==='r'?`<select name="${n}" required>${J(refs[n==='vehicle_id'?'vehicles':'clients'].map(x=>`<option value="${x.id}" ${row[n]==x.id?'selected':''}>${esc(lab(n,x.id))}</option>`))}</select>`:`<input name="${n}" type="${ty==='n'?'number':ty==='d'?'date':ty==='url'?'url':'text'}" step="any" value="${esc(row[n]??'')}" ${['nom','prenom','marque','modele','immatriculation','vehicle_id','client_id','date_debut','date_prevue'].includes(n)||ty==='d'?'required':''}>`}</label>`))}${m.a==='vehicles'?`<div class="photo-preview"><img id="photo-preview" src="${esc(row.photo||fallbackCar(row))}" alt="Aperçu du véhicule"><small>Adresse de l’image du véhicule</small></div>`:''}<p id="err"></p><menu><button type="button" onclick="dlg.close()">Annuler</button><button>Enregistrer</button></menu></form>`;
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target));
  const r=await api(row.id?`${m.a}/${row.id}`:m.a,{m:row.id?'PUT':'POST',b});if(r.error)return $('#err').textContent=r.error;d.close();toast(row.id?'Modification enregistrée':'Nouvel élément ajouté');go(cur.name)};
 if(m.a==='vehicles'){
  const photo=d.querySelector('input[name="photo"]'),preview=d.querySelector('#photo-preview');
  photo?.addEventListener('input',()=>{preview.src=photo.value||fallbackCar(row)});
  preview?.addEventListener('error',()=>{preview.onerror=null;preview.src=fallbackCar(row)});
 }
 d.showModal();
}
async function hist(t,id){const h=await api(`history/${t}/${id}`),d=$('#dlg');
 d.innerHTML=`<h3>Historique</h3>${J(Object.entries(h).filter(([,v])=>v.length).map(([k,v])=>`<h4>${k}</h4><ul>${J(v.map(x=>`<li>${esc(Object.values(x).slice(1).filter(Boolean).join(' · '))}</li>`))}</ul>`))||'<p>Aucun historique pour le moment.</p>'}<menu><button onclick="dlg.close()">Fermer</button></menu>`;d.showModal()}
async function inv(k,id){const r=await api(`invoices/from/${k}/${id}`,{m:'POST'});if(r.error)return toast(r.error,'error');toast('Facture créée');go('factures')}
async function dash(main){const s=await api('stats');
 const bars=(a,f=x=>x)=>`<div class="bars">${J(a.map(x=>`<div><span>${esc(x.k)}</span><i style="width:${Math.max(4,100*x.n/Math.max(...a.map(y=>y.n)))}%"></i><b>${f(x.n)}</b></div>`))}</div>`;
 main.innerHTML=`<header><div><h2>Tableau de bord</h2><p class="page-subtitle">Vue d'ensemble de votre activité</p></div></header><div class="cards">${J([['Clients',s.clients],['Locations actives',s.rentals],['Entretiens ouverts',s.ateliers],['Factures impayées',cfa(s.unpaid)]].map(([a,b],i)=>`<div class="card ${i===3?'accent':''}"><small>${a}</small><strong>${b}</strong></div>`))}</div><div class="g2"><section><h3>Encaissé par activité</h3>${s.revenue.length?bars(s.revenue,cfa):'<p class="page-subtitle">Aucun encaissement enregistré.</p>'}</section><section><h3>Parc par statut</h3>${bars(s.vehicles)}</section><section><h3>Facturé par mois</h3>${s.monthly.length?bars(s.monthly.reverse(),cfa):'<p class="page-subtitle">Aucune facture enregistrée.</p>'}</section></div>`}
const SCHEMA=`vehicles(id, marque, modele, annee, immatriculation UNIQUE, kilometrage, type[vente|location|entretien], prix_vente, tarif_jour, photo, statut[disponible|reserve|vendu|loue|en_atelier])
clients(id, nom, prenom, email, telephone, permis_numero, piece_identite)
reservations(id, vehicle_id→vehicles, client_id→clients, kind[location|vente], date_debut, date_fin, montant, statut[reservee|en_cours|retourne|conclue|annulee])
maintenance(id, vehicle_id→vehicles, client_id→clients, date_prevue, description, cout, statut[planifie|en_cours|termine])
invoices(id, client_id→clients, kind[vente|location|entretien], ref_id→reservations|maintenance, montant, statut[en_attente|partielle|payee], date_emission)`;
const DEPLOY=`Local : double-cliquer sur index.html (aucun serveur requis).
En ligne : déposer le dossier sur Netlify Drop, GitHub Pages ou Cloudflare Pages (site statique).
Données : stockées dans le localStorage du navigateur (propres à chaque appareil).
Sauvegarde / transfert : boutons Exporter et Importer ci-dessus.`;
async function base(main){main.innerHTML=`<header><h2>Base de données &amp; déploiement</h2></header><section><h3>Sauvegarde</h3><p>Les données sont enregistrées dans ce navigateur. Exportez-les régulièrement.</p><div class="bar"><button class="p" data-x>Exporter (JSON)</button><label>Importer un fichier<input type="file" id="imp" accept=".json"></label><button class="x" data-r>Réinitialiser les données</button></div></section><h3 style="margin:16px 0 8px">Schéma des données</h3><pre>${esc(SCHEMA)}</pre><h3 style="margin:16px 0 8px">Déploiement</h3><pre>${esc(DEPLOY)}</pre>`}
document.addEventListener('click',e=>{const t=e.target,m=M[cur.name];
 if(t.closest('nav a'))return go(t.closest('nav a').dataset.p);
 if(t.dataset.n!==undefined)form(m);
 if(t.dataset.e)form(m,cur.rows[t.dataset.e]);
 if(t.dataset.d&&confirm('Supprimer cet élément ?'))api(`${m.a}/${cur.rows[t.dataset.d].id}`,{m:'DELETE'}).then(r=>{if(r.error)return toast(r.error,'error');toast('Élément supprimé');go(cur.name)});
 if(t.dataset.k)act[cur.name][t.dataset.k][1](cur.rows[t.dataset.i]);
 if(t.dataset.av!==undefined){const d1=$('#d1').value,d2=$('#d2').value;if(!d1||!d2){toast('Sélectionnez les deux dates','error');return}if(d2<d1){toast('La date de fin précède la date de début','error');return}api(`available?debut=${d1}&fin=${d2}`).then(v=>{const el=$('#av');el.textContent=v.error?v.error:v.length?`${v.length} disponible(s) : ${v.map(x=>`${x.marque} ${x.modele}`).join(', ')}`:'Aucun véhicule libre sur cette période.'})}});
document.addEventListener('input',e=>{if(e.target.id==='table-search'){(cur.q[cur.name]??={}).search=e.target.value;const visible=tableSearch(cur.rows,e.target.value);const tbody=$('.tw tbody');const m=M[cur.name];tbody.innerHTML=visible.length?J(visible.map(r=>{const i=cur.rows.indexOf(r);return `<tr>${J(m.c.map(c=>`<td>${cell(c,r[c],r)}</td>`))}<td class="a">${J((act[cur.name]||[]).map((a,j)=>`<button data-k="${j}" data-i="${i}">${a[0]}</button>`))}<button data-e="${i}">Modifier</button><button class="x" data-d="${i}">Supprimer</button></td></tr>`})): `<tr><td class="row-empty" colspan="${m.c.length+1}">Aucun résultat.</td></tr>`}});
document.addEventListener('change',e=>{const f=e.target.dataset.f;if(f){(cur.q[cur.name]??={})[f]=e.target.value;go(cur.name)}});
document.addEventListener('click',e=>{const t=e.target;
 if(t.dataset.x!==undefined){exportDb();toast('Sauvegarde exportée')}
 if(t.dataset.r!==undefined&&confirm('Effacer toutes les données et recharger la démo ?')){resetDb();toast('Données réinitialisées');go('base')}});
document.addEventListener('change',e=>{if(e.target.id==='imp'&&e.target.files[0])importDb(e.target.files[0]).then(ok=>{if(!ok)return toast('Fichier invalide','error');toast('Import réussi');go('base')})});
go('dashboard');

const $=id=>document.getElementById(id);
const audio=$("audio"),fileInput=$("fileInput");
let tracks=[],current=-1,playing=false,db;
const DB_NAME="my-music-db",STORE="tracks";
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:"id"});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function tx(mode){return db.transaction(STORE,mode).objectStore(STORE)}
function saveTrack(track){return new Promise((resolve,reject)=>{const r=tx("readwrite").put(track);r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}
function getTracks(){return new Promise((resolve,reject)=>{const r=tx("readonly").getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function formatTime(s){if(!Number.isFinite(s))return"0:00";return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0")}
function cleanName(name){return name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim()}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderTrack(t,i){return '<div class="track"><div class="art">♫</div><div class="track-copy" data-play="'+i+'"><strong>'+escapeHTML(t.title)+'</strong><small>'+escapeHTML(t.artist||"Artista sconosciuto")+'</small></div><div class="track-actions"><button class="'+(t.favorite?"liked":"")+'" data-fav="'+i+'" aria-label="Preferito">'+(t.favorite?"♥":"♡")+'</button><button data-play="'+i+'" aria-label="Riproduci">▶</button></div></div>'}
function renderHomeCollection(){const items=[...tracks].slice(-6).reverse();$("homeCollection").className=items.length?"album-grid":"album-grid empty-state";$("homeCollection").innerHTML=items.length?items.map((t)=>'<button class="album-card" data-play="'+tracks.indexOf(t)+'"><span class="album-art">♫</span><strong>'+escapeHTML(t.title)+'</strong><small>'+escapeHTML(t.artist||"File personale")+'</small></button>').join(""):'<p>La tua raccolta crescerà qui.</p>'}
function render(){const list=items=>items.length?items.map(renderTrack).join(""):'<div class="empty-icon">♫</div><p>Nessun brano presente.</p><small>Usa ＋ per importare la tua musica.</small>';$("recentList").innerHTML=list([...tracks].slice(-5).reverse());$("libraryList").innerHTML=list(tracks);$("favoritesList").innerHTML=list(tracks.filter(t=>t.favorite));$("trackCount").textContent=tracks.length;$("favCount").textContent=tracks.filter(t=>t.favorite).length;filterSearch($("searchInput").value);renderHomeCollection()}
function filterSearch(q){const found=tracks.map((t,i)=>({...t,_i:i})).filter(t=>(t.title+" "+t.artist).toLowerCase().includes(q.toLowerCase()));$("searchList").innerHTML=found.length?found.map(t=>renderTrack(t,t._i)).join(""):'<p>Nessun risultato. Importa i tuoi brani per iniziare.</p>'}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===id))}
function updatePlayer(){const t=tracks[current];if(!t)return;$("nowTitle").textContent=t.title;$("nowArtist").textContent=t.artist||"Artista sconosciuto";$("playerFav").textContent=t.favorite?"♥":"♡";$("playerFav").classList.toggle("liked",!!t.favorite)}
async function playTrack(i){if(!tracks[i])return;current=i;const t=tracks[i];if(audio.src)URL.revokeObjectURL(audio.src);audio.src=URL.createObjectURL(t.blob);updatePlayer();try{await audio.play();playing=true;$("playButton").textContent="Ⅱ"}catch(e){playing=false;$("playButton").textContent="▶"}}
async function togglePlay(){if(current<0&&!audio.src){if(tracks.length)await playTrack(0);return}if(audio.paused){try{await audio.play();playing=true}catch(e){} }else{audio.pause();playing=false}$("playButton").textContent=playing?"Ⅱ":"▶"}
async function importFiles(files){for(const file of files){if(!file.type.startsWith("audio/")&&!/\.(mp3|flac|m4a|aac|wav|ogg)$/i.test(file.name))continue;const track={id:crypto.randomUUID(),title:cleanName(file.name),artist:"File personale",favorite:false,added:Date.now(),blob:file};await saveTrack(track)}tracks=await getTracks();render();if(current<0&&tracks.length)showView("libraryView")}
document.addEventListener("click",async e=>{const play=e.target.closest("[data-play]");if(play){playTrack(Number(play.dataset.play));return}const fav=e.target.closest("[data-fav]");if(fav){const t=tracks[Number(fav.dataset.fav)];t.favorite=!t.favorite;await saveTrack(t);tracks=await getTracks();render();if(current>=0)updatePlayer()}});
$("importTop").onclick=$("importHero").onclick=$("importLibrary").onclick=()=>fileInput.click();
$("goLibrary").onclick=()=>showView("libraryView");$("goFavorites").onclick=()=>showView("favoritesView");
fileInput.addEventListener("change",async e=>{await importFiles([...e.target.files]);fileInput.value=""});
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("searchInput").addEventListener("input",e=>filterSearch(e.target.value));$("playButton").onclick=togglePlay;
$("playerFav").onclick=async()=>{if(current<0)return;tracks[current].favorite=!tracks[current].favorite;await saveTrack(tracks[current]);tracks=await getTracks();render();updatePlayer()};
audio.addEventListener("timeupdate",()=>{$("currentTime").textContent=formatTime(audio.currentTime);$("progress").value=audio.duration?audio.currentTime/audio.duration*100:0});
audio.addEventListener("loadedmetadata",()=>{$("duration").textContent=formatTime(audio.duration)});
$("progress").addEventListener("input",e=>{if(audio.duration)audio.currentTime=Number(e.target.value)/100*audio.duration});
audio.addEventListener("ended",()=>{if(current>=0&&current<tracks.length-1)playTrack(current+1);else{playing=false;$("playButton").textContent="▶"}});

const JAMENDO_CLIENT_ID="04b26dfa";
let onlineResults=[];
async function searchJamendo(){
 const q=$("onlineSearchInput").value.trim(),out=$("onlineResults");
 if(!q){out.innerHTML='<p>Scrivi il titolo di un brano o il nome di un artista.</p>';return}
 out.innerHTML='<p>Ricerca in corso…</p>';
 try{
  const url=new URL("https://api.jamendo.com/v3.0/tracks/");
  url.search=new URLSearchParams({client_id:JAMENDO_CLIENT_ID,format:"json",limit:"20",search:q,audioformat:"mp32",type:"single albumtrack"}).toString();
  const response=await fetch(url.toString());
  if(!response.ok)throw new Error("Risposta API non valida");
  const data=await response.json();
  if(data.headers?.status!=="success")throw new Error(data.headers?.error_message||"Errore Jamendo");
  onlineResults=data.results||[];
  out.innerHTML=onlineResults.length?onlineResults.map((t,i)=>'<div class="track online-track"><div class="art">'+(t.image?'<img src="'+escapeHTML(t.image)+'" alt="" loading="lazy">':'♫')+'</div><div class="track-copy"><strong>'+escapeHTML(t.name)+'</strong><small>'+escapeHTML(t.artist_name)+' · '+formatTime(Number(t.duration))+'</small><small class="license-note">Licenza: '+escapeHTML((t.license_ccurl||"").replace("https://creativecommons.org/licenses/","CC ").replace(/\/$/,"")||"vedi Jamendo")+'</small></div><div class="track-actions"><button data-online-play="'+i+'" aria-label="Ascolta">▶</button></div></div>').join(""):'<p>Nessun brano trovato. Prova un'altra ricerca.</p>';
 }catch(e){out.innerHTML='<p>Non riesco a caricare Jamendo. Controlla la connessione e riprova.</p>';console.error(e)}
}
async function playOnlineTrack(i){
 const t=onlineResults[i];if(!t||!t.audio)return;
 current=-1;
 if(audio.src.startsWith("blob:"))URL.revokeObjectURL(audio.src);
 audio.src=t.audio;
 $("nowTitle").textContent=t.name;
 $("nowArtist").textContent=t.artist_name+" · Jamendo";
 $("playerFav").textContent="♡";$("playerFav").classList.remove("liked");
 $("currentTime").textContent="0:00";$("duration").textContent=formatTime(Number(t.duration));
 try{await audio.play();playing=true;$("playButton").textContent="Ⅱ"}catch(e){playing=false;$("playButton").textContent="▶"}
}
$("onlineSearchButton").addEventListener("click",searchJamendo);
$("onlineSearchInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchJamendo()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-online-play]");if(b)playOnlineTrack(Number(b.dataset.onlinePlay))});

(async()=>{try{db=await openDB();tracks=await getTracks();render()}catch(e){console.error("Impossibile aprire la libreria locale",e);$("recentList").innerHTML="<p>Memoria locale non disponibile in questo browser.</p>"}if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{})})();
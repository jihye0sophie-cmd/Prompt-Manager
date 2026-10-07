const KEY='pm-v1';
const GH={owner:'jihye0sophie-cmd',repo:'Prompt-Manager',branch:'main',path:'data/store.json'};
const GH_SESSION='pm-gh-token';
const GH_LOCAL='pm-gh-token-remembered';
const seed={prompts:[{id:'BLOG-01',title:'블로그 원고 작성',category:'blog',description:'블로그 원고 작성용 기본 프롬프트',tags:['블로그','원고'],favorite:true,updated:'2026-10-03',content:'[여기에 블로그 원고 작성 프롬프트를 저장하세요.]'},{id:'BLOG-02',title:'블로그 본문 이미지 제작',category:'blog',description:'완성 원고를 바탕으로 본문 이미지를 제작할 때 사용',tags:['블로그','이미지'],favorite:false,updated:'2026-10-03',content:'[여기에 블로그 이미지 제작 프롬프트를 저장하세요.]'},{id:'SHORTS-01',title:'쇼츠 주제 발굴',category:'shorts',description:'쇼츠 주제 후보를 만들고 발전시키는 프롬프트',tags:['쇼츠','기획'],favorite:false,updated:'2026-10-03',content:'[쇼츠 주제 발굴 프롬프트를 저장하세요.]'},{id:'SHORTS-02',title:'쇼츠 대본 작성',category:'shorts',description:'제목과 주제를 바탕으로 쇼츠용 내레이션 대본 구성',tags:['쇼츠','대본'],favorite:true,updated:'2026-10-03',content:'[쇼츠 대본 작성 프롬프트를 저장하세요.]'},{id:'SHORTS-03',title:'쇼츠 이미지 장면 구성',category:'shorts',description:'대본을 장면별로 나누고 이미지 생성 장면을 설계',tags:['쇼츠','이미지'],favorite:true,updated:'2026-10-03',content:'[쇼츠 이미지 장면 구성 프롬프트를 저장하세요.]'},{id:'SHORTS-04',title:'6초 영상 제작 프롬프트',category:'shorts',description:'선택 장면을 6초 AI 영상으로 만들기 위한 프롬프트',tags:['쇼츠','영상','6초'],favorite:true,updated:'2026-10-03',content:'[6초 영상 제작 프롬프트를 저장하세요.]'},{id:'CODE-01',title:'새 기능 구현 요청',category:'coding',description:'기존 기능을 보존하면서 새 기능을 추가할 때 사용',tags:['바이브코딩','기능추가'],favorite:false,updated:'2026-10-03',content:'[새 기능 구현용 공통 프롬프트를 저장하세요.]'},{id:'CODE-02',title:'버그 분석 및 수정',category:'coding',description:'원인 분석 후 최소 수정으로 해결하는 작업 템플릿',tags:['바이브코딩','버그수정'],favorite:true,updated:'2026-10-03',content:'[버그 분석 및 수정용 프롬프트를 저장하세요.]'}],sites:[{id:'SITE-01',title:'ChatGPT',category:'sites',siteType:'AI / 글쓰기',description:'자료 조사, 글쓰기, 기획, 코드 작업에 사용하는 메인 AI 도구',url:'https://chatgpt.com',notes:'자주 쓰는 방법이나 팁을 여기에 메모하세요.',tags:['AI','글쓰기'],favorite:true,updated:'2026-10-03'}]};
let data=load();let state={category:'all',filter:'all',query:'',sort:'updated'};const cats=[['all','전체'],['blog','블로그 제작'],['shorts','쇼츠 제작'],['coding','바이브코딩'],['sites','콘텐츠 제작 사이트']];
function q(s){return document.querySelector(s)}function load(){try{return JSON.parse(localStorage.getItem(KEY))||JSON.parse(JSON.stringify(seed))}catch(e){return JSON.parse(JSON.stringify(seed))}}function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}function today(){return new Date().toISOString().slice(0,10)}function esc(v){return String(v||'').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]})}function items(){return data.prompts.map(function(x){return Object.assign({_type:'prompt'},x)}).concat(data.sites.map(function(x){return Object.assign({_type:'site'},x)}))}
function inferredSpace(x){
  if(x.space)return x.space;
  if(/^WISDOM-/.test(x.id)||/^STYLE-WISDOM-/.test(x.id))return '오늘의 지혜 쇼츠 만들기';
  if(/^STORY-/.test(x.id)||/^STYLE-STORY-/.test(x.id))return '스토리숲 쇼츠 만들기';
  return '';
}
function inferredOrder(x){
  if(Number.isFinite(Number(x.spaceOrder))&&String(x.spaceOrder)!=='')return Number(x.spaceOrder);
  if(/^STYLE-/.test(x.id))return 0;
  var m=String(x.id||'').match(/-(\d+)$/);return m?Number(m[1]):999;
}
function spacePrompts(name){return data.prompts.filter(function(x){return inferredSpace(x)===name}).sort(function(a,b){return inferredOrder(a)-inferredOrder(b)||(a.title||'').localeCompare(b.title||'','ko')})}
function displayItems(flat){
  var out=[],groups=new Map();
  flat.forEach(function(x){
    if(x._type!=='prompt'){out.push(x);return}
    var space=inferredSpace(x);
    if(!space){out.push(x);return}
    if(!groups.has(space))groups.set(space,[]);
    groups.get(space).push(x);
  });
  groups.forEach(function(prompts,space){
    prompts.sort(function(a,b){return inferredOrder(a)-inferredOrder(b)});
    out.push({_type:'space',id:'SPACE:'+space,title:space,description:prompts.length+'개의 프롬프트가 순서대로 정리되어 있습니다.',prompts:prompts,updated:prompts.reduce(function(v,p){return (p.updated||'')>v?(p.updated||''):v},''),favorite:prompts.some(function(p){return p.favorite})});
  });
  out.sort(function(a,b){if(state.sort==='title')return (a.title||'').localeCompare(b.title||'','ko');if(state.sort==='id')return (a.id||'').localeCompare(b.id||'');return (b.updated||'').localeCompare(a.updated||'')});
  return out;
}
function renderNav(){q('#nav').innerHTML=cats.map(function(c){var count=c[0]=='all'?items().length:c[0]=='sites'?data.sites.length:data.prompts.filter(function(x){return x.category==c[0]}).length;return '<button data-cat="'+c[0]+'" class="'+(state.category==c[0]?'active':'')+'">'+c[1]+'<span class="count">'+count+'</span></button>'}).join('');q('#nav').querySelectorAll('button').forEach(function(b){b.onclick=function(){state.category=b.dataset.cat;state.filter='all';document.querySelectorAll('.filter').forEach(function(x){x.classList.remove('active')});q('[data-filter=all]').classList.add('active');render()}})}
function visible(){var a=items();if(state.category!='all')a=a.filter(function(x){return state.category=='sites'?x._type=='site':x._type=='prompt'&&x.category==state.category});if(state.filter=='favorite')a=a.filter(function(x){return x.favorite});var s=state.query.toLowerCase().trim();if(s)a=a.filter(function(x){return [x.id,x.title,x.description,x.content,x.notes,x.siteType].concat(x.tags||[]).join(' ').toLowerCase().includes(s)});a.sort(function(a,b){if(state.sort=='title')return a.title.localeCompare(b.title,'ko');if(state.sort=='id')return a.id.localeCompare(b.id);return (b.updated||'').localeCompare(a.updated||'')});return a}
function render(){renderNav();var c=cats.find(function(x){return x[0]==state.category})||cats[0];q('#title').textContent=c[1];q('#eyebrow').textContent=state.category=='sites'?'SITE LIBRARY':'PROMPT LIBRARY';var raw=visible(),a=displayItems(raw);q('#stats').innerHTML='<div class="stat"><b>'+a.length+'</b><span>현재 공간</span></div><div class="stat"><b>'+items().filter(function(x){return x.favorite}).length+'</b><span>즐겨찾기</span></div>';q('#grid').innerHTML=a.map(card).join('');q('#empty').classList.toggle('hidden',a.length>0);bind()}
function card(x){
  if(x._type==='space'){
    return '<article class="card spaceCard"><div class="top"><span class="badge">PROMPT SPACE</span><span class="spaceCount">'+x.prompts.length+'개</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><div class="spacePreview">'+x.prompts.slice(0,5).map(function(p,i){return '<div><b>'+(i+1)+'</b><span>'+esc(p.title)+'</span></div>'}).join('')+(x.prompts.length>5?'<small>+'+(x.prompts.length-5)+'개 더 보기</small>':'')+'</div><div class="actions"><button class="small" data-space-open="'+esc(x.title)+'">열기</button><button class="small copy" data-space-add="'+esc(x.title)+'">+ 프롬프트 추가</button></div></article>';
  }
  return '<article class="card"><div class="top"><span class="badge">'+esc(x._type=='site'?(x.siteType||'사이트'):x.id)+'</span><button class="fav '+(x.favorite?'on':'')+'" data-fav="'+x._type+'|'+x.id+'">★</button></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><div class="tags">'+(x.tags||[]).map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join('')+'</div><div class="actions"><button class="small" data-open="'+x._type+'|'+x.id+'">열기</button><button class="small" data-edit="'+x._type+'|'+x.id+'">수정</button>'+(x._type=='site'?'<button class="small copy" data-go="'+esc(x.url)+'">사이트 열기</button>':'<button class="small copy" data-copy="'+x.id+'">복사</button>')+'</div></article>'
}
function bind(){
  document.querySelectorAll('[data-space-open]').forEach(function(b){b.onclick=function(){openSpace(b.dataset.spaceOpen)}});
  document.querySelectorAll('[data-space-add]').forEach(function(b){b.onclick=function(){editItem('prompt',null,b.dataset.spaceAdd)}});
  document.querySelectorAll('[data-open]').forEach(function(b){b.onclick=function(){var p=b.dataset.open.split('|');openItem(p[0],p[1])}});
  document.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){var p=b.dataset.edit.split('|');editItem(p[0],p[1])}});
  document.querySelectorAll('[data-fav]').forEach(function(b){b.onclick=function(){var p=b.dataset.fav.split('|');var x=find(p[0],p[1]);x.favorite=!x.favorite;save()}});
  document.querySelectorAll('[data-copy]').forEach(function(b){b.onclick=function(){var x=data.prompts.find(function(p){return p.id==b.dataset.copy});copy(x.content)}});
  document.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){window.open(b.dataset.go,'_blank','noopener')}})
}
function openSpace(name){
  var list=spacePrompts(name);
  q('#drawerEye').textContent='PROMPT SPACE';
  q('#drawerTitle').textContent=name;
  q('#drawerBody').innerHTML='<div class="drawerActions"><button class="primary" id="spaceAdd">+ 프롬프트 추가</button></div><p class="spaceHelp">필요한 순서대로 프롬프트를 열고 복사해서 사용하세요.</p><div class="spaceList">'+list.map(function(p,i){return '<article class="spaceStep"><div class="spaceStepNo">'+(i+1)+'</div><div class="spaceStepMain"><small>'+esc(p.id)+'</small><h3>'+esc(p.title)+'</h3><p>'+esc(p.description||'')+'</p><div class="spaceStepActions"><button class="small" data-space-item-open="'+p.id+'">열기</button><button class="small" data-space-item-copy="'+p.id+'">복사</button><button class="small" data-space-item-edit="'+p.id+'">수정</button></div></div></article>'}).join('')+'</div>';
  showDrawer();
  q('#spaceAdd').onclick=function(){editItem('prompt',null,name)};
  document.querySelectorAll('[data-space-item-open]').forEach(function(b){b.onclick=function(){openItem('prompt',b.dataset.spaceItemOpen)}});
  document.querySelectorAll('[data-space-item-copy]').forEach(function(b){b.onclick=function(){var p=find('prompt',b.dataset.spaceItemCopy);copy(p.content)}});
  document.querySelectorAll('[data-space-item-edit]').forEach(function(b){b.onclick=function(){editItem('prompt',b.dataset.spaceItemEdit)}});
}
function find(t,id){return t=='site'?data.sites.find(function(x){return x.id==id}):data.prompts.find(function(x){return x.id==id})}function syncOverlay(){var sidebarOpen=q('#sidebar').classList.contains('open');var drawerOpen=!q('#drawer').classList.contains('hidden');q('#overlay').classList.toggle('hidden',!(sidebarOpen||drawerOpen))}function showDrawer(){q('#drawer').classList.remove('hidden');syncOverlay()}function closeDrawer(){q('#drawer').classList.add('hidden');syncOverlay()}
function openItem(t,id){var x=find(t,id);q('#drawerEye').textContent=t=='site'?(x.siteType||'SITE'):x.id;q('#drawerTitle').textContent=x.title;if(t=='site'){q('#drawerBody').innerHTML='<div class="drawerActions"><button class="primary" id="visit">사이트 열기</button><button class="small" id="editNow">수정</button></div><p>'+esc(x.description)+'</p><h3>사용 메모</h3><div class="promptBox">'+esc(x.notes)+'</div>';q('#visit').onclick=function(){window.open(x.url,'_blank','noopener')}}else{q('#drawerBody').innerHTML='<div class="drawerActions"><button class="primary" id="copyNow">프롬프트 복사</button><button class="small" id="editNow">수정</button><button class="small" id="dupNow">복제</button></div><p>'+esc(x.description)+'</p>'+referenceSectionHtml(x)+'<div class="promptBox">'+esc(x.content)+'</div>';q('#copyNow').onclick=function(){copy(x.content)};q('#dupNow').onclick=function(){duplicate(id)};bindReferenceActions(x)}q('#editNow').onclick=function(){editItem(t,id)};showDrawer()}
function next(prefix,arr){var n=Math.max.apply(null,[0].concat(arr.map(function(x){var m=(x.id||'').match(/\d+/);return m?Number(m[0]):0})))+1;return prefix+'-'+String(n).padStart(2,'0')}
function editItem(t,id,presetSpace){var isNew=!id,isSite=t=='site',x=isNew?(isSite?{id:next('SITE',data.sites),title:'',siteType:'',description:'',url:'',notes:'',tags:[]}:{id:'',title:'',category:['blog','shorts','coding'].includes(state.category)?state.category:'blog',description:'',content:'',tags:[],space:presetSpace||'',spaceOrder:presetSpace?spacePrompts(presetSpace).length+1:''}):find(t,id);q('#drawerEye').textContent=isNew?'NEW':'EDIT';q('#drawerTitle').textContent=isNew?(isSite?'새 사이트':'새 프롬프트'):x.title;q('#drawerBody').innerHTML=formHtml(isSite,x,isNew);showDrawer();q('#form').onsubmit=function(e){e.preventDefault();saveForm(t,id,isNew)};q('#cancel').onclick=function(){isNew?closeDrawer():openItem(t,id)};var d=q('#delete');if(d)d.onclick=function(){remove(t,id)};if(!isSite&&!isNew)bindReferenceEditor(x)}
function formHtml(isSite,x,isNew){if(isSite)return '<form id="form" class="form"><div class="row"><div><label>ID</label><input id="fid" value="'+esc(x.id)+'" readonly></div><div><label>분류</label><input id="ftype" value="'+esc(x.siteType)+'" placeholder="AI 영상, TTS, SEO"></div></div><div><label>사이트명</label><input id="ftitle" value="'+esc(x.title)+'" required></div><div><label>주소</label><input id="furl" type="url" value="'+esc(x.url)+'" required></div><div><label>설명</label><input id="fdesc" value="'+esc(x.description)+'"></div><div><label>태그 · 쉼표로 구분</label><input id="ftags" value="'+esc((x.tags||[]).join(', '))+'"></div><div><label>내 사용법 / 메모</label><textarea id="fnotes">'+esc(x.notes)+'</textarea></div>'+buttons(isNew)+'</form>';return '<form id="form" class="form"><div class="row"><div><label>ID</label><input id="fid" value="'+esc(x.id)+'" placeholder="비우면 자동 생성" '+(isNew?'':'readonly')+'></div><div><label>카테고리</label><select id="fcat"><option value="blog" '+(x.category=='blog'?'selected':'')+'>블로그 제작</option><option value="shorts" '+(x.category=='shorts'?'selected':'')+'>쇼츠 제작</option><option value="coding" '+(x.category=='coding'?'selected':'')+'>바이브코딩</option></select></div></div><div class="row"><div><label>프롬프트 공간</label><input id="fspace" value="'+esc(inferredSpace(x))+'" placeholder="예: 오늘의 지혜 쇼츠 만들기"></div><div><label>공간 안 순서</label><input id="fspaceOrder" type="number" min="0" value="'+esc(x.spaceOrder!==undefined&&x.spaceOrder!==''?x.spaceOrder:inferredOrder(x))+'"></div></div><div><label>제목</label><input id="ftitle" value="'+esc(x.title)+'" required></div><div><label>설명</label><input id="fdesc" value="'+esc(x.description)+'"></div><div><label>태그 · 쉼표로 구분</label><input id="ftags" value="'+esc((x.tags||[]).join(', '))+'"></div><div><label>프롬프트</label><textarea id="fcontent" required>'+esc(x.content)+'</textarea></div><p class="note">같은 프롬프트 공간 이름을 지정하면 하나의 카드 안에 순서대로 묶입니다. 데이터는 Cloudflare D1에 자동 저장됩니다.</p>'+buttons(isNew)+'</form>'}
function buttons(isNew){return '<div class="drawerActions">'+(isNew?'':'<button type="button" class="danger" id="delete">삭제</button>')+'<button type="button" class="small" id="cancel">취소</button><button class="primary">저장</button></div>'}
function tags(v){return String(v||'').split(',').map(function(x){return x.trim()}).filter(Boolean)}function saveForm(t,id,isNew){if(t=='site'){var o={id:q('#fid').value,title:q('#ftitle').value.trim(),category:'sites',siteType:q('#ftype').value.trim(),description:q('#fdesc').value.trim(),url:q('#furl').value.trim(),notes:q('#fnotes').value,tags:tags(q('#ftags').value),favorite:isNew?false:find(t,id).favorite,updated:today()};if(isNew)data.sites.push(o);else Object.assign(find(t,id),o);save();toast('사이트를 저장했습니다.');openItem('site',o.id)}else{var cat=q('#fcat').value;var pid=q('#fid').value.trim();if(isNew&&!pid)pid=next(cat=='blog'?'BLOG':cat=='shorts'?'SHORTS':'CODE',data.prompts);var oldPrompt=isNew?null:find(t,id);var p={id:pid,title:q('#ftitle').value.trim(),category:cat,description:q('#fdesc').value.trim(),content:q('#fcontent').value,tags:tags(q('#ftags').value),favorite:isNew?false:oldPrompt.favorite,updated:today(),references:isNew?[]:(oldPrompt.references||[]),space:q('#fspace').value.trim(),spaceOrder:Number(q('#fspaceOrder').value||0)};if(isNew)data.prompts.push(p);else Object.assign(find(t,id),p);save();toast('프롬프트를 저장했습니다.');openItem('prompt',p.id)}}
function remove(t,id){if(!confirm('정말 삭제할까요?'))return;if(t=='site')data.sites=data.sites.filter(function(x){return x.id!=id});else data.prompts=data.prompts.filter(function(x){return x.id!=id});save();closeDrawer();toast('삭제했습니다.')}function duplicate(id){var x=data.prompts.find(function(p){return p.id==id});var pre=x.category=='blog'?'BLOG':x.category=='shorts'?'SHORTS':'CODE';var o=JSON.parse(JSON.stringify(x));o.id=next(pre,data.prompts);o.title+=' 복사본';o.favorite=false;o.updated=today();data.prompts.push(o);save();editItem('prompt',o.id)}function copy(t){navigator.clipboard.writeText(t||'').then(function(){toast('복사했습니다.')})}function toast(m){q('#toast').textContent=m;q('#toast').classList.remove('hidden');clearTimeout(window._toast);window._toast=setTimeout(function(){q('#toast').classList.add('hidden')},1600)}
q('#search').oninput=function(e){state.query=e.target.value;render()};q('#sort').onchange=function(e){state.sort=e.target.value;render()};document.querySelectorAll('.filter').forEach(function(b){b.onclick=function(){document.querySelectorAll('.filter').forEach(function(x){x.classList.remove('active')});b.classList.add('active');state.filter=b.dataset.filter;render()}});function closeSidebar(){q('#sidebar').classList.remove('open');syncOverlay()}q('#newPrompt').onclick=q('#newTop').onclick=function(){closeSidebar();editItem('prompt',null)};q('#newSite').onclick=function(){closeSidebar();editItem('site',null)};q('#syncBtn').onclick=function(){closeSidebar();openSyncSettings()};q('#close').onclick=closeDrawer;var sidebarClose=q('#sidebarClose');if(sidebarClose)sidebarClose.onclick=closeSidebar;q('#overlay').onclick=function(){closeDrawer();closeSidebar()};q('#menu').onclick=function(e){e.stopPropagation();q('#sidebar').classList.toggle('open');syncOverlay()};q('#nav').addEventListener('click',function(e){if(e.target.closest('button')&&window.matchMedia('(max-width:720px)').matches)closeSidebar()});document.addEventListener('pointerdown',function(e){if(!window.matchMedia('(max-width:720px)').matches)return;var side=q('#sidebar');if(!side.classList.contains('open'))return;if(side.contains(e.target)||q('#menu').contains(e.target))return;closeSidebar()},{capture:true});render();

function getGitHubToken(){return sessionStorage.getItem(GH_SESSION)||localStorage.getItem(GH_LOCAL)||''}
function setGitHubToken(token,remember){sessionStorage.removeItem(GH_SESSION);localStorage.removeItem(GH_LOCAL);if(token){if(remember)localStorage.setItem(GH_LOCAL,token);else sessionStorage.setItem(GH_SESSION,token)}}
function githubHeaders(token){return {'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'}}
async function testGithubConnection(token){
  const url='https://api.github.com/repos/'+GH.owner+'/'+GH.repo;
  const res=await fetch(url,{headers:githubHeaders(token)});
  if(!res.ok)throw new Error('연결 실패 ('+res.status+')');
  return true;
}
function setSyncBusy(busy,ok){
  const dot=document.querySelector('.syncDot');
  if(dot){dot.className='syncDot'+(busy?' busy':ok?' on':'')}
}
function safeName(v){return String(v||'reference').trim().replace(/[^a-zA-Z0-9가-힣_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'reference'}
function extFromFile(file){var n=(file.name||'').toLowerCase();if(n.endsWith('.png'))return 'png';if(n.endsWith('.webp'))return 'webp';return 'jpg'}
function referenceBasePath(prompt){var group=(prompt.id||'prompt').toLowerCase().replace(/[^a-z0-9_-]/g,'-');return 'assets/references/'+group+'/'}
function imageUrl(ref){return './'+ref.path+'?v='+encodeURIComponent(ref.updated||'')}
function referenceSectionHtml(x){
  var refs=x.references||[];
  return '<section class="referenceSection"><div class="referenceHeader"><div><h3>레퍼런스 이미지</h3><p>프롬프트와 함께 사용하는 스타일·캐릭터 기준 이미지</p></div><span class="badge">'+refs.length+'장</span></div>'+
    (refs.length?'<div class="referenceGrid">'+refs.map(function(r,i){return '<article class="referenceCard"><img src="'+esc(imageUrl(r))+'" alt="'+esc(r.name||('레퍼런스 '+(i+1)))+'"><div class="referenceMeta"><strong>'+esc(r.name||('레퍼런스 '+(i+1)))+'</strong><div class="referenceActions"><button class="small" data-ref-copy="'+i+'">이미지 복사</button><button class="small" data-ref-open="'+i+'">원본 보기</button><button class="small" data-ref-replace="'+i+'">교체</button><button class="danger refDelete" data-ref-delete="'+i+'">삭제</button></div></div></article>'}).join('')+'</div>':'<div class="referenceEmpty">등록된 레퍼런스 이미지가 없습니다.</div>')+
    '<div class="referenceUpload"><input id="referenceUploadInput" type="file" accept="image/png,image/jpeg,image/webp" multiple><button class="small" id="referenceUploadBtn">이미지 추가</button></div></section>';
}
function referenceEditorHtml(x){
  return '<section class="referenceEditor"><label>레퍼런스 이미지</label><p class="syncHint">이미지는 GitHub의 assets/references 폴더에 저장됩니다. 상세 화면에서 복사·교체·삭제할 수 있습니다.</p><button type="button" class="small" id="manageReferences">레퍼런스 이미지 관리 ('+((x.references||[]).length)+')</button></section>';
}
function bindReferenceEditor(x){var b=q('#manageReferences');if(b)b.onclick=function(){openItem('prompt',x.id)}}
function bindReferenceActions(x){
  var uploadBtn=q('#referenceUploadBtn'),input=q('#referenceUploadInput');
  if(uploadBtn&&input)uploadBtn.onclick=function(){input.click()};
  if(input)input.onchange=async function(){if(input.files&&input.files.length)await uploadReferenceFiles(x,Array.from(input.files));input.value=''};
  document.querySelectorAll('[data-ref-copy]').forEach(function(b){b.onclick=function(){copyReferenceImage(x,Number(b.dataset.refCopy))}});
  document.querySelectorAll('[data-ref-open]').forEach(function(b){b.onclick=function(){var r=(x.references||[])[Number(b.dataset.refOpen)];if(r)window.open(imageUrl(r),'_blank','noopener')}});
  document.querySelectorAll('[data-ref-delete]').forEach(function(b){b.onclick=function(){deleteReferenceImage(x,Number(b.dataset.refDelete))}});
  document.querySelectorAll('[data-ref-replace]').forEach(function(b){b.onclick=function(){replaceReferencePicker(x,Number(b.dataset.refReplace))}});
}
async function fileToBase64(file){
  var buf=await file.arrayBuffer(),bytes=new Uint8Array(buf),binary='',chunk=0x8000;
  for(var i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
  return btoa(binary);
}
async function githubGetContentMeta(path){
  var token=getGitHubToken();if(!token)throw new Error('GitHub 이미지 연결을 먼저 해주세요.');
  var url='https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path+'?ref='+encodeURIComponent(GH.branch);
  var res=await fetch(url,{headers:githubHeaders(token)});
  if(res.status===404)return null;
  if(!res.ok)throw new Error('GitHub 파일 확인 실패 ('+res.status+')');
  return await res.json();
}
async function githubPutBinary(path,file,message,existingSha){
  var token=getGitHubToken();if(!token)throw new Error('GitHub 이미지 연결을 먼저 해주세요.');
  var body={message:message,content:await fileToBase64(file),branch:GH.branch};
  if(existingSha)body.sha=existingSha;
  var url='https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path;
  var res=await fetch(url,{method:'PUT',headers:githubHeaders(token),body:JSON.stringify(body)});
  if(!res.ok){var txt=await res.text();throw new Error('이미지 저장 실패 ('+res.status+') '+txt.slice(0,80))}
  return await res.json();
}
async function githubDeleteBinary(path,message){
  var token=getGitHubToken();if(!token)throw new Error('GitHub 이미지 연결을 먼저 해주세요.');
  var meta=await githubGetContentMeta(path);if(!meta)return;
  var url='https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path;
  var res=await fetch(url,{method:'DELETE',headers:githubHeaders(token),body:JSON.stringify({message:message,sha:meta.sha,branch:GH.branch})});
  if(!res.ok)throw new Error('이미지 삭제 실패 ('+res.status+')');
}
async function uploadReferenceFiles(prompt,files){
  if(!getGitHubToken()){toast('GitHub 이미지 연결을 먼저 해주세요.');return}
  var allowed=files.filter(function(f){return /^image\/(png|jpeg|webp)$/.test(f.type)});
  if(!allowed.length){toast('PNG, JPG, WEBP 이미지만 사용할 수 있습니다.');return}
  setSyncBusy(true);
  try{
    prompt.references=prompt.references||[];
    for(var i=0;i<allowed.length;i++){
      var file=allowed[i],stamp=Date.now()+'-'+i,ext=extFromFile(file);
      var path=referenceBasePath(prompt)+stamp+'-'+safeName(file.name.replace(/\.[^.]+$/,''))+'.'+ext;
      await githubPutBinary(path,file,'Add reference image for '+prompt.id,null);
      prompt.references.push({name:file.name.replace(/\.[^.]+$/,''),path:path,mime:file.type,updated:new Date().toISOString()});
    }
    prompt.updated=today();
    localStorage.setItem(KEY,JSON.stringify(data));
    await githubPushStore('Update reference images for '+prompt.id);
    setSyncBusy(false,true);toast(allowed.length+'개 이미지를 추가했습니다.');openItem('prompt',prompt.id);
  }catch(e){setSyncBusy(false,false);toast(e.message||'이미지 업로드에 실패했습니다.')}
}
function replaceReferencePicker(prompt,index){
  var picker=document.createElement('input');picker.type='file';picker.accept='image/png,image/jpeg,image/webp';
  picker.onchange=async function(){var file=picker.files&&picker.files[0];if(file)await replaceReferenceImage(prompt,index,file)};
  picker.click();
}
async function replaceReferenceImage(prompt,index,file){
  var ref=(prompt.references||[])[index];if(!ref)return;
  if(!getGitHubToken()){toast('GitHub 이미지 연결을 먼저 해주세요.');return}
  setSyncBusy(true);
  try{
    var oldPath=ref.path,meta=await githubGetContentMeta(oldPath);
    var oldExt=(oldPath.split('.').pop()||'').toLowerCase(),newExt=extFromFile(file);
    var path=oldExt===newExt?oldPath:referenceBasePath(prompt)+Date.now()+'-'+safeName(file.name.replace(/\.[^.]+$/,''))+'.'+newExt;
    await githubPutBinary(path,file,'Replace reference image for '+prompt.id,path===oldPath&&meta?meta.sha:null);
    if(path!==oldPath)await githubDeleteBinary(oldPath,'Remove old reference image for '+prompt.id);
    prompt.references[index]={name:file.name.replace(/\.[^.]+$/,''),path:path,mime:file.type,updated:new Date().toISOString()};
    prompt.updated=today();localStorage.setItem(KEY,JSON.stringify(data));
    await githubPushStore('Replace reference image for '+prompt.id);
    setSyncBusy(false,true);toast('레퍼런스 이미지를 교체했습니다.');openItem('prompt',prompt.id);
  }catch(e){setSyncBusy(false,false);toast(e.message||'이미지 교체에 실패했습니다.')}
}
async function deleteReferenceImage(prompt,index){
  var ref=(prompt.references||[])[index];if(!ref)return;
  if(!confirm('이 레퍼런스 이미지를 삭제할까요?'))return;
  if(!getGitHubToken()){toast('GitHub 이미지 연결을 먼저 해주세요.');return}
  setSyncBusy(true);
  try{
    await githubDeleteBinary(ref.path,'Delete reference image for '+prompt.id);
    prompt.references.splice(index,1);prompt.updated=today();localStorage.setItem(KEY,JSON.stringify(data));
    await githubPushStore('Delete reference image metadata for '+prompt.id);
    setSyncBusy(false,true);toast('레퍼런스 이미지를 삭제했습니다.');openItem('prompt',prompt.id);
  }catch(e){setSyncBusy(false,false);toast(e.message||'이미지 삭제에 실패했습니다.')}
}
async function copyReferenceImage(prompt,index){
  var ref=(prompt.references||[])[index];if(!ref)return;
  try{
    if(!navigator.clipboard||typeof ClipboardItem==='undefined')throw new Error('이 브라우저는 이미지 복사를 지원하지 않습니다.');
    var res=await fetch(imageUrl(ref),{cache:'no-store'});if(!res.ok)throw new Error('이미지를 불러오지 못했습니다.');
    var blob=await res.blob(),pngBlob=blob;
    if(blob.type!=='image/png'){
      var bmp=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bmp.width;canvas.height=bmp.height;
      canvas.getContext('2d').drawImage(bmp,0,0);pngBlob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png')});
    }
    await navigator.clipboard.write([new ClipboardItem({'image/png':pngBlob})]);
    toast('이미지를 클립보드에 복사했습니다.');
  }catch(e){
    toast((e.message||'이미지 복사에 실패했습니다.')+' 원본 보기를 이용해주세요.');
  }
}

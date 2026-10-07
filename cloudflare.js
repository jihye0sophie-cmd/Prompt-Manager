const CF_STORE_ENDPOINT='/api/store';
let cfPushTimer=null;
let cfSaveInFlight=false;

function setCloudStatus(kind,message){
  const el=document.querySelector('#cloudStatus');
  if(!el)return;
  el.className='syncStatus '+(kind||'');
  el.innerHTML='<span class="syncDot '+(kind==='ok'?'on':kind==='busy'?'busy':'')+'"></span><span>'+esc(message||'')+'</span>';
}

async function cloudLoadStore(){
  try{
    const res=await fetch(CF_STORE_ENDPOINT,{cache:'no-store'});
    if(!res.ok)throw new Error('Cloudflare 데이터 불러오기 실패 ('+res.status+')');
    const payload=await res.json();
    if(!payload.ok||!payload.data||!Array.isArray(payload.data.prompts)||!Array.isArray(payload.data.sites))throw new Error('Cloudflare 저장 데이터 형식이 올바르지 않습니다.');
    data={prompts:payload.data.prompts,sites:payload.data.sites};
    localStorage.setItem(KEY,JSON.stringify(data));
    render();
    return true;
  }catch(error){
    console.warn(error);
    toast('Cloudflare 연결 실패 · 이 기기의 임시 데이터를 표시합니다.');
    return false;
  }
}

async function cloudPushStore(){
  if(cfSaveInFlight)return false;
  cfSaveInFlight=true;
  setCloudStatus('busy','Cloudflare D1에 저장 중...');
  try{
    const payload={prompts:data.prompts,sites:data.sites,meta:{updated:new Date().toISOString(),storage:'cloudflare-d1'}};
    const res=await fetch(CF_STORE_ENDPOINT,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const result=await res.json().catch(function(){return{}});
    if(!res.ok||!result.ok)throw new Error(result.error||('Cloudflare 저장 실패 ('+res.status+')'));
    setCloudStatus('ok','Cloudflare D1 연결됨');
    return true;
  }catch(error){
    console.warn(error);
    setCloudStatus('error','Cloudflare 저장 실패');
    toast(error.message||'Cloudflare 저장에 실패했습니다.');
    return false;
  }finally{
    cfSaveInFlight=false;
  }
}

function queueCloudPush(){
  clearTimeout(cfPushTimer);
  cfPushTimer=setTimeout(cloudPushStore,450);
}

save=function(){
  localStorage.setItem(KEY,JSON.stringify(data));
  render();
  queueCloudPush();
};

async function githubPushStore(){
  return cloudPushStore();
}

imageUrl=function(ref){
  return '/api/reference-image?path='+encodeURIComponent(ref.path)+'&v='+encodeURIComponent(ref.updated||'');
};

function openSyncSettings(){
  const token=getGitHubToken();
  q('#drawerEye').textContent='CLOUDFLARE + REFERENCES';
  q('#drawerTitle').textContent='저장 및 레퍼런스 이미지';
  q('#drawerBody').innerHTML=
    '<div id="cloudStatus" class="syncStatus"><span class="syncDot on"></span><span>프롬프트·사이트: Cloudflare D1</span></div>'+
    '<p class="syncHint">프롬프트와 사이트 데이터는 저장 시 Cloudflare D1에 자동 반영됩니다. GitHub 토큰은 레퍼런스 이미지 파일을 추가·교체·삭제할 때만 필요합니다.</p>'+
    '<form id="syncForm" class="form">'+
    '<div class="syncGrid"><div><label>이미지 저장소</label><input value="'+GH.owner+'/'+GH.repo+'" readonly></div><div><label>브랜치</label><input value="'+GH.branch+'" readonly></div></div>'+
    '<div><label>GitHub Personal Access Token · 레퍼런스 이미지 전용</label><input id="ghToken" type="password" value="'+esc(token)+'" placeholder="github_pat_... 또는 ghp_..." autocomplete="off"></div>'+
    '<label style="display:flex;gap:8px;align-items:center"><input id="ghRemember" type="checkbox" style="width:auto" '+(localStorage.getItem(GH_LOCAL)?'checked':'')+'> 이 기기에 이미지 연결 정보 기억</label>'+
    '<p class="syncHint">토큰은 코드나 Cloudflare에 저장되지 않습니다. Prompt-Manager 저장소 Contents 읽기/쓰기 권한만 사용하세요.</p>'+
    '<div class="syncActions"><button type="button" class="primary" id="ghConnect">GitHub 이미지 연결 테스트</button><button type="button" class="small" id="cfReload">D1 최신 데이터 불러오기</button><button type="button" class="danger" id="ghDisconnect">GitHub 이미지 연결 해제</button></div>'+
    '</form>';
  showDrawer();

  q('#ghConnect').onclick=async function(){
    const t=q('#ghToken').value.trim();
    if(!t){toast('토큰을 입력해주세요.');return}
    try{
      setSyncBusy(true);
      await testGithubConnection(t);
      setGitHubToken(t,q('#ghRemember').checked);
      setSyncBusy(false,true);
      toast('GitHub 이미지 저장소 연결에 성공했습니다.');
    }catch(e){
      setSyncBusy(false,false);
      toast(e.message||'GitHub 연결에 실패했습니다.');
    }
  };

  q('#cfReload').onclick=async function(){
    const ok=await cloudLoadStore();
    if(ok)toast('Cloudflare D1 최신 데이터를 불러왔습니다.');
  };

  q('#ghDisconnect').onclick=function(){
    setGitHubToken('',false);
    toast('GitHub 이미지 연결 정보를 지웠습니다.');
    openSyncSettings();
  };
}

cloudLoadStore();

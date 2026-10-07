const CF_STORE_ENDPOINT='/api/store';
let cfPushTimer=null;
let cfSaveInFlight=false;
async function cloudLoadStore(){
  try{
    const res=await fetch(CF_STORE_ENDPOINT,{cache:'no-store'});
    if(!res.ok)throw new Error('Cloudflare data load failed');
    const payload=await res.json();
    if(!payload.ok||!payload.data||!Array.isArray(payload.data.prompts)||!Array.isArray(payload.data.sites))throw new Error('Invalid Cloudflare data');
    data={prompts:payload.data.prompts,sites:payload.data.sites};
    localStorage.setItem(KEY,JSON.stringify(data));
    render();
    return true;
  }catch(error){console.warn(error);return false}
}
async function cloudPushStore(){
  if(cfSaveInFlight)return false;
  cfSaveInFlight=true;
  try{
    const payload={prompts:data.prompts,sites:data.sites,meta:{updated:new Date().toISOString()}};
    const res=await fetch(CF_STORE_ENDPOINT,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const result=await res.json().catch(function(){return{}});
    if(!res.ok||!result.ok)throw new Error(result.error||'Cloudflare save failed');
    return true;
  }catch(error){console.warn(error);toast('Cloudflare 저장에 실패했습니다.');return false}
  finally{cfSaveInFlight=false}
}
function queueCloudPush(){clearTimeout(cfPushTimer);cfPushTimer=setTimeout(cloudPushStore,450)}
save=function(){localStorage.setItem(KEY,JSON.stringify(data));render();queueCloudPush()};
cloudLoadStore();
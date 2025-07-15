import { createClient } from 'https://cdn.jsdelivr.net/npm/@storacha/client/dist/index.esm.min.js';

// CONFIG
const LOGIN_EMAIL    = 'guidias1961@gmail.com';
const SPACE_DID      = 'did:key:z6Mkfzfmr6k4WgvQcFtyKyzsLBGzBLJN2LREYeo4DcmHF4df';
const PAYMENT_WALLET = '0x730c82D501Ec341E376F95b9B5D48a059dABc218';
const UPLOAD_FEE     = ethers.utils.parseEther('0.1');

let provider, signer, storachaClient;
let userUploads = JSON.parse(localStorage.getItem('userUploads')||'{}');

// 1) Inicializar Storacha client
(async()=>{
  storachaClient = await createClient();
  await storachaClient.login(LOGIN_EMAIL);
  await storachaClient.setCurrentSpace(SPACE_DID);
})();

// 2) MetaMask
async function connectWallet(){
  if(!window.ethereum){ alert('Instale MetaMask!'); return; }
  await window.ethereum.request({method:'eth_requestAccounts'});
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer   = provider.getSigner();
  const addr= await signer.getAddress();
  document.getElementById('walletAddress').textContent = addr;
  const btn = document.getElementById('connectWallet');
  btn.textContent = addr.slice(0,6)+'…'+addr.slice(-4);
  btn.classList.add('connected');
}

// 3) Expor funções p/ onclick inline
window.connectWallet   = connectWallet;
window.toggleUpload    = toggleUpload;
window.processUpload   = processUpload;
window.toggleModal     = toggleModal;
window.confirmSupport  = confirmSupport;
window.showSection     = ()=>{};  // stubs
window.filterTracks    = ()=>{};
window.prevTrack       = ()=>{};
window.togglePlay      = ()=>{};
window.nextTrack       = ()=>{};
window.seekTrack       = ()=>{};
window.setVolume       = ()=>{};

// 4) Upload flow
async function toggleUpload(){
  if(!document.getElementById('walletAddress').textContent){
    await connectWallet();
  }
  toggleModal('uploadModal', true);
}

function toggleModal(id, show){
  document.getElementById(id).classList.toggle('active', !!show);
  if(!show) document.getElementById('paymentStatus').textContent='';
}

async function processUpload(){
  const status = document.getElementById('paymentStatus');
  status.textContent='Processing payment…'; status.className='';
  try{
    await processPayment();
    const data = await uploadToStoracha();
    status.textContent='Upload successful!'; status.className='payment-success';
    addTrackToUI(data);
    setTimeout(()=>toggleModal('uploadModal',false),2000);
  }catch(e){
    console.error(e);
    status.textContent='Error: '+e.message; status.className='payment-error';
  }
}

async function processPayment(){
  if(!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({to:PAYMENT_WALLET,value:UPLOAD_FEE});
  await tx.wait();
}

async function uploadToStoracha(){
  const title = document.getElementById('trackTitle').value.trim();
  const artist= document.getElementById('trackArtist').value.trim();
  const tw     = document.getElementById('twitterHandle').value.trim();
  const trF    = document.getElementById('trackFile').files[0];
  const cvF    = document.getElementById('coverFile').files[0];
  if(!title||!artist||!trF) throw new Error('Preencha todos os campos obrigatórios');

  const {cid} = await storachaClient.uploadDirectory([trF,cvF].filter(Boolean),{name:title});
  const trackURL = `https://dweb.link/ipfs/${cid}/${encodeURIComponent(trF.name)}`;
  const coverURL = cvF?`https://dweb.link/ipfs/${cid}/${encodeURIComponent(cvF.name)}`:'';

  const id = 'avaxfy_'+Date.now();
  const meta = {id,title,artist,twitterHandle:tw||null,trackURL,coverURL,
                supportWallet:await signer.getAddress(),timestamp:new Date().toISOString(),supporters:[]};

  userUploads[id]=meta;
  localStorage.setItem('userUploads',JSON.stringify(userUploads));
  return meta;
}

function addTrackToUI(t){
  const area=document.getElementById('contentArea');
  area.classList.remove('empty');
  const div=document.createElement('div'); div.className='track';
  div.innerHTML=`
    <div class="rank">#${Object.keys(userUploads).length}</div>
    <img src="${t.coverURL||'https://via.placeholder.com/50'}" alt="Cover">
    <div class="track-info">
      <span>${t.title}</span><span>${t.artist}</span>
      ${t.twitterHandle?`<div class="twitter-handle"><span class="material-icons">tag</span><a href="https://twitter.com/${t.twitterHandle.replace('@','')}" target="_blank">${t.twitterHandle}</a></div>`:''}
      <div class="total-supported">Supported: 0 AVAX</div>
    </div>
    <span class="material-icons favorite-icon">favorite_border</span>
    <button class="support-btn" onclick="confirmSupport()">Support</button>`;
  area.prepend(div);
}

async function confirmSupport(){
  alert('Funcionalidade de support ainda não implementada');
}

window.onload = ()=>{
  if(Object.keys(userUploads).length) document.getElementById('contentArea').classList.remove('empty');
  Object.values(userUploads).forEach(addTrackToUI);
};

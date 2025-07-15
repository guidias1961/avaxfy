import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers/dist/ethers.esm.min.js';

const PAYMENT_ADDR = '0x730c82D501Ec341E376F95b9B5D48a059dABc218';
const FEE          = ethers.utils.parseEther('0.1');
const FREE_ADDR    = PAYMENT_ADDR.toLowerCase();

let provider, signer;

// DOM refs
const homeBtn      = document.getElementById('nav-home');
const favBtn       = document.getElementById('nav-fav');
const uploadBtn    = document.getElementById('btn-upload');
const walletBadge  = document.getElementById('walletBadge');
const uploadModal  = document.getElementById('uploadModal');
const confirmUp    = document.getElementById('confirmUpload');
const cancelUp     = document.getElementById('cancelUpload');
const contentArea  = document.getElementById('contentArea');
const searchBar    = document.getElementById('searchBar');

// Player refs
const coverArt   = document.getElementById('coverArt');
const playBtn    = document.getElementById('playBtn');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const progress   = document.getElementById('progress');
const curTime    = document.getElementById('curTime');
const durTime    = document.getElementById('durTime');
const audio       = new Audio();

let tracks = [], current = 0;

/* —— Wallet & Upload Logic —— */

uploadBtn.onclick = async () => {
  if (!signer) await connectWallet();
  uploadModal.style.display = 'flex';
};

cancelUp.onclick = () => uploadModal.style.display = 'none';

confirmUp.onclick = async () => {
  try {
    const addr = (await signer.getAddress()).toLowerCase();
    if (addr !== FREE_ADDR) {
      const tx = await signer.sendTransaction({
        to: PAYMENT_ADDR,
        value: FEE
      });
      await tx.wait();
    }
    // simulate storacha/IPFS...
    alert('Uploaded ✔️');
    uploadModal.style.display = 'none';
  } catch (e) {
    alert('Error: ' + e.message);
  }
};

async function connectWallet() {
  if (!window.ethereum) {
    alert('Install MetaMask');
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  signer = provider.getSigner();
  const addr = await signer.getAddress();
  walletBadge.style.display = 'block';
  walletBadge.textContent = `Connected: ${addr.slice(0,6)}…${addr.slice(-4)}`;
  uploadBtn.textContent = 'Upload (Ready)';
}

/* —— Track Rendering & Search —— */

function renderTracks(list) {
  contentArea.innerHTML = '';
  list.forEach((t,i) => {
    const row = document.createElement('div');
    row.className = 'track';
    row.innerHTML = `
      <img src="${t.cover||''}" />
      <div class="track-info">
        <span>${t.title}</span>
        <span class="artist">${t.artist}</span>
      </div>`;
    row.onclick = () => playTrack(i);
    contentArea.append(row);
  });
}

searchBar.oninput = () => {
  const q = searchBar.value.toLowerCase();
  renderTracks(tracks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q)
  ));
};

/* —— Player Controls —— */

audio.onloadedmetadata = () => {
  durTime.textContent = fmt(audio.duration);
};
audio.ontimeupdate = () => {
  curTime.textContent = fmt(audio.currentTime);
  progress.value = (audio.currentTime / audio.duration) * 100;
};

playBtn.onclick = () => {
  if (audio.paused) { audio.play(); playBtn.innerHTML = '<span class="material-icons">pause</span>'; }
  else             { audio.pause(); playBtn.innerHTML = '<span class="material-icons">play_arrow</span>'; }
};
prevBtn.onclick = () => switchTrack(current - 1);
nextBtn.onclick = () => switchTrack(current + 1);
progress.oninput = () => {
  if (!audio.duration) return;
  audio.currentTime = progress.value / 100 * audio.duration;
};

function playTrack(i) {
  current = (i + tracks.length) % tracks.length;
  const t = tracks[current];
  audio.src = t.url;
  coverArt.src = t.cover;
  coverArt.style.display = 'block';
  audio.play();
  playBtn.innerHTML = '<span class="material-icons">pause</span>';
}
function switchTrack(i) { playTrack((i + tracks.length) % tracks.length); }
function fmt(sec) {
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  return `${m}:${s<10?'0':''}${s}`;
}

/* —— Initialize Example Tracks —— */

tracks = [
  { title:'AVAX Roadtrip', artist:'Various', url:'tracks/roadtrip.mp3', cover:'covers/roadtrip.jpg' },
  { title:'Dust Echo Consensus', artist:'Various', url:'tracks/dust.mp3', cover:'covers/dust.jpg' },
];
renderTracks(tracks);

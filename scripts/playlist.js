import { 
    tableData, 
    currentAudio, 
    currentPlaylist, 
    currentPlayIndex, 
    playAudio 
} from './data.js';

// 播放列表元素
const playlistOverlay = document.getElementById('playlistOverlay');
const playlistTableBody = document.getElementById('playlistTableBody');
const selectAllPlaylist = document.getElementById('selectAllPlaylist');

// 设置播放列表事件
export function setupPlaylistEvents() {
    // 全选播放列表事件
    selectAllPlaylist.addEventListener('change', function() {
        const playlistSelectors = document.querySelectorAll('.playlist-selector');
        playlistSelectors.forEach(selector => {
            selector.checked = this.checked;
        });
    });
    
    // 绑定播放选中项按钮事件
    document.getElementById('playSelectedBtn').addEventListener('click', playSelectedAudios);
    
    // 绑定停止播放按钮事件
    document.getElementById('stopPlaybackBtn').addEventListener('click', stopPlayback);
}

// 显示播放列表函数
export function showPlaylist() {
    playlistTableBody.innerHTML = '';
    
    // 过滤出有音频的行
    const audioRows = tableData.filter(row => row.audioFile);
    
    if (audioRows.length === 0) {
        playlistTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px;">
                    没有可播放的音频文件
                </td>
            </tr>
        `;
        playlistOverlay.style.display = 'flex';
        return;
    }
    
    // 填充播放列表
    audioRows.forEach((data, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;
        
        row.innerHTML = `
            <td><input type="checkbox" class="playlist-selector" checked></td>
            <td>${data.index}</td>
            <td>${data.english}</td>
            <td>
                <button class="play-btn play-single-btn" data-index="${index}">
                    <span class="playlist-audio-icon"></span>
                    播放
                </button>
            </td>
        `;
        
        playlistTableBody.appendChild(row);
        
        // 绑定单个播放按钮事件
        const playSingleBtn = row.querySelector('.play-single-btn');
        playSingleBtn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            playSingleAudio(index);
        });
    });
    
    // 重置全选状态
    selectAllPlaylist.checked = true;
    
    // 显示播放列表
    playlistOverlay.style.display = 'flex';
}

// 播放单个音频
export function playSingleAudio(index) {
    if (index < 0 || index >= tableData.length || !tableData[index].audioFile) return;
    
    // 停止当前播放
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    // 播放选中的音频
    currentAudio = new Audio(tableData[index].audioFile);
    currentAudio.play().catch(e => {
        console.error('播放音频失败:', e);
        alert('音频文件加载失败，请检查文件路径');
    });
}

// 播放选中的音频
export function playSelectedAudios() {
    const playlistRows = document.querySelectorAll('#playlistTableBody tr');
    currentPlaylist = [];
    
    // 收集选中的行
    playlistRows.forEach((row, index) => {
        const selector = row.querySelector('.playlist-selector');
        if (selector && selector.checked) {
            currentPlaylist.push(index);
        }
    });
    
    if (currentPlaylist.length === 0) {
        alert('请至少选择一项进行播放');
        return;
    }
    
    // 重置播放状态
    currentPlayIndex = -1;
    
    // 移除所有高亮样式
    playlistRows.forEach(row => {
        row.classList.remove('playing-row');
    });
    
    // 开始播放
    playNextInPlaylist();
}

// 播放播放列表中的下一个音频
export function playNextInPlaylist() {
    if (currentPlayIndex >= 0) {
        // 移除上一个播放项的高亮
        const prevRow = document.querySelector(`#playlistTableBody tr:nth-child(${currentPlayIndex + 1})`);
        if (prevRow) {
            prevRow.classList.remove('playing-row');
        }
    }
    
    currentPlayIndex++;
    
    if (currentPlayIndex >= currentPlaylist.length) {
        // 播放结束
        return;
    }
    
    const playlistRows = document.querySelectorAll('#playlistTableBody tr');
    const currentIndex = currentPlaylist[currentPlayIndex];
    
    // 高亮当前播放行
    if (currentIndex < playlistRows.length) {
        playlistRows[currentIndex].classList.add('playing-row');
    }
    
    // 播放音频
    const audioData = tableData.find(row => row.index == playlistRows[currentIndex].cells[1].textContent);
    if (audioData && audioData.audioFile) {
        // 停止当前播放
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // 播放新音频
        currentAudio = new Audio(audioData.audioFile);
        currentAudio.play().catch(e => {
            console.error('播放音频失败:', e);
            alert('音频文件加载失败，请检查文件路径');
        });
        
        // 监听音频结束事件，播放下一个
        currentAudio.onended = function() {
            playNextInPlaylist();
        };
    } else {
        // 如果没有音频文件，直接播放下一个
        playNextInPlaylist();
    }
}

// 停止播放
export function stopPlayback() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    // 移除所有高亮样式
    const playlistRows = document.querySelectorAll('#playlistTableBody tr');
    playlistRows.forEach(row => {
        row.classList.remove('playing-row');
    });
    
    currentPlayIndex = -1;
}
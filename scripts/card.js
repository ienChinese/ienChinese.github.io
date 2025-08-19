import { 
    tableData, 
    currentCardData, 
    currentRowIndex, 
    saveToCache, 
} from './data.js';

import { parseCode } from './syntax.js'; // 从正确模块导入

// 卡片元素
const overlay = document.getElementById('overlay');
const cardContent = document.getElementById('cardContent');

// 设置卡片事件
export function setupCardEvents() {
    // 关闭卡片事件
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeCardHandler();
        }
    });
}

// 关闭卡片函数
export function closeCardHandler() {
    overlay.style.display = 'none';
    // 停止卡片中的音频播放
    const cardAudioPlayer = document.getElementById('cardAudioPlayer');
    if (cardAudioPlayer) {
        cardAudioPlayer.pause();
        cardAudioPlayer.currentTime = 0;
    }
}

// 显示卡片函数
export function showCard(data) {
    // 解析语法编码
    const syntaxInfo = parseCode(data.code);
    let syntaxContent = '';
    
    if (syntaxInfo.sentenceType || syntaxInfo.sentenceStructure || 
        syntaxInfo.tense || syntaxInfo.components.length > 0) {
        
        syntaxContent = `
            <div class="analysis-section">
                <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    语法分析
                </h3>
                <div class="analysis-content">
                    <table class="analysis-table">
                        <tbody>
                            ${syntaxInfo.sentenceType ? `
                                <tr>
                                    <th>句型</th>
                                    <td>${syntaxInfo.sentenceType}</td>
                                </tr>
                            ` : ''}
                            ${syntaxInfo.sentenceStructure ? `
                                <tr>
                                    <th>结构</th>
                                    <td>${syntaxInfo.sentenceStructure}</td>
                                </tr>
                            ` : ''}
                            ${syntaxInfo.tense ? `
                                <tr>
                                    <th>时态</th>
                                    <td>${syntaxInfo.tense}</td>
                                </tr>
                            ` : ''}
                            ${syntaxInfo.components.length > 0 ? `
                                <tr>
                                    <th>句子成分</th>
                                    <td>${syntaxInfo.components.join('、')}</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // 设置卡片中的音频播放器
    const cardAudioPlayer = document.getElementById('cardAudioPlayer');
    if (data.audioFile && cardAudioPlayer) {
        cardAudioPlayer.src = data.audioFile;
        cardAudioPlayer.style.display = 'block';
    } else if (cardAudioPlayer) {
        cardAudioPlayer.style.display = 'none';
    }
    
    cardContent.innerHTML = `
        <div class="card-sentences">
            <div class="english-sentence">${data.english}</div>
            <div class="chinese-sentence">${data.chinese}</div>
        </div>
        
        <div class="audio-section">
            <audio controls class="audio-player" id="cardAudioPlayer"></audio>
        </div>
        
        ${syntaxContent}
        
        <div class="analysis-section">
            <div id="lexicalContent" class="analysis-content" style="${data.lexicalData ? '' : 'display: none'}">
                ${data.lexicalData ? formatAnalysisData(data.lexicalData) : ''}
            </div>
            
            <div id="syntacticContent" class="analysis-content" style="${data.syntacticData ? '' : 'display: none'}">
                ${data.syntacticData ? formatAnalysisData(data.syntacticData) : ''}
            </div>
        </div>
    `;
    
    // 重新设置卡片中的音频播放器
    const newCardAudioPlayer = document.getElementById('cardAudioPlayer');
    if (data.audioFile && newCardAudioPlayer) {
        newCardAudioPlayer.src = data.audioFile;
        newCardAudioPlayer.style.display = 'block';
    } else if (newCardAudioPlayer) {
        newCardAudioPlayer.style.display = 'none';
    }
    
    // 绑定词法文件按钮事件
    document.getElementById('loadLexicalBtn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataArray = new Uint8Array(e.target.result);
                const workbook = XLSX.read(dataArray, {type: 'array'});
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                // 存储词法数据
                data.lexicalData = jsonData;
                
                // 更新卡片显示
                document.getElementById('lexicalContent').innerHTML = formatAnalysisData(jsonData);
                document.getElementById('lexicalContent').style.display = 'block';
                
                // 保存到缓存
                saveToCache();
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    });
    
    // 绑定句法文件按钮事件
    document.getElementById('loadSyntacticBtn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataArray = new Uint8Array(e.target.result);
                const workbook = XLSX.read(dataArray, {type: 'array'});
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                // 存储句法数据
                data.syntacticData = jsonData;
                
                // 更新卡片显示
                document.getElementById('syntacticContent').innerHTML = formatAnalysisData(jsonData);
                document.getElementById('syntacticContent').style.display = 'block';
                
                // 保存到缓存
                saveToCache();
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    });
    
    overlay.style.display = 'flex';
}

// 格式化分析数据为表格
export function formatAnalysisData(data) {
    if (!data || data.length === 0) return '<p>无分析数据</p>';
    
    let headers = data[0];
    let rows = data.slice(1);
    
    let tableHTML = '<table class="analysis-table">';
    
    // 表头
    tableHTML += '<tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr>';
    
    // 数据行
    rows.forEach(row => {
        tableHTML += '<tr>';
        row.forEach(cell => {
            tableHTML += `<td>${cell}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</table>';
    return tableHTML;
}
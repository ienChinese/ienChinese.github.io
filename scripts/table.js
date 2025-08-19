import { 
    tableData, 
    saveToCache, 
    playAudio
} from './data.js';
import { parseCode } from './syntax.js'; // 从正确模块导入

// 表格容器元素
const table = document.getElementById('dialogueTable');
const tableBody = table.querySelector('tbody');
const tableContainer = document.getElementById('tableContainer');
const columnEditor = document.getElementById('columnEditor');
const rowEditor = document.getElementById('rowEditor');
const overlay = document.getElementById('overlay');

// 设置表格事件
export function setupTableEvents() {
    // 列显示/隐藏事件
    const columnCheckboxes = document.querySelectorAll('.column-checkboxes input[type="checkbox"]');
    columnCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const colIndex = parseInt(this.dataset.column);
            const columns = table.querySelectorAll('tr > *:nth-child(' + (colIndex + 1) + ')');
            
            if (this.checked) {
                columns.forEach(col => col.style.display = '');
            } else {
                columns.forEach(col => col.style.display = 'none');
            }
        });
    });
    
    // 显示所有行按钮事件
    document.getElementById('showAllRowsBtn').addEventListener('click', function() {
        tableData.forEach(data => {
            data.visible = true;
        });
        populateTable();
        saveToCache();
    });
    
    // 仅显示有音频的行按钮事件
    document.getElementById('showAudioRowsBtn').addEventListener('click', function() {
        tableData.forEach(data => {
            data.visible = !!data.audioFile;
        });
        populateTable();
        saveToCache();
    });
    
    // 隐藏选中行按钮事件
    document.getElementById('hideSelectedRowsBtn').addEventListener('click', function() {
        const rowSelectors = document.querySelectorAll('.row-selector');
        rowSelectors.forEach((selector, index) => {
            if (selector.checked && index < tableData.length) {
                tableData[index].visible = false;
            }
        });
        populateTable();
        saveToCache();
    });
    
    // 双击行事件
    tableBody.addEventListener('dblclick', function(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        
        // 获取行索引（直接使用行索引）
        const rowIndex = Array.from(tableBody.children).indexOf(row);
        if (rowIndex >= 0 && rowIndex < tableData.length) {
            currentRowIndex = rowIndex;
            currentCardData = tableData[rowIndex];
            showCard(currentCardData);
        }
    });
    
    // 设置列宽调整功能
    setupColumnResizers();
}

// 填充表格函数
export function populateTable() {
    tableBody.innerHTML = '';
    
    tableData.forEach((data, index) => {
        if (!data.visible) return;
        
        const row = document.createElement('tr');
        
        // 音频单元格处理 - 只保留图标
        let audioCellContent = '';
        if (data.audioFile) {
            audioCellContent = `
                <div class="audio-cell">
                    <div class="audio-controls" data-audio="${data.audioFile}">
                        <span class="audio-icon"></span>
                    </div>
                </div>
            `;
        } else {
            audioCellContent = `
                <div class="audio-cell">
                    <div class="audio-controls">
                        <span>暂无音频</span>
                    </div>
                </div>
            `;
        }
        
        row.innerHTML = `
            <td class="row-selector-cell"><input type="checkbox" class="row-selector"></td>
            <td>${data.index}</td>
            <td>${data.time}</td>
            <td>${data.character}</td>
            <td>${data.english}</td>
            <td>${data.chinese}</td>
            <td>${audioCellContent}</td>
        `;
        
        // 添加悬停效果
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f7ff';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        tableBody.appendChild(row);
        
        // 绑定音频播放事件
        if (data.audioFile) {
            const audioControls = row.querySelector('.audio-controls');
            audioControls.addEventListener('click', function() {
                playAudio(data.audioFile);
            });
        }
        
        // 为英文台词单元格添加语法提示功能
        const englishCell = row.querySelector('td:nth-child(5)');
        setupSyntaxTooltip(englishCell, data);
    });
}

// 设置语法提示功能
function setupSyntaxTooltip(cell, rowData) {
    const syntaxTooltip = document.getElementById('syntaxTooltip');
    if (!syntaxTooltip) return;
    
    // 鼠标移入事件
    cell.addEventListener('mouseenter', function(e) {
        // 显示语法分析提示框
        showSyntaxTooltip(e, rowData);
    });
    
    // 鼠标移动事件 - 更新提示框位置
    cell.addEventListener('mousemove', function(e) {
        updateSyntaxTooltipPosition(e);
    });
    
    // 鼠标移出事件
    cell.addEventListener('mouseleave', function() {
        syntaxTooltip.classList.remove('visible');
    });
}

// 显示语法分析提示框
function showSyntaxTooltip(e, rowData) {
    const syntaxTooltip = document.getElementById('syntaxTooltip');
    if (!syntaxTooltip) return;
    
    if (!rowData.code) {
        syntaxTooltip.innerHTML = `
            <div class="syntax-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                语法分析
            </div>
            <div class="syntax-content">
                该台词暂无语法分析数据
            </div>
        `;
    } else {
        // 解析编码
        const syntaxInfo = parseCode(rowData.code);
        
        // 构建提示框内容
        let contentHTML = '';
        
        if (syntaxInfo.sentenceType) {
            contentHTML += `
                <div class="syntax-item">
                    <div class="syntax-label">句型:</div>
                    <div class="syntax-value">${syntaxInfo.sentenceType}</div>
                </div>
            `;
        }
        
        if (syntaxInfo.sentenceStructure) {
            contentHTML += `
                <div class="syntax-item">
                    <div class="syntax-label">结构:</div>
                    <div class="syntax-value">${syntaxInfo.sentenceStructure}</div>
                </div>
            `;
        }
        
        if (syntaxInfo.tense) {
            contentHTML += `
                <div class="syntax-item">
                    <div class="syntax-label">时态:</div>
                    <div class="syntax-value">${syntaxInfo.tense}</div>
                </div>
            `;
        }
        
        if (syntaxInfo.components && syntaxInfo.components.length > 0) {
            contentHTML += `
                <div class="syntax-item">
                    <div class="syntax-label">句子成分:</div>
                    <div class="syntax-value">${syntaxInfo.components.join('、')}</div>
                </div>
            `;
        }
        
        syntaxTooltip.innerHTML = `
            <div class="syntax-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                语法分析
            </div>
            <div class="syntax-content">
                ${contentHTML || '<div class="syntax-item">无法解析语法编码</div>'}
            </div>
        `;
    }
    
    // 固定在鼠标右上方50px处
    updateSyntaxTooltipPosition(e);
    syntaxTooltip.classList.add('visible');
}

// 更新语法提示框位置
function updateSyntaxTooltipPosition(e) {
    const syntaxTooltip = document.getElementById('syntaxTooltip');
    if (!syntaxTooltip) return;
    
    const tooltipWidth = syntaxTooltip.offsetWidth;
    const tooltipHeight = syntaxTooltip.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = e.pageX + 50;
    let top = e.pageY - 50;
    
    // 如果提示框会超出右边界
    if (left + tooltipWidth > windowWidth) {
        left = e.pageX - tooltipWidth - 20;
    }
    
    // 如果提示框会超出下边界
    if (top + tooltipHeight > windowHeight) {
        top = e.pageY - tooltipHeight - 20;
    }
    
    // 确保不会超出上边界
    if (top < 0) {
        top = 10;
    }
    
    syntaxTooltip.style.left = left + 'px';
    syntaxTooltip.style.top = top + 'px';
}

// 设置列宽调整功能
function setupColumnResizers() {
    const thElements = table.querySelectorAll('th');
    let startX, startWidth, currentTh;
    
    thElements.forEach(th => {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        
        th.appendChild(resizer);
        
        resizer.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startX = e.clientX;
            startWidth = th.offsetWidth;
            currentTh = th;
            resizer.classList.add('resizing');
            
            document.addEventListener('mousemove', resizeHandler);
            document.addEventListener('mouseup', stopResize);
        });
        
        function resizeHandler(e) {
            if (!currentTh) return;
            
            const newWidth = startWidth + (e.clientX - startX);
            currentTh.style.width = `${newWidth}px`;
            
            // 更新整个表格布局
            table.style.width = 'auto';
        }
        
        function stopResize() {
            if (resizer) {
                resizer.classList.remove('resizing');
            }
            currentTh = null;
            document.removeEventListener('mousemove', resizeHandler);
            document.removeEventListener('mouseup', stopResize);
        }
    });
}
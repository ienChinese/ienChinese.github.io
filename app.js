// app.js - 主应用逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const editColumnsBtn = document.getElementById('editColumnsBtn');
    const playlistBtn = document.getElementById('playlistBtn');
    const rowEditBtn = document.getElementById('rowEditBtn');
    const columnEditor = document.getElementById('columnEditor');
    const rowEditor = document.getElementById('rowEditor');
    const table = document.getElementById('dialogueTable');
    const tableContainer = document.getElementById('tableContainer');
    const tableBody = document.getElementById('tableBody');
    const overlay = document.getElementById('overlay');
    const playlistOverlay = document.getElementById('playlistOverlay');
    const cardContent = document.getElementById('cardContent');
    const columnCheckboxes = document.querySelectorAll('.column-checkboxes input[type="checkbox"]');
    const cacheIndicator = document.getElementById('cacheIndicator');
    const syntaxTooltip = document.getElementById('syntaxTooltip');
    const selectAllPlaylist = document.getElementById('selectAllPlaylist');
    const cardAudioPlayer = document.getElementById('cardAudioPlayer');
    
    // 表格数据存储 - 初始化为空数组
    let tableData = [];
    
    // 当前播放的音频
    let currentAudio = null;
    let currentPlaylist = [];
    let currentPlayIndex = -1;
    
    // 当前显示的卡片数据
    let currentCardData = null;
    let currentRowIndex = null;
    
    // 编码规则映射
    const codeRules = {
        "AAA": "陈述句",
        "AABA": "一般疑问句",
        "AABB": "特殊疑问句",
        "AABC": "选择疑问句",
        "AABD": "反意疑问句",
        "AAC": "祈使句",
        "AAD": "感叹句",
        "ABA": "简单句",
        "ABB": "并列复合句",
        "ABCAA": "主语从句",
        "ABCAB": "宾语从句",
        "ABCAC": "表语从句",
        "ABCAD": "同位语从句",
        "ABCAE": "直接引语",
        "ABCAF": "间接引语",
        "ABCBA": "限制性定语从句",
        "ABCBB": "非限制性定语从句",
        "ABCCA": "时间状语从句",
        "ABCCB": "地点状语从句",
        "ABCCC": "原因状语从句",
        "ABCCD": "目的状语从句",
        "ABCCE": "结果状语从句",
        "ABCCF": "条件状语从句",
        "ABCCG": "让步状语从句",
        "ABCCH": "比较状语从句",
        "ABCCI": "方式状语从句",
        "ACA": "主谓",
        "ACB": "主谓宾",
        "ACC": "主系表",
        "ACD": "主谓间宾直宾",
        "ACE": "主谓宾宾补",
        "ACF": "主谓状",
        "ACG": "主谓宾状语",
        "ACH": "存现句",
        "ADA": "一般现在时",
        "ADB": "一般过去时",
        "ADC": "一般将来时",
        "ADD": "一般过去将来时",
        "ADE": "现在进行时",
        "ADF": "过去进行时",
        "ADG": "将来进行时",
        "ADH": "过去将来进行时",
        "ADI": "现在完成时",
        "ADJ": "过去完成时",
        "ADK": "将来完成时",
        "ADL": "过去将来完成时",
        "ADM": "现在完成进行时",
        "ADN": "过去完成进行时",
        "ADO": "将来完成进行时",
        "ADP": "过去将来完成进行时",
        "AEA": "主语",
        "AEB": "谓语",
        "AEC": "表语",
        "AED": "宾语",
        "AEE": "定语",
        "AEF": "状语",
        "AEG": "补足语",
        "AEH": "同位语",
        "AEI": "独立成分"
    };
    
    // 初始化应用
    function initApp() {
        loadFromCache();
        loadDefaultExcel();
        setupEventListeners();
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 编辑列按钮事件
        editColumnsBtn.addEventListener('click', function() {
            columnEditor.style.display = columnEditor.style.display === 'block' ? 'none' : 'block';
            rowEditor.style.display = 'none';
        });
        
        // 行编辑按钮事件
        rowEditBtn.addEventListener('click', function() {
            const isVisible = rowEditor.style.display === 'block';
            rowEditor.style.display = isVisible ? 'none' : 'block';
            columnEditor.style.display = 'none';
            
            // 切换行选择列的显示
            if (isVisible) {
                tableContainer.classList.remove('row-editor-visible');
            } else {
                tableContainer.classList.add('row-editor-visible');
            }
        });
        
        // 列表播放按钮事件
        playlistBtn.addEventListener('click', function() {
            showPlaylist();
        });
        
        // 列显示/隐藏事件
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
        
        // 全选播放列表事件
        selectAllPlaylist.addEventListener('change', function() {
            const playlistSelectors = document.querySelectorAll('.playlist-selector');
            playlistSelectors.forEach(selector => {
                selector.checked = this.checked;
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
            
            // 获取行索引
            const rowIndex = Array.from(tableBody.children).indexOf(row);
            if (rowIndex >= 0 && rowIndex < tableData.length) {
                currentRowIndex = rowIndex;
                currentCardData = tableData[rowIndex];
                showCard(currentCardData);
            }
        });
        
        // 关闭卡片事件
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeCardHandler();
            }
        });
        
        // 关闭播放列表事件
        playlistOverlay.addEventListener('click', function(e) {
            if (e.target === playlistOverlay) {
                playlistOverlay.style.display = 'none';
            }
        });
    }
    
    // 关闭卡片函数
    function closeCardHandler() {
        overlay.style.display = 'none';
        // 停止卡片中的音频播放
        if (cardAudioPlayer) {
            cardAudioPlayer.pause();
            cardAudioPlayer.currentTime = 0;
        }
    }
    
    // 自动加载默认Excel文件
    function loadDefaultExcel() {
        // 模拟从服务器加载数据
        setTimeout(() => {
            // 使用示例数据
            useSampleData();
            showCacheIndicator();
        }, 500);
    }
    
    // 使用示例数据
    function useSampleData() {
        tableData = [
            {
                index: "1",
                time: "00:05:23",
                character: "千寻",
                english: "Mom, Dad, please wait for me!",
                chinese: "妈妈，爸爸，请等等我！",
                code: "AAD,ACC,ADA",
                audioFile: "./mp3/en/00.05.23.en.mp3",
                visible: true
            },
            {
                index: "2",
                time: "00:12:45",
                character: "白龙",
                english: "You must remember your real name.",
                chinese: "你必须记住你真正的名字。",
                code: "AAA,ACB,ADB",
                audioFile: "./mp3/en/00.12.45.en.mp3",
                visible: true
            },
            {
                index: "3",
                time: "00:25:18",
                character: "锅炉爷爷",
                english: "Work hard and never complain.",
                chinese: "努力工作，永远不要抱怨。",
                code: "AAC,ABB,ADA",
                audioFile: "./mp3/en/00.25.18.en.mp3",
                visible: true
            },
            {
                index: "4",
                time: "00:32:10",
                character: "汤婆婆",
                english: "If you want to survive here, you must work!",
                chinese: "如果你想在这里生存，就必须工作！",
                code: "ABCCF,ACB,ADA",
                audioFile: "./mp3/en/00.32.10.en.mp3",
                visible: true
            },
            {
                index: "5",
                time: "00:45:22",
                character: "无脸男",
                english: "I'm lonely... so lonely.",
                chinese: "我很孤独...太孤独了。",
                code: "AAA,ACC,ADA",
                audioFile: "./mp3/en/00.45.22.en.mp3",
                visible: true
            },
            {
                index: "6",
                time: "01:05:37",
                character: "千寻",
                english: "I remember when I was little, I fell into a river.",
                chinese: "我记得小时候，我掉进了一条河里。",
                code: "ABCAB,ACB,ADB",
                audioFile: "./mp3/en/01.05.37.en.mp3",
                visible: true
            },
            {
                index: "7",
                time: "01:18:49",
                character: "白龙",
                english: "Your real name is Chihiro.",
                chinese: "你真正的名字是千寻。",
                code: "AAA,ACC,ADA",
                audioFile: "./mp3/en/01.18.49.en.mp3",
                visible: true
            },
            {
                index: "8",
                time: "01:30:15",
                character: "钱婆婆",
                english: "The best things happen by chance.",
                chinese: "最好的事情都是偶然发生的。",
                code: "AAA,ACB,ADA",
                audioFile: "./mp3/en/01.30.15.en.mp3",
                visible: true
            },
            {
                index: "9",
                time: "01:45:30",
                character: "千寻",
                english: "I think I can handle it. I've gotten stronger.",
                chinese: "我想我能应付。我变得更强了。",
                code: "AAA,ACB,ADI",
                audioFile: "./mp3/en/01.45.30.en.mp3",
                visible: true
            },
            {
                index: "10",
                time: "02:00:22",
                character: "白龙",
                english: "Don't look back. Keep going until you're out.",
                chinese: "不要回头。一直往前走，直到你出去。",
                code: "AAC,ACF,ADA",
                audioFile: "./mp3/en/02.00.22.en.mp3",
                visible: true
            },
            {
                index: "11",
                time: "02:15:18",
                character: "锅炉爷爷",
                english: "She did it! She remembered her promise!",
                chinese: "她做到了！她记住了她的承诺！",
                code: "AAD,ACB,ADB",
                audioFile: "./mp3/en/02.15.18.en.mp3",
                visible: true
            },
            {
                index: "12",
                time: "02:30:05",
                character: "汤婆婆",
                english: "How dare you come back here after what you've done!",
                chinese: "你做了那些事之后，竟敢回到这里！",
                code: "AAD,ACB,ADB",
                audioFile: "./mp3/en/02.30.05.en.mp3",
                visible: true
            },
            {
                index: "13",
                time: "02:45:40",
                character: "千寻",
                english: "I'm not afraid anymore. I know what I have to do.",
                chinese: "我不再害怕了。我知道我必须做什么。",
                code: "AAA,ACB,ADI",
                audioFile: "./mp3/en/02.45.40.en.mp3",
                visible: true
            },
            {
                index: "14",
                time: "03:00:15",
                character: "无脸男",
                english: "I want to be with you. Can I stay by your side?",
                chinese: "我想和你在一起。我可以留在你身边吗？",
                code: "AAA,ACB,ADA",
                audioFile: "./mp3/en/03.00.15.en.mp3",
                visible: true
            },
            {
                index: "15",
                time: "03:15:30",
                character: "钱婆婆",
                english: "Magic doesn't solve everything. You have to do the work yourself.",
                chinese: "魔法不能解决所有问题。你必须自己去做。",
                code: "AAA,ACB,ADA",
                audioFile: "./mp3/en/03.15.30.en.mp3",
                visible: true
            }
        ];
        
        // 保存到缓存
        saveToCache();
        
        // 填充表格
        populateTable();
    }
    
    // 填充表格函数
    function populateTable() {
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
    
    // 解析编码为语法信息
    function parseCode(code) {
        const result = {
            sentenceType: null,
            sentenceStructure: null,
            tense: null,
            components: []
        };
        
        if (!code) return result;
        
        // 分割编码
        const codes = code.split(',').map(c => c.trim());
        
        codes.forEach(c => {
            if (c.startsWith('AA')) {
                // 句型
                result.sentenceType = codeRules[c] || c;
            } else if (c.startsWith('AC')) {
                // 结构
                result.sentenceStructure = codeRules[c] || c;
            } else if (c.startsWith('AD')) {
                // 时态
                result.tense = codeRules[c] || c;
            } else if (c.startsWith('AE')) {
                // 成分
                const component = codeRules[c] || c;
                if (component) {
                    result.components.push(component);
                }
            }
        });
        
        return result;
    }
    
    // 播放音频函数
    function playAudio(audioUrl) {
        // 停止当前正在播放的音频
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // 创建新的音频对象并播放
        currentAudio = new Audio(audioUrl);
        currentAudio.play().catch(e => {
            console.error('播放音频失败:', e);
            alert('音频文件加载失败，请检查文件路径');
        });
    }
    
    // 显示卡片函数
    function showCard(data) {
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
        if (data.audioFile && cardAudioPlayer) {
            cardAudioPlayer.src = data.audioFile;
            cardAudioPlayer.style.display = 'block';
        } else {
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
        } else {
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
    
    // 显示播放列表函数
    function showPlaylist() {
        const playlistTableBody = document.getElementById('playlistTableBody');
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
        
        // 绑定播放选中项按钮事件
        document.getElementById('playSelectedBtn').addEventListener('click', playSelectedAudios);
        
        // 绑定停止播放按钮事件
        document.getElementById('stopPlaybackBtn').addEventListener('click', stopPlayback);
    }
    
    // 播放单个音频
    function playSingleAudio(index) {
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
    function playSelectedAudios() {
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
    function playNextInPlaylist() {
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
    function stopPlayback() {
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
    
    // 格式化分析数据为表格
    function formatAnalysisData(data) {
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
    
    // 保存数据到缓存
    function saveToCache() {
        try {
            // 准备要缓存的数据
            const dataToCache = {
                tableData: tableData.map(item => {
                    return {
                        ...item,
                        audioFile: null, // 不缓存音频文件对象
                        lexicalData: item.lexicalData || null,
                        syntacticData: item.syntacticData || null
                    };
                })
            };
            
            // 保存到localStorage
            localStorage.setItem('spiritedAwayData', JSON.stringify(dataToCache));
            console.log('数据已保存到缓存');
        } catch (e) {
            console.error('保存到缓存失败:', e);
        }
    }
    
    // 从缓存加载数据
    function loadFromCache() {
        try {
            const cachedData = localStorage.getItem('spiritedAwayData');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                tableData = parsedData.tableData || [];
                
                // 恢复音频文件路径
                tableData.forEach(item => {
                    if (item.time) {
                        const audioFileName = item.time.replace(/:/g, '.') + '.en.mp3';
                        item.audioFile = `./mp3/en/${audioFileName}`;
                    }
                });
                
                console.log('从缓存加载数据成功');
            }
        } catch (e) {
            console.error('从缓存加载数据失败:', e);
        }
    }
    
    // 显示缓存指示器
    function showCacheIndicator() {
        cacheIndicator.style.display = 'flex';
        setTimeout(() => {
            cacheIndicator.style.opacity = '0';
            setTimeout(() => {
                cacheIndicator.style.display = 'none';
                cacheIndicator.style.opacity = '1';
            }, 1000);
        }, 3000);
    }
    
    // 初始化应用
    initApp();
});
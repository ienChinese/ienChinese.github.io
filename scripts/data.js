// 全局数据存储
export let tableData = [];
export let currentAudio = null;
export let currentPlaylist = [];
export let currentPlayIndex = -1;
export let currentCardData = null;
export let currentRowIndex = null;

// 编码规则映射
export const codeRules = {
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

// 从缓存加载数据
export function loadFromCache() {
    try {
        const cachedData = localStorage.getItem('spiritedAwayData');
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            tableData = parsedData.tableData || [];
            
            // 恢复音频文件路径
            tableData.forEach(item => {
                if (item.time) {
                    const audioFileName = item.time.replace(/:/g, '.') + '.en.mp3';
                    item.audioFile = `./assets/mp3/en/${audioFileName}`;
                }
            });
            
            console.log('从缓存加载数据成功');
        }
    } catch (e) {
        console.error('从缓存加载数据失败:', e);
    }
}

// 自动加载默认Excel文件
export function loadDefaultExcel() {
    loadFromCache();
    
    if (tableData.length > 0) {
        return; // 如果缓存中有数据，不再加载
    }
    
    fetch('./assets/excel/xiaoqian.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('文件加载失败: ' + response.statusText);
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), {type: 'array'});
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // 处理数据（跳过标题行）
            tableData = jsonData.slice(1).map(mapExcelData);
            
            // 保存到缓存
            saveToCache();
            
            // 显示缓存指示器
            showCacheIndicator();
        })
        .catch(error => {
            console.error('加载默认Excel文件失败:', error);
            // 使用示例数据作为后备
            useSampleData();
        });
}

// 数据映射函数
export function mapExcelData(row) {
    // 生成音频文件名（时间值替换冒号为点）
    const audioFileName = row[1] ? `${row[1].replace(/:/g, '.')}.en.mp3` : '';
    
    return {
        index: row[0] || '',
        time: row[1] || '',
        character: row[2] || '',
        english: row[3] || '',
        chinese: row[4] || '',
        code: row[5] || '',
        audioFile: audioFileName ? `./assets/mp3/en/${audioFileName}` : null,
        lexicalData: null,
        syntacticData: null,
        visible: true
    };
}

// 使用示例数据
export function useSampleData() {
    tableData = [
        {
            index: "1",
            time: "00:05:23",
            character: "千寻",
            english: "Mom, Dad, please wait for me!",
            chinese: "妈妈，爸爸，请等等我！",
            code: "AAD,ACC,ADA",
            audioFile: "./assets/mp3/en/00.05.23.en.mp3",
            visible: true
        },
        {
            index: "2",
            time: "00:12:45",
            character: "白龙",
            english: "You must remember your real name.",
            chinese: "你必须记住你真正的名字。",
            code: "AAA,ACB,ADB",
            audioFile: "./assets/mp3/en/00.12.45.en.mp3",
            visible: true
        },
        {
            index: "3",
            time: "00:25:18",
            character: "锅炉爷爷",
            english: "Work hard and never complain.",
            chinese: "努力工作，永远不要抱怨。",
            code: "AAC,ABB,ADA",
            audioFile: "./assets/mp3/en/00.25.18.en.mp3",
            visible: true
        },
        {
            index: "4",
            time: "00:32:10",
            character: "汤婆婆",
            english: "If you want to survive here, you must work!",
            chinese: "如果你想在这里生存，就必须工作！",
            code: "ABCCF,ACB,ADA",
            audioFile: "./assets/mp3/en/00.32.10.en.mp3",
            visible: true
        },
        {
            index: "5",
            time: "00:45:22",
            character: "无脸男",
            english: "I'm lonely... so lonely.",
            chinese: "我很孤独...太孤独了。",
            code: "AAA,ACC,ADA",
            audioFile: "./assets/mp3/en/00.45.22.en.mp3",
            visible: true
        },
        {
            index: "6",
            time: "01:05:37",
            character: "千寻",
            english: "I remember when I was little, I fell into a river.",
            chinese: "我记得小时候，我掉进了一条河里。",
            code: "ABCAB,ACB,ADB",
            audioFile: "./assets/mp3/en/01.05.37.en.mp3",
            visible: true
        },
        {
            index: "7",
            time: "01:18:49",
            character: "白龙",
            english: "Your real name is Chihiro.",
            chinese: "你真正的名字是千寻。",
            code: "AAA,ACC,ADA",
            audioFile: "./assets/mp3/en/01.18.49.en.mp3",
            visible: true
        },
        {
            index: "8",
            time: "01:30:15",
            character: "钱婆婆",
            english: "The best things happen by chance.",
            chinese: "最好的事情都是偶然发生的。",
            code: "AAA,ACB,ADA",
            audioFile: "./assets/mp3/en/01.30.15.en.mp3",
            visible: true
        }
    ];
    
    // 保存到缓存
    saveToCache();
    
    // 显示缓存指示器
    showCacheIndicator();
}

// 保存数据到缓存
export function saveToCache() {
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

// 显示缓存指示器
export function showCacheIndicator() {
    const cacheIndicator = document.getElementById('cacheIndicator');
    if (!cacheIndicator) return;
    
    cacheIndicator.style.display = 'flex';
    setTimeout(() => {
        cacheIndicator.style.opacity = '0';
        setTimeout(() => {
            cacheIndicator.style.display = 'none';
            cacheIndicator.style.opacity = '1';
        }, 1000);
    }, 3000);
}
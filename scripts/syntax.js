import { codeRules } from './data.js';

// 解析编码为语法信息
export function parseCode(code) {
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
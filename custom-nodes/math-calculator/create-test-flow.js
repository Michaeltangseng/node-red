#!/usr/bin/env node
/**
 * 自动创建测试流程脚本
 * 
 * 使用方法:
 *   node create-test-flow.js [options]
 * 
 * 选项:
 *   --url <url>      Node-RED API 地址 (默认: http://localhost:1880)
 *   --user <user>    用户名 (如果需要认证)
 *   --pass <pass>    密码 (如果需要认证)
 *   --flow-id <id>   流程ID (如果不提供，将创建新流程)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        url: 'http://localhost:1880',
        user: null,
        pass: null,
        flowId: null
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--url' && args[i + 1]) {
            options.url = args[i + 1];
            i++;
        } else if (args[i] === '--user' && args[i + 1]) {
            options.user = args[i + 1];
            i++;
        } else if (args[i] === '--pass' && args[i + 1]) {
            options.pass = args[i + 1];
            i++;
        } else if (args[i] === '--flow-id' && args[i + 1]) {
            options.flowId = args[i + 1];
            i++;
        }
    }
    
    return options;
}

// 生成唯一ID（简化版，实际应该使用更可靠的ID生成）
function generateId() {
    return Math.random().toString(36).substr(2, 9) + '.' + Math.random().toString(36).substr(2, 6);
}

// 创建测试流程的节点配置
function createTestFlow(flowId) {
    const tabId = flowId || generateId();
    
    // 创建节点ID
    const injectId = generateId();
    const mathId = generateId();
    const debugId = generateId();
    
    // 创建流程配置
    const flow = [
        // Tab 节点
        {
            id: tabId,
            type: "tab",
            label: "Math Calculator Test",
            disabled: false,
            info: "自动生成的数学计算测试流程"
        },
        // Inject 节点
        {
            id: injectId,
            type: "inject",
            z: tabId,
            name: "Test Input",
            props: [
                { p: "payload" },
                { p: "topic", vt: "str" }
            ],
            repeat: "",
            crontab: "",
            once: false,
            onceDelay: 0.1,
            topic: "",
            payload: "10",
            payloadType: "num",
            x: 240,
            y: 180,
            wires: [[mathId]]
        },
        // Math Calculator 节点
        {
            id: mathId,
            type: "math-calculator",
            z: tabId,
            name: "Add 5",
            operation: "add",
            operand1: "payload",
            operand2: "5",
            operand2Type: "num",
            resultProperty: "payload",
            round: false,
            precision: "2",
            x: 450,
            y: 180,
            wires: [[debugId]]
        },
        // Debug 节点
        {
            id: debugId,
            type: "debug",
            z: tabId,
            name: "Result",
            active: true,
            tosidebar: true,
            console: false,
            tostatus: false,
            complete: "false",
            statusVal: "",
            statusType: "auto",
            x: 660,
            y: 180,
            wires: []
        }
    ];
    
    return flow;
}

// 发送 HTTP 请求
function makeRequest(url, method, data, auth) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Node-RED-Deployment-Type': 'full'
            }
        };
        
        if (auth) {
            const authString = Buffer.from(`${auth.user}:${auth.pass}`).toString('base64');
            options.headers['Authorization'] = `Basic ${authString}`;
        }
        
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        statusCode: res.statusCode,
                        body: body ? JSON.parse(body) : null
                    });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 获取当前流程
async function getCurrentFlows(url, auth) {
    try {
        const response = await makeRequest(`${url}/flows`, 'GET', null, auth);
        return response.body.flows || [];
    } catch (err) {
        console.error('获取流程失败:', err.message);
        throw err;
    }
}

// 设置流程
async function setFlows(url, flows, auth) {
    try {
        const response = await makeRequest(`${url}/flows`, 'POST', { flows: flows }, auth);
        console.log('✅ 流程创建成功!');
        return response;
    } catch (err) {
        console.error('设置流程失败:', err.message);
        throw err;
    }
}

// 主函数
async function main() {
    const options = parseArgs();
    
    console.log('🚀 开始创建测试流程...');
    console.log(`📍 Node-RED 地址: ${options.url}`);
    
    try {
        // 获取当前流程
        let currentFlows = [];
        try {
            currentFlows = await getCurrentFlows(options.url, options.user && options.pass ? { user: options.user, pass: options.pass } : null);
            console.log(`📋 当前有 ${currentFlows.length} 个节点`);
        } catch (err) {
            console.log('⚠️  无法获取当前流程，将创建新流程');
        }
        
        // 创建测试流程
        const testFlow = createTestFlow(options.flowId);
        
        // 合并流程
        const allFlows = [...currentFlows, ...testFlow];
        
        // 设置流程
        await setFlows(options.url, allFlows, options.user && options.pass ? { user: options.user, pass: options.pass } : null);
        
        console.log('✨ 完成! 请在 Node-RED 编辑器中查看新创建的流程。');
        console.log('💡 提示: 点击 inject 节点左侧的按钮来测试流程。');
        
    } catch (err) {
        console.error('❌ 错误:', err.message);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { createTestFlow, generateId };

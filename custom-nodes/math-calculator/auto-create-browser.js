/**
 * 浏览器端自动创建流程脚本
 * 
 * 使用方法：
 * 1. 打开 Node-RED 编辑器
 * 2. 按 F12 打开开发者工具
 * 3. 在 Console 标签页中粘贴并运行此脚本
 */

(function() {
    'use strict';
    
    // 生成唯一ID
    function generateId() {
        return Math.random().toString(36).substr(2, 9) + '.' + Math.random().toString(36).substr(2, 6);
    }
    
    // 创建测试流程
    function createTestFlow() {
        const tabId = generateId();
        const injectId = generateId();
        const mathId = generateId();
        const debugId = generateId();
        
        return [
            {
                id: tabId,
                type: "tab",
                label: "Math Calculator Test",
                disabled: false,
                info: "自动生成的数学计算测试流程"
            },
            {
                id: injectId,
                type: "inject",
                z: tabId,
                name: "Test Input",
                props: [{ p: "payload" }, { p: "topic", vt: "str" }],
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
    }
    
    // 清理节点状态（部署后）
    function cleanupNodeStates() {
        RED.nodes.eachNode(function(node) {
            if (node.changed) { node.dirty = true; node.changed = false; }
            if (node.moved) { node.dirty = true; node.moved = false; }
            if (node.credentials) { delete node.credentials; }
        });
        
        RED.nodes.eachGroup(function(group) {
            if (group.changed) { group.dirty = true; group.changed = false; }
            if (group.moved) { group.dirty = true; group.moved = false; }
        });
        
        RED.nodes.eachConfig(function(confNode) {
            confNode.changed = false;
            if (confNode.credentials) { delete confNode.credentials; }
        });
    }
    
    // 更新UI状态（部署后）
    function updateUIAfterDeploy() {
        const deployButton = $('#red-ui-header-button-deploy');
        deployButton.removeClass('disabled');
        $('.red-ui-deploy-button-content').css('opacity', 1);
        $('.red-ui-deploy-button-spinner').hide();
        $('#red-ui-header-shade').hide();
        
        if (RED.view && RED.view.redraw) RED.view.redraw();
        if (RED.sidebar && RED.sidebar.config && RED.sidebar.config.refresh) {
            RED.sidebar.config.refresh();
        }
        if (RED.history && RED.history.markAllDirty) RED.history.markAllDirty();
    }
    
    // 显示通知
    function showNotify(message, type) {
        if (typeof RED.notify === 'function') {
            RED.notify(message, type);
        }
    }
    
    // 部署流程
    function deployFlow() {
        console.log('🚀 开始自动部署流程...');
        
        try {
            const nns = RED.nodes.createCompleteNodeSet();
            const data = { flows: nns };
            const currentRev = RED.nodes.version();
            
            if (currentRev !== null && currentRev !== undefined) {
                data.rev = currentRev;
                console.log('📌 使用版本号:', currentRev);
            }
            
            console.log('📤 通过 HTTP API 发送部署请求...');
            console.log('📊 部署节点数量:', nns.length);
            
            // 设置部署状态
            if (RED.deploy && typeof RED.deploy.setDeployInflight === 'function') {
                RED.deploy.setDeployInflight(true);
            }
            $('#red-ui-header-shade').show();
            
            // 监听运行时部署确认
            let runtimeDeployReceived = false;
            const runtimeDeployListener = function(topic, msg) {
                if (msg && msg.revision) {
                    runtimeDeployReceived = true;
                    console.log('✅ 运行时已确认部署，版本号:', msg.revision);
                    RED.comms.unsubscribe('notification/runtime-deploy', runtimeDeployListener);
                }
            };
            
            if (RED.comms && typeof RED.comms.subscribe === 'function') {
                RED.comms.subscribe('notification/runtime-deploy', runtimeDeployListener);
            }
            
            $.ajax({
                url: "flows",
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                headers: { "Node-RED-Deployment-Type": "full" }
            }).done(function(responseData) {
                console.log('✅ 部署请求成功!');
                console.log('📌 新版本号:', responseData.rev);
                
                // 更新节点状态
                RED.nodes.dirty(false);
                if (responseData && responseData.rev) {
                    RED.nodes.version(responseData.rev);
                }
                RED.nodes.originalFlow(nns);
                
                // 清理和更新UI
                cleanupNodeStates();
                updateUIAfterDeploy();
                RED.events.emit('deploy');
                
                // 等待并验证部署结果
                setTimeout(function() {
                    if (RED.comms && typeof RED.comms.unsubscribe === 'function') {
                        RED.comms.unsubscribe('notification/runtime-deploy', runtimeDeployListener);
                    }
                    
                    const versionMatch = RED.nodes.version() === responseData.rev;
                    if (versionMatch) {
                        console.log('✅ 部署完成! 流程已成功部署并启动');
                        showNotify('流程已创建并部署成功!', 'success');
                    } else {
                        console.warn('⚠️ 版本号不匹配');
                        showNotify('部署可能未完全生效，请检查', 'warning');
                    }
                }, 2000);
                
            }).fail(function(xhr) {
                console.error('❌ 部署失败:', xhr.status, xhr.responseText);
                
                if (RED.deploy && typeof RED.deploy.setDeployInflight === 'function') {
                    RED.deploy.setDeployInflight(false);
                }
                
                let errorMsg = '部署失败';
                if (xhr.status === 401) {
                    errorMsg = '部署失败: 未授权，请检查权限';
                } else if (xhr.status === 409) {
                    errorMsg = '部署失败: 版本冲突，请刷新页面后重试';
                }
                
                showNotify(errorMsg, 'error');
            });
            
        } catch (err) {
            console.error('❌ 部署异常:', err);
            if (RED.deploy && typeof RED.deploy.setDeployInflight === 'function') {
                RED.deploy.setDeployInflight(false);
            }
            showNotify('流程已创建，但自动部署失败，请手动点击部署按钮', 'warning');
        }
    }
    
    // 切换到流程标签页
    function switchToFlow(tabId) {
        if (RED.workspaces && RED.workspaces.show) {
            RED.workspaces.show(tabId);
        }
        if (RED.view && RED.view.redraw) {
            RED.view.redraw();
        }
    }
    
    // 主函数
    function autoCreateFlow() {
        try {
            console.log('🚀 开始创建测试流程...');
            
            // 检查环境
            if (typeof RED === 'undefined' || !RED.nodes || typeof RED.nodes.import !== 'function') {
                throw new Error('Node-RED 编辑器未加载，请确保在 Node-RED 编辑器中运行此脚本');
            }
            
            const newFlow = createTestFlow();
            console.log(`📋 准备创建 ${newFlow.length} 个节点`);
            
            const importOptions = {
                generateIds: false,
                addFlow: true,
                markChanged: true,
                applyNodeDefaults: false
            };
            
            const importResult = RED.nodes.import(newFlow, importOptions);
            
            if (!importResult) {
                throw new Error('导入返回空结果');
            }
            
            console.log('✅ 流程创建成功!');
            console.log(`📊 创建了 ${importResult.nodes ? importResult.nodes.length : 0} 个节点`);
            
            switchToFlow(newFlow[0].id);
            showNotify('测试流程已创建并正在部署...', 'success');
            console.log('💡 提示: 部署完成后，点击 inject 节点左侧的按钮来测试流程');
            
            // 延迟部署，确保节点已完全加载
            setTimeout(deployFlow, 2000);
            
        } catch (err) {
            console.error('❌ 错误:', err);
            showNotify('创建流程失败: ' + (err.message || err), 'error');
        }
    }
    
    // 自动执行
    autoCreateFlow();
    
    // 导出函数供手动调用
    window.autoCreateMathTestFlow = autoCreateFlow;
    
    console.log('💡 提示: 可以随时调用 window.autoCreateMathTestFlow() 来重新创建流程');
})();

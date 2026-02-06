/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    
    function MathCalculatorNode(config) {
        RED.nodes.createNode(this, config);
        
        // 存储节点配置
        this.operation = config.operation || "add";
        this.operand1 = config.operand1 || "payload";
        this.operand2 = config.operand2 || "0";
        this.operand2Type = config.operand2Type || "num";
        this.resultProperty = config.resultProperty || "payload";
        this.round = config.round || false;
        this.precision = config.precision || 2;
        
        var node = this;
        
        // 处理输入消息
        this.on('input', function(msg, send, done) {
            try {
                // 获取第一个操作数
                var value1 = RED.util.getMessageProperty(msg, node.operand1);
                if (value1 === undefined) {
                    node.error("无法获取操作数1的值: " + node.operand1);
                    done();
                    return;
                }
                value1 = Number(value1);
                if (isNaN(value1)) {
                    node.error("操作数1不是有效数字: " + value1);
                    done();
                    return;
                }
                
                // 获取第二个操作数
                var value2;
                if (node.operand2Type === "msg") {
                    value2 = RED.util.getMessageProperty(msg, node.operand2);
                } else if (node.operand2Type === "flow") {
                    value2 = node.context().flow.get(node.operand2);
                } else if (node.operand2Type === "global") {
                    value2 = node.context().global.get(node.operand2);
                } else {
                    value2 = node.operand2;
                }
                
                if (value2 === undefined || value2 === null || value2 === "") {
                    node.error("无法获取操作数2的值");
                    done();
                    return;
                }
                value2 = Number(value2);
                if (isNaN(value2)) {
                    node.error("操作数2不是有效数字: " + value2);
                    done();
                    return;
                }
                
                // 执行数学运算
                var result;
                switch(node.operation) {
                    case "add":
                        result = value1 + value2;
                        break;
                    case "subtract":
                        result = value1 - value2;
                        break;
                    case "multiply":
                        result = value1 * value2;
                        break;
                    case "divide":
                        if (value2 === 0) {
                            node.error("除数不能为零");
                            done();
                            return;
                        }
                        result = value1 / value2;
                        break;
                    case "modulo":
                        if (value2 === 0) {
                            node.error("模数不能为零");
                            done();
                            return;
                        }
                        result = value1 % value2;
                        break;
                    case "power":
                        result = Math.pow(value1, value2);
                        break;
                    case "sqrt":
                        if (value1 < 0) {
                            node.error("不能对负数开平方根");
                            done();
                            return;
                        }
                        result = Math.sqrt(value1);
                        break;
                    case "abs":
                        result = Math.abs(value1);
                        break;
                    case "floor":
                        result = Math.floor(value1);
                        break;
                    case "ceil":
                        result = Math.ceil(value1);
                        break;
                    case "round":
                        result = Math.round(value1);
                        break;
                    default:
                        node.error("未知的运算类型: " + node.operation);
                        done();
                        return;
                }
                
                // 处理精度
                if (node.round) {
                    result = Math.round(result);
                } else if (node.precision !== undefined && node.precision !== "") {
                    var precision = parseInt(node.precision);
                    if (!isNaN(precision) && precision >= 0) {
                        result = parseFloat(result.toFixed(precision));
                    }
                }
                
                // 设置结果
                RED.util.setMessageProperty(msg, node.resultProperty, result);
                
                // 发送消息
                send(msg);
                done();
                
            } catch (err) {
                node.error("计算错误: " + err.message, msg);
                done();
            }
        });
        
        // 清理资源
        this.on('close', function() {
            // 如果需要清理资源，在这里处理
        });
    }
    
    // 注册节点类型
    RED.nodes.registerType("math-calculator", MathCalculatorNode);
}

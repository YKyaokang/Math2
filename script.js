document.addEventListener('DOMContentLoaded', function() {
    // 获取画布和上下文
    const canvas = document.getElementById('chartArea');
    const ctx = canvas.getContext('2d');
    
    // 获取输入框元素
    const xMinInput = document.getElementById('xMin');
    const xMaxInput = document.getElementById('xMax');
    const yMinInput = document.getElementById('yMin');
    const yMaxInput = document.getElementById('yMax');
    const drawButton = document.getElementById('drawButton');
    
    // 视图状态
    const viewState = {
        scale: 1,           // 缩放比例
        offsetX: 0,         // X轴偏移
        offsetY: 0,         // Y轴偏移
        isDragging: false,  // 是否正在拖动
        lastX: 0,          // 上次鼠标X坐标
        lastY: 0,          // 上次鼠标Y坐标
        gridStep: 1,       // 网格步长
    };

    // 当前函数状态
    const currentState = {
        funcStr: "1*Math.sin(1*x + 0)",  // 默认函数
        xMin: -12,               // 默认X范围
        xMax: 12,
        yMin: -5,               // 默认Y范围
        yMax: 5
    };

    // 函数映射表
    const functionMap = {
        linear: {
            type: 'parametric',
            template: 'k * x + b',
            params: [
                { name: 'k', label: '斜率 k' },
                { name: 'b', label: '截距 b' }
            ],
            defaultValues: { k: 1, b: 0 }
        },
        quadratic: {
            type: 'parametric',
            template: 'a * x * x + b * x + c',
            params: [
                { name: 'a', label: '二次项系数 a' },
                { name: 'b', label: '一次项系数 b' },
                { name: 'c', label: '常数项 c' }
            ],
            defaultValues: { a: 1, b: 0, c: 0 }
        },
        inverse: {
            type: 'parametric',
            template: 'k / x',
            params: [
                { name: 'k', label: '系数 k' }
            ],
            defaultValues: { k: 1 }
        },
        exponential: {
            type: 'parametric',
            template: 'a * Math.exp(k * x)',
            params: [
                { name: 'a', label: '系数 a' },
                { name: 'k', label: '指数系数 k' }
            ],
            defaultValues: { a: 1, k: 1 }
        },
        logarithmic: {
            type: 'parametric',
            template: 'a * Math.log(k * x)',
            params: [
                { name: 'a', label: '系数 a' },
                { name: 'k', label: '底数系数 k' }
            ],
            defaultValues: { a: 1, k: 1 }
        },
        sin: {
            type: 'parametric',
            template: 'a * Math.sin(k * x + b)',
            params: [
                { name: 'a', label: '振幅 a' },
                { name: 'k', label: '频率 k' },
                { name: 'b', label: '相位 b' }
            ],
            defaultValues: { a: 1, k: 1, b: 0 }
        },
        cos: {
            type: 'parametric',
            template: 'a * Math.cos(k * x + b)',
            params: [
                { name: 'a', label: '振幅 a' },
                { name: 'k', label: '频率 k' },
                { name: 'b', label: '相位 b' }
            ],
            defaultValues: { a: 1, k: 1, b: 0 }
        },
        tan: {
            type: 'parametric',
            template: 'a * Math.tan(k * x + b)',
            params: [
                { name: 'a', label: '振幅 a' },
                { name: 'k', label: '频率 k' },
                { name: 'b', label: '相位 b' }
            ],
            defaultValues: { a: 1, k: 1, b: 0 }
        },
        asin: "Math.asin(x)",
        acos: "Math.acos(x)",
        atan: "Math.atan(x)",
        power_x: "x",
        power_x2: "x * x",
        power_x3: "x * x * x",
        power_sqrt_x: "Math.sqrt(x)"
    };

    // 添加函数名称映射表
    const functionNameMap = {
        linear: 'y = kx + b',
        quadratic: 'y = ax² + bx + c',
        inverse: 'y = k/x',
        exponential: 'y = a·e^(kx)',
        logarithmic: 'y = a·ln(kx)',
        sin: 'y = a·sin(kx + b)',
        cos: 'y = a·cos(kx + b)',
        tan: 'y = a·tan(kx + b)',
        asin: 'y = arcsin(x)',
        acos: 'y = arccos(x)',
        atan: 'y = arctan(x)',
        power_x: 'y = x',
        power_x2: 'y = x²',
        power_x3: 'y = x³',
        power_sqrt_x: 'y = √x'
    };

    // 参数输入对话框相关元素
    const paramDialog = document.getElementById('paramDialog');
    const dialogOverlay = document.getElementById('dialogOverlay');
    const dialogTitle = document.getElementById('dialogTitle');
    const paramInputs = document.getElementById('paramInputs');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');

    // 当前选择的函数类型
    let currentFunctionType = null;

    // 显示参数输入对话框
    function showParamDialog(funcType) {
        const func = functionMap[funcType];
        if (!func || func.type !== 'parametric') return;

        currentFunctionType = funcType;
        dialogTitle.textContent = `输入 ${funcType} 函数参数`;
        
        // 清空并创建参数输入框
        paramInputs.innerHTML = '';
        func.params.forEach(param => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'param-input-group';
            
            const label = document.createElement('label');
            label.textContent = param.label;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `param_${param.name}`;
            input.value = func.defaultValues[param.name];
            input.step = 'any';
            
            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            paramInputs.appendChild(inputGroup);
        });

        // 显示对话框
        paramDialog.classList.add('active');
        dialogOverlay.classList.add('active');
    }

    // 隐藏参数输入对话框
    function hideParamDialog() {
        paramDialog.classList.remove('active');
        dialogOverlay.classList.remove('active');
        currentFunctionType = null;
    }

    // 更新函数名称显示
    function updateFunctionName(funcType, params = null) {
        const rangeTitle = document.querySelector('.range-section h3');
        let displayName = functionNameMap[funcType];

        if (params && functionMap[funcType].type === 'parametric') {
            // 替换参数为实际值
            const func = functionMap[funcType];
            let name = displayName;
            func.params.forEach(param => {
                const value = params[param.name];
                name = name.replace(param.name, value);
            });
            displayName = name;
        }

        rangeTitle.textContent = `您选择的函数为${displayName}，请更改范围`;
    }

    // 修改生成函数表达式的函数
    function generateFunctionExpression() {
        if (!currentFunctionType) return null;

        const func = functionMap[currentFunctionType];
        let expression = func.template;
        const params = {};

        // 替换模板中的参数
        for (const param of func.params) {
            const input = document.getElementById(`param_${param.name}`);
            const value = parseFloat(input.value);
            if (isNaN(value)) {
                alert(`请输入有效的${param.label}`);
                return null;
            }
            params[param.name] = value;
            // 使用正则表达式替换所有匹配的参数
            const regex = new RegExp(`\\b${param.name}\\b`, 'g');
            expression = expression.replace(regex, value);
        }

        // 更新函数名称显示
        updateFunctionName(currentFunctionType, params);

        return expression;
    }

    // 修改函数选择事件处理
    document.querySelectorAll('.sub-items li').forEach(li => {
        li.addEventListener('click', () => {
            const funcType = li.dataset.type;
            const func = functionMap[funcType];
            
            if (func && func.type === 'parametric') {
                showParamDialog(funcType);
            } else {
                // 处理不带参数的函数
                currentState.funcStr = func;
                
                // 更新函数名称显示
                updateFunctionName(funcType);
                
                // 设置默认范围
                xMinInput.value = -12;
                xMaxInput.value = 12;
                yMinInput.value = -5;
                yMaxInput.value = 5;
                
                // 自动触发绘制按钮点击事件
                drawButton.click();
            }
        });
    });

    // 确认按钮点击事件
    confirmButton.addEventListener('click', () => {
        const expression = generateFunctionExpression();
        if (expression) {
            currentState.funcStr = expression;
            hideParamDialog();
            
            // 设置默认范围
            xMinInput.value = -12;
            xMaxInput.value = 12;
            yMinInput.value = -5;
            yMaxInput.value = 5;
            
            // 自动触发绘制按钮点击事件
            drawButton.click();
        }
    });

    // 取消按钮点击事件
    cancelButton.addEventListener('click', hideParamDialog);

    // 点击遮罩层关闭对话框
    dialogOverlay.addEventListener('click', hideParamDialog);

    // 调整画布尺寸
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawFunction();
    }

    // 绘制坐标系和网格
    function drawAxes() {
        const width = canvas.width;
        const height = canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 计算缩放后的坐标范围
        const scaledXMin = currentState.xMin / viewState.scale + viewState.offsetX;
        const scaledXMax = currentState.xMax / viewState.scale + viewState.offsetX;
        const scaledYMin = currentState.yMin / viewState.scale + viewState.offsetY;
        const scaledYMax = currentState.yMax / viewState.scale + viewState.offsetY;
        
        // 计算比例
        const xScale = width / (scaledXMax - scaledXMin);
        const yScale = height / (scaledYMax - scaledYMin);
        
        // 原点位置
        const originX = -scaledXMin * xScale;
        const originY = scaledYMax * yScale;

        // 计算网格步长（基于缩放比例）
        const baseStep = 1; // 基础步长为1
        const scaleFactor = Math.pow(10, Math.floor(Math.log10(viewState.scale))); // 以10为单位的缩放因子
        const gridStep = Math.max(1, Math.min(100, baseStep * scaleFactor)); // 限制在1-100之间

        // 绘制网格
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        
        // 绘制X轴网格
        for (let x = Math.ceil(scaledXMin / gridStep) * gridStep; x <= scaledXMax; x += gridStep) {
            const screenX = originX + x * xScale;
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, height);
            ctx.stroke();
            
            // 刻度标签
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(x.toString(), screenX, originY + 15);
        }
        
        // 绘制Y轴网格
        for (let y = Math.ceil(scaledYMin / gridStep) * gridStep; y <= scaledYMax; y += gridStep) {
            const screenY = originY - y * yScale;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(width, screenY);
            ctx.stroke();
            
            // 刻度标签
            if (y !== 0) {
                ctx.textAlign = 'right';
                ctx.fillText(y.toString(), originX - 5, screenY + 4);
            }
        }
        
        // 绘制坐标轴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // X轴
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        // Y轴
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();
        
        // 原点标记
        ctx.textAlign = 'left';
        ctx.fillText('0', originX + 5, originY + 15);
        
        return { originX, originY, xScale, yScale };
    }
    
    // 绘制函数
    function drawFunction() {
        const { originX, originY, xScale, yScale } = drawAxes();
        const width = canvas.width;
        const height = canvas.height;
        
        // 计算缩放后的坐标范围
        const scaledXMin = currentState.xMin / viewState.scale + viewState.offsetX;
        const scaledXMax = currentState.xMax / viewState.scale + viewState.offsetX;
        
        // 创建函数
        let func;
        try {
            func = new Function('x', `return ${currentState.funcStr};`);
        } catch (e) {
            console.error('函数表达式无效:', e.message);
            return;
        }
        
        // 绘制函数图像
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        
        let firstPoint = true;
        const step = (scaledXMax - scaledXMin) / width;
        
        for (let screenX = 0; screenX < width; screenX++) {
            const worldX = scaledXMin + screenX * step;
            try {
                const y = func(worldX);
                if (isFinite(y)) {
                const screenY = originY - y * yScale;
                
                if (firstPoint) {
                    ctx.moveTo(screenX, screenY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(screenX, screenY);
                    }
                } else {
                    firstPoint = true;
                }
            } catch (e) {
                firstPoint = true;
            }
        }
        ctx.stroke();
    }
    
    // 鼠标滚轮事件处理
    function handleMouseWheel(e) {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 计算缩放因子（以10为单位）
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // 更新缩放比例
        viewState.scale *= zoomFactor;
        viewState.scale = Math.max(0.1, Math.min(10, viewState.scale));
        
        // 重新绘制
        drawFunction();
    }

    // 鼠标拖动事件处理
    function handleMouseDown(e) {
        viewState.isDragging = true;
        viewState.lastX = e.clientX;
        viewState.lastY = e.clientY;
    }

    function handleMouseMove(e) {
        if (viewState.isDragging) {
            const deltaX = e.clientX - viewState.lastX;
            const deltaY = e.clientY - viewState.lastY;
            
            // 更新偏移量
            viewState.offsetX += deltaX / (canvas.width / (currentState.xMax - currentState.xMin)) / viewState.scale;
            viewState.offsetY -= deltaY / (canvas.height / (currentState.yMax - currentState.yMin)) / viewState.scale;
            
            viewState.lastX = e.clientX;
            viewState.lastY = e.clientY;
            
            drawFunction();
        }
    }

    function handleMouseUp() {
        viewState.isDragging = false;
    }

    // 绘制按钮点击事件
    drawButton.addEventListener('click', () => {
        const xMin = parseFloat(xMinInput.value);
        const xMax = parseFloat(xMaxInput.value);
        const yMin = parseFloat(yMinInput.value);
        const yMax = parseFloat(yMaxInput.value);

        if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax)) {
            alert('请输入有效的范围值');
            return;
        }
        if (xMin >= xMax || yMin >= yMax) {
            alert('最小值必须小于最大值');
            return;
        }
        
        currentState.xMin = xMin;
        currentState.xMax = xMax;
        currentState.yMin = yMin;
        currentState.yMax = yMax;
        
        // 重置视图状态
        viewState.scale = 1;
        viewState.offsetX = 0;
        viewState.offsetY = 0;
        
        drawFunction();
    });

    // 事件监听器
    canvas.addEventListener('mouseenter', () => {
        canvas.style.cursor = 'move';
    });

    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
        viewState.isDragging = false;
    });

    canvas.addEventListener('wheel', handleMouseWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', resizeCanvas);

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        // 设置默认函数
        currentState.funcStr = "1*Math.sin(1*x + 0)";
        
        // 设置默认范围
        currentState.xMin = -12;
        currentState.xMax = 12;
        currentState.yMin = -5;
        currentState.yMax = 5;
        
        // 更新输入框值
        xMinInput.value = -12;
        xMaxInput.value = 12;
        yMinInput.value = -5;
        yMaxInput.value = 5;

        // 重置视图状态
        viewState.scale = 1;
        viewState.offsetX = 0;
        viewState.offsetY = 0;

        // 找到正弦函数选项并模拟点击
        const sinFunction = document.querySelector('.sub-items li[data-type="sin"]');
        if (sinFunction) {
            sinFunction.click();
        } else {
            // 如果找不到正弦函数选项，直接触发绘制按钮
            drawButton.click();
        }
    });

    // 调整画布尺寸
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawFunction();
    }

    // 绘制坐标系和网格
    function drawAxes() {
    const width = canvas.width;
    const height = canvas.height;
    
        // 清空画布
    ctx.clearRect(0, 0, width, height);
        
        // 计算缩放后的坐标范围
        const scaledXMin = currentState.xMin / viewState.scale + viewState.offsetX;
        const scaledXMax = currentState.xMax / viewState.scale + viewState.offsetX;
        const scaledYMin = currentState.yMin / viewState.scale + viewState.offsetY;
        const scaledYMax = currentState.yMax / viewState.scale + viewState.offsetY;
    
    // 计算比例
        const xScale = width / (scaledXMax - scaledXMin);
        const yScale = height / (scaledYMax - scaledYMin);
    
    // 原点位置
        const originX = -scaledXMin * xScale;
        const originY = scaledYMax * yScale;

        // 计算网格步长（基于缩放比例）
        const baseStep = 1; // 基础步长为1
        const scaleFactor = Math.pow(10, Math.floor(Math.log10(viewState.scale))); // 以10为单位的缩放因子
        const gridStep = Math.max(1, Math.min(100, baseStep * scaleFactor)); // 限制在1-100之间

        // 绘制网格
        ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    
        // 绘制X轴网格
        for (let x = Math.ceil(scaledXMin / gridStep) * gridStep; x <= scaledXMax; x += gridStep) {
        const screenX = originX + x * xScale;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
        ctx.stroke();
        
            // 刻度标签
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(x.toString(), screenX, originY + 15);
    }
    
        // 绘制Y轴网格
        for (let y = Math.ceil(scaledYMin / gridStep) * gridStep; y <= scaledYMax; y += gridStep) {
        const screenY = originY - y * yScale;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
        ctx.stroke();
        
        // 刻度标签
            if (y !== 0) {
                ctx.textAlign = 'right';
                ctx.fillText(y.toString(), originX - 5, screenY + 4);
            }
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
        ctx.beginPath();
    // X轴
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    // Y轴
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();
    
    // 原点标记
        ctx.textAlign = 'left';
    ctx.fillText('0', originX + 5, originY + 15);
    
    return { originX, originY, xScale, yScale };
}

// 绘制函数
    function drawFunction() {
        const { originX, originY, xScale, yScale } = drawAxes();
    const width = canvas.width;
        const height = canvas.height;
        
        // 计算缩放后的坐标范围
        const scaledXMin = currentState.xMin / viewState.scale + viewState.offsetX;
        const scaledXMax = currentState.xMax / viewState.scale + viewState.offsetX;
    
    // 创建函数
    let func;
    try {
            func = new Function('x', `return ${currentState.funcStr};`);
    } catch (e) {
            console.error('函数表达式无效:', e.message);
        return;
    }
    
        // 绘制函数图像
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    
    let firstPoint = true;
        const step = (scaledXMax - scaledXMin) / width;
        
        for (let screenX = 0; screenX < width; screenX++) {
            const worldX = scaledXMin + screenX * step;
            try {
                const y = func(worldX);
                if (isFinite(y)) {
            const screenY = originY - y * yScale;
            
            if (firstPoint) {
                ctx.moveTo(screenX, screenY);
                firstPoint = false;
            } else {
                ctx.lineTo(screenX, screenY);
                    }
                } else {
                    firstPoint = true;
            }
        } catch (e) {
            firstPoint = true;
        }
    }
    ctx.stroke();
}

    // 鼠标滚轮事件处理
    function handleMouseWheel(e) {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 计算缩放因子（以10为单位）
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // 更新缩放比例
        viewState.scale *= zoomFactor;
        viewState.scale = Math.max(0.1, Math.min(10, viewState.scale));
        
        // 重新绘制
        drawFunction();
    }

    // 鼠标拖动事件处理
    function handleMouseDown(e) {
        viewState.isDragging = true;
        viewState.lastX = e.clientX;
        viewState.lastY = e.clientY;
    }

    function handleMouseMove(e) {
        if (viewState.isDragging) {
            const deltaX = e.clientX - viewState.lastX;
            const deltaY = e.clientY - viewState.lastY;
            
            // 更新偏移量
            viewState.offsetX += deltaX / (canvas.width / (currentState.xMax - currentState.xMin)) / viewState.scale;
            viewState.offsetY -= deltaY / (canvas.height / (currentState.yMax - currentState.yMin)) / viewState.scale;
            
            viewState.lastX = e.clientX;
            viewState.lastY = e.clientY;
            
            drawFunction();
        }
    }

    function handleMouseUp() {
        viewState.isDragging = false;
    }

    // 绘制按钮点击事件
    drawButton.addEventListener('click', () => {
        const xMin = parseFloat(xMinInput.value);
        const xMax = parseFloat(xMaxInput.value);
        const yMin = parseFloat(yMinInput.value);
        const yMax = parseFloat(yMaxInput.value);
        
        if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax)) {
            alert('请输入有效的范围值');
            return;
        }
        if (xMin >= xMax || yMin >= yMax) {
            alert('最小值必须小于最大值');
            return;
        }
        
        currentState.xMin = xMin;
        currentState.xMax = xMax;
        currentState.yMin = yMin;
        currentState.yMax = yMax;
        
        // 重置视图状态
        viewState.scale = 1;
        viewState.offsetX = 0;
        viewState.offsetY = 0;
        
        drawFunction();
    });

    // 事件监听器
    canvas.addEventListener('mouseenter', () => {
        canvas.style.cursor = 'move';
    });

    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
        viewState.isDragging = false;
    });

    canvas.addEventListener('wheel', handleMouseWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', resizeCanvas);

    // 初始化
    resizeCanvas();
    drawFunction();
});

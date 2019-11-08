window.onload = function () {
    // 执行一次，值增加一次
    var func = (function(){
        var val = 0;
        return function(){
            val++;
            console.log(val)
        }
    })();

    func();  // 1
    func();  // 2
    func();  // 3

    // 函数节流
    var throttle = function (fn, interval) {
        var _self = fn,  // 保存需要被延迟执行的函数引用
            timer,   // 定时器
            firstTime = true;  // 是否是第一次调用

        return function () {
            var args = arguments,
                _me = this;

            if (firstTime) {  // 如果是第一次调用，不需要延迟执行
                _self.apply(_me, args);
                return firstTime = false;
            }

            if (timer) {  // 如果定时器还在，说明前一次延迟执行还没有完成
                return false;
            }

            timer = setTimeout(function () {
                clearTimeout(timer);
                timer = null;
                _self.apply(_me, args);
            }, interval || 500);
        }
    }

    window.onresize = throttle(function () {
        console.log(1);
    }, 500)

    // 分时函数
    // 1秒钟创建1000个节点，改为每隔200毫秒创建8个节点
    var timeChunk = function (arr, fn, count) {
        var obj,
            t;

        var len = arr.length;

        var start = function () {
            for (var i = 0; i < Math.min(count || 1, arr.length); i++) {
                var obj = arr.shift();
                fn(obj);
            }
        }

        return function () {
            t = setInterval(function () {
                if (arr.lenght === 0) {  // 如果全部节点都已经被创建好
                    return clearInterval(t)
                }
                start();
            }, 200)  // 分批执行的时间间隔，也可以用参数的形式传入
        }
    }

    var arr = [];
    for (var i = 0; i < 1000; i++) {
        arr.push(i);
    }

    var renderFriendList = timeChunk(arr, function (n) {
        var div = document.createElement('div');
        div.innerHTML = n;
        document.body.appendChild(div);
    }, 8)

    // renderFriendList();


    // 文本输入框对应多种校验规则

    // 策略对象
    var strategies = {
        isNonEmpty: function (value, errorMsg) {
            if (value === '') {
                return errorMsg;
            }
        },
        minLength: function (value, length, errorMsg) {
            if (value.length < length) {
                return errorMsg;
            }
        },
        isMobile: function (value, errorMsg) {
            if (!/^1[3|5|8][0-9]{9}$/.test(value)) {
                return errorMsg;
            }
        }
    }

    // Validator类
    var Validator = function () {
        this.cache = [];
    }

    Validator.prototype.add = function (dom, rules) {
        var self = this;
        for (var i = 0, rule; rule = rules[i++];) {
            (function (rule) {
                var strategyAry = rule.strategy.split(':');
                var errorMsg = rule.errorMsg;

                self.cache.push(function () {
                    var strategy = strategyAry.shift();
                    strategyAry.unshift(dom.value);
                    strategyAry.push(errorMsg);
                    return strategies[strategy].apply(dom, strategyAry);
                })
            })(rule)
        };
    };

    Validator.prototype.start = function () {
        for (var i = 0, validatorFunc; validatorFunc = this.cache[i++];) {
            var errorMsg = validatorFunc();
            if (errorMsg) {
                return errorMsg;
            }
        }
    }

    // 客户调用代码
    var registerForm = document.getElementById('registerForm');

    var validataFunc = function () {
        var validator = new Validator();

        validator.add(registerForm.userName, [
            { strategy: 'isNonEmpty', errorMsg: '用户名不能为空' },
            { strategy: 'minLength:10', errorMsg: '用户名长度不能小于10' }
        ]);

        validator.add(registerForm.password, [
            { strategy: 'minLength:6', errorMsg: '密码长度不能小于6位' }
        ])

        validator.add(registerForm.phoneNumber, [
            { strategy: 'isMobile', errorMsg: '手机号码格式不正确' }
        ])

        var errorMsg = validator.start();
        return errorMsg;
    }

    registerForm.onsubmit = function () {

        var errorMsg = validataFunc();

        if (errorMsg) {
            alert(errorMsg);
            return false;
        }

        alert('验证通过');
    }

    // 职责链模式

    // 普通书写方式
    var order = function(orderType,pay,stock){
        if(orderType === 1 && pay === true){
            console.log('500元定金预购，得到100优惠券');
        }else if(orderType === 2 && pay === true){
            console.log('200元定金预购，得到50优惠券');
        }else if(stock > 0){
            console.log('普通购买，无优惠券');
        }else{
            console.log('库存不足');
        }
    }

    order(1,true,500);
    order(1,false,500);
    order(2,true,500);
    order(3,false,500);
    order(3,true,0);

    // 高级方式
    var order500 = function(orderType,pay,stock){
        if(orderType === 1 && pay === true){
            console.log('500元定金预购，得到100优惠券');
        }else{
            return 'nextSuccessor'
        }
    }

    var order200 = function(orderType,pay,stock){
        if(orderType === 2 && pay === true){
            console.log('200元定金预购，得到50优惠券');
        }else{
            return 'nextSuccessor'
        }
    }

    var orderNormal = function(orderType,pay,stock){
        if(stock > 0){
            console.log('普通购买，无优惠券');
        }else{
            console.log('库存不足');
        }
    }

    // 构造函数Chain
    var Chain = function(fn){
        this.fn = fn;
        this.successor = null;
    }

    Chain.prototype.setNextSuccessor = function(successor){
        this.successor = successor;
    }

    Chain.prototype.passRequest = function () {
        var ret = this.fn.apply(this, arguments);
        if (ret === 'nextSuccessor') {
            return this.successor && this.successor.passRequest.apply(this.successor, arguments);
        }
        return ret;
    }

    var chainOrder500 = new Chain(order500);
    var chainOrder200 = new Chain(order200);
    var chainOrderNormal = new Chain(orderNormal);

    chainOrder500.setNextSuccessor(chainOrder200);
    chainOrder200.setNextSuccessor(chainOrderNormal);

    console.log('****************');
    chainOrder500.passRequest(1,true,500);
    chainOrder500.passRequest(1,false,500);
    chainOrder500.passRequest(2,true,500);
    chainOrder500.passRequest(3,true,500);
    chainOrder500.passRequest(1,false,0);


    // *********************AOP装饰函数
    // 将一个对象嵌入另一个对象之中，实际上相当于这个对象被另一个对象包装起来，形成一条包装链，请求随着这条链依次递到所有的对象
    console.log('**************');
    this.Function.prototype.after = function(afterFn){
        var _self = this;
        return function(){
            var ret = _self.apply(this,arguments);
            afterFn.apply(this,arguments);
            console.log('ret',ret);
            return ret;
        }
    }

    var showLogin = function(){
        console.log('打开登录浮层');
    }

    var log = function(){
        console.log('上报标签为:'+this.getAttribute('tag'));
    }

    showLogin = showLogin.after(log);

    document.getElementById('button').onclick = showLogin;

}
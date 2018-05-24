// cTask任务处理
    // 调用示例
    // cTask
    //     .timeout(10000)
    //     .extra(0)
    //     .init([
    //         function(){
    //             console.log("first task")
    //         },
    //         "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_1.jpg",
    //         "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_2.jpg",
    //         "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_3.jpg",
    //         {
    //             type: "image",
    //             src: "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_4.jpg"
    //         },
    //         {
    //             type: "script",
    //             src: "http://apps.bdimg.com/libs/jquery/2.1.4/jquery.js"
    //         },
    //         function(){
    //             console.log("last task")
    //         }
    //     ])
    //     .then(function(percent){
    //         console.log("then " + percent);
    //         var p = 50 * (1 - percent);
    //         progress.style.transform = progress.style["-webkit-transform"] = "translateY(" + p + "%)";
    //     })
    //     .catch(function(taskNo){ // script任务执行失败时会触发
    //         console.log("任务 " + taskNo + " 执行失败");
    //         var txt = document.querySelector(".ct_loading_text");
    //         txt.innerHTML = "加载失败，点击重试";
    //         txt.onclick = function(){location.reload()};
    //     })
    //     .finish(function(error){
    //         console.log("finish " + error);
    //         setTimeout(function(){
    //             loading.style.display = "none";
    //         }, 300);
    //         Page.initEvent();
    //     });
    // cTask.done().then(function(){})
;(function(){
    window.cTask = (function(){
        var _ = {},
            _done = [],
            _then = [],
            _finish = [],
            _error = [],
            _isError = 0,
            _timer = 0,
            _timeout = 0,
            _extraIndex = 0,
            _extraCount = 0,
            _exec = function(funcList, data, once){
                if (_.isFunction(funcList)) {
                    funcList = [funcList];
                }
                if (_.isArray(funcList)) {
                    funcList.forEach(function(func) {
                        if (_.isFunction(func)) {
                            func(data);
                        }
                    });
                    if (once) {
                        funcList.length = 0;
                    }
                }
            };

        Array.prototype.forEach.call(["Function", "String", "Array", "Object"], function(t, i) {
            _["is" + t] = function(obj) {
                return Object.prototype.toString.call(obj) === "[object " + t + "]";
            };
        });

        return {
            progress: 0, // 当前进度
            count: 0, // 任务总数
            status: [], // 任务状态，1前置任务都已完成，2当前任务已完成，3当前任务和前置任务都已完成

            /**
             * 设置超时时间，在init触发前设置才能生效，init触发后将其设置为0可以取消超时设置
             * @param {Number} milliseconds 毫秒数
             */
            timeout: function(milliseconds){
                if (milliseconds >= 0) {
                    _timeout = milliseconds;
                }
                return this;
            },

            /**
             * 设置额外的任务数，不包括在init(taskList)中，参数值为n时需要手动触发n次 cTask.done() 方法
             * @param {Number} extraTaskCount 额外的任务数
             */
            extra: function(extraTaskCount){
                _extraCount = extraTaskCount > 0 ? parseInt(extraTaskCount) : 0;
                return this;
            },

            /**
             * 手动触发error事件绑定的方法，一般用于extraTaskCount任务失败时调用
             */
            error: function(params) {
                _exec(_error, params);
            },

            /**
             * 标记某个任务已经完成
             * @param {Number} taskNo 已经完成的任务序号，不传该参数时则触发extraTaskCount任务
             */
            done: function(taskNo){
                var ct = this,
                    index = parseInt(taskNo);

                if (index >= 0) { // 触发的是 taskList 中的任务
                    index += _extraCount;
                } else if (_extraIndex < _extraCount) { // 触发的是 extraTaskCount 中的任务
                    index = _extraIndex++;
                }

                if (index >= 0) {
                    // 判断是否存在未完成的前置任务
                    var isPreDone = index > 0 && ct.status[index - 1] != 3 ? 0 : 1;

                    var needUpdateView = (ct.status[index] | 1) !== 3; // 标记是否需要更新展示
                    ct.status[index] = isPreDone ? 3 : 2;

                    // 执行在then中缓存的回调函数
                    if (isPreDone) {
                        _exec(_done[index], null, 1);
                    }

                    // 如果当前任务还未标记过已完成，就去更新进度条展示
                    if (needUpdateView) {
                        ct.progress++;
                        var percent = ct.count > 0 ? ct.progress / ct.count : 1;
                        _exec(_then, percent, percent >= 1);
                    }

                    if ((index >= ct.count - 1) && isPreDone) { // 进度完成时执行_finish
                        _timer && clearTimeout(_timer);
                        _timer = null;
                        setTimeout(function(){
                            _exec(_finish, null, 1);
                        }, 0);
                    } else if (isPreDone) { // 检测是否需要执行下一个任务
                        // 标记下一个任务的前置任务已经完成
                        ct.status[index + 1] |= 1;

                        // 如果下一个任务已完成，就传递done命令
                        if (ct.status[index + 1] & 2) {
                            ct.done(index + 1 - _extraCount);
                        }
                    }
                }

                return {
                    // then中指定的操作会在所有前置任务都完成后执行
                    then: function(func){
                        if (_.isFunction(func)) {
                            if (index >= 0 && ct.status[index] != 3) {
                                if (!_.isArray(_done[index])) {
                                    _done[index] = [];
                                }
                                _done[index].push(func);
                            } else {
                                _exec(func);
                            }
                        }
                        return this;
                    }
                }
            },

            /**
             * 初始化
             * @param {Array} taskList 要执行的任务数组
             */
            init: function(taskList) {
                var ct = this;

                if (!_.isArray(taskList)) {
                    taskList = [];
                }

                ct.status.length = 0;
                ct.count = _extraCount + taskList.length;

                if (ct.count == 0) {
                    ct.done();
                } else {
                    // 错误处理
                    _error = [function() {
                        _isError = 1;
                        _timeout = 0;
                    }];

                    // 处理任务列表
                    taskList.forEach(function(item, index){
                        var isObj = _.isObject(item) && item.src;
                        if (_.isString(item) || (isObj && item.type == "image")) { // 图片
                            var elem = new Image();
                            elem.onload = elem.onerror = elem.onabort = function(){
                                elem = null;
                                ct.done(index);
                            };
                            elem.src = isObj ? item.src : item;
                        } else if (isObj && item.type == "script") { // 外链js，加载失败时会触发error
                            var elem = document.createElement("script");
                            elem.onload = elem.onerror = elem.onabort = function(e){
                                elem = null;
                                if (e.type === "load") {
                                    ct.done(index);
                                } else {
                                    ct.error(index);
                                }
                            };
                            elem.src = item.src;
                            document.body.appendChild(elem);
                        } else if (_.isFunction(item)) { // 方法
                            setTimeout(function(){
                                ct.done(index).then(item);
                            }, 0);
                        } else { // 无效任务
                            ct.done(index);
                        }
                    });

                    // 超时处理
                    if (_timeout > 0) {
                        _timer = setTimeout(function() {
                            if (_timeout > 0) {
                                ct.progress = ct.count;
                                _exec(_then, 1, 1);
                                _exec(_finish, "timeout", 1);
                            }
                        }, _timeout);
                    }
                }

                return {
                    /**
                     * then中指定的操作会在每个任务完成后都触发一次，可以在这里做进度条更新
                     * @param {} func
                     */
                    then: function(func){
                        if (_.isFunction(func)) {
                            if (ct.progress >= ct.count) {
                                _exec(func);
                            } else {
                                _then.push(func);
                            }
                        }
                        return this;
                    },
                    /**
                     * finish中指定的操作会在所有任务完成后执行
                     * @param {} func
                     */
                    finish: function(func){
                        if (_.isFunction(func)) {
                            if (ct.progress >= ct.count) {
                                _exec(func);
                            } else {
                                _finish.push(func);
                            }
                        }
                        return this;
                    },
                    /**
                     * catch中指定的操作会在error事件中执行
                     * @param {} func
                     */
                    catch: function(func){
                        if (_.isFunction(func)) {
                            if (ct.progress >= ct.count) {
                                _exec(func);
                            } else {
                                _error.push(func);
                            }
                        }
                        return this;
                    }
                }
            }
        };
    })();
})();
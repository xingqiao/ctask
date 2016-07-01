# cTask任务处理

支持执行方法、加载图片及外链js
可以用来实现预加载、并行处理等逻辑

demo: http://y.qq.com/m/demo/ctools/ctask.html

##调用示例
```javascript
cTask
    .timeout(10000)
    .extra(1)
    .init([
        function(){
            console.log("first task")
        },
        "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_1.jpg",
        "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_2.jpg",
        "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_3.jpg",
        {
            type: "image",
            src: "http://imgcache.gtimg.cn/mediastyle/mobile/event/20150615_fatherday_card/img/template_pic_4.jpg"
        },
        {
            type: "script",
            src: "http://imgcache.gtimg.cn/music/h5/lib/js/zepto-1.0.min.js?_bid=299&max_age=2592000"
        },
        {
            type: "script",
            src: "http://imgcache.gtimg.cn/music/h5/lib/js/music-1.0.min.js?_bid=299&max_age=2592000&ver=20160516"
        },
        function(){
            console.log("last task")
        }
    ])
    .then(function(percent){
        console.log("then " + percent);
        var p = 50 * (1 - percent);
        progress.style.transform = progress.style["-webkit-transform"] = "translateY(" + p + "%)";
    })
    .finish(function(error){
        console.log("finish " + error);
        setTimeout(function(){
            loading.style.display = "none";
        }, 300);
        Page.initEvent();
    });
```

##手动触发done
用来完成extra指定的任务<br>
如果设置了extra(n)，就需要调用n次cTask.done()<br>
当页面上已经有了外链js时，可以用这种方式将其加入到任务中来
```javascript
cTask.done().then(function(){})
```

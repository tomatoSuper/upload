/**
 * Created by DELL on 2017/6/24.
 */
window.UploadImage=function (uploadBox,options,initImagePath) {
    var self=this;
    this.uploadImageUrl=options.host+options.path;
    this.uploadBox=$(uploadBox);
    var uploadType=options.uploadType || "single";
    this.photoPathList=[];
    this.photoList=[];
    // this.localImagesList=[];
    this.client = navigator.userAgent;
    this.isAndroid = self.client.indexOf('Android') > -1 || self.client.indexOf('Adr') > -1; //android终端
    this.isiOS = !!self.client.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    this.maxsize = 100 * 1024;
    this.maxFiles=options.maxFiles;
    this.compressWidth=900;
    this.canvas=document.createElement("canvas");
    this.ctx=this.canvas.getContext('2d');
    this.orientation=0;
    // this.uploadInput=this.uploadBox.find("input[type='file']");
    this.imgBox=this.uploadBox.find(".img-box");
    !!initImagePath?this.init(initImagePath):null;
    if(uploadType==="single"){
        this.coverMask=this.uploadBox.find(".cover");
        this.uploadNotice=this.uploadBox.find(".upload-notice");
        this.delImage=this.uploadBox.find(".del-img");
        // !!initImagePath?this.init(initImagePath):null;
        this.delImage.off("click").on("click",function () {
            var $inputFile=!!self.isiOS? $('<input type="file" accept="image/*" multiple>') : $('<input type="file" accept="image/*">');
            self.uploadNotice.removeClass("success").html("<span>删除成功</span>").show().delay(1000).hide(0);
            self.imgBox.html("");
            self.delImage.parent().hide();
            self.uploadBox.append($inputFile);
            !!options.deleteImage && $.isFunction(options.deleteImage) && options.deleteImage();
            return $inputFile.click();
        });
    }else if(uploadType==="more"){
        this.uploadArea=$(".upload-area");
        this.inputFile=this.uploadArea.find("input");
        this.uploadNotice=this.uploadArea.find(".upload-notice");
        this.imgBox.off("click",".del-img").on("click",".del-img",function (e) {
            var $this=$(this);
            var lis=self.imgBox.children("li");
            var selfLi=$this.parent().parent();
            var selfMark=selfLi.attr("data-mark");
            selfLi.remove();
            self.uploadArea.show();
            for(var i=0;i<self.photoPathList.length;i++){
                if(self.photoPathList[i].mark===selfMark){
                    self.photoPathList.splice(i,1);
                    self.photoList.splice(i,1);
                    console.log(self.photoList)
                    !!options.deleteImage && $.isFunction(options.deleteImage) && options.deleteImage(self.photoList);
                }
            }
        });
    }

    this.uploadBox.off("change").on("change","input[type='file']",function (ev) {
            var $this=$(this);
            var selfFiles=this.files;
            if(selfFiles && selfFiles.length>0){
                if(uploadType==="single"){
                    self.uploadNotice.html("<span>图片读取中...</span>").show();
                    var reader=new FileReader();
                    reader.readAsDataURL(selfFiles[0]);
                    reader.onload=function () {
                        var result = this.result;
                        if(result.length<self.maxsize){
                            self.localImageLoaded(result);
                            self.uploadImage(result,options,function (data) {
                                $this.remove();
                                self.delImage.parent().show();
                            });
                            return;
                        }
                        var img = new Image();
                        img.src = result;
                        img.onload=function () {
                            self.coverMask.show();
                            $this.remove();
                            var r=EXIF.getData(img, function() {
                                    self.orientation = EXIF.getTag(this, 'Orientation');
                                });
                            var newBase64=self.compressImage(img,self.compressWidth);
                            self.localImageLoaded(newBase64);
                            self.uploadImage(newBase64,options,function () {
                                $this.remove();
                                self.delImage.parent().show();
                            });
                        };
                    };
                }else{
                    //多图上传

                    var currentCount=self.imgBox.children("li").length;
                    var maxFiles=self.maxFiles;

                    if(currentCount>maxFiles){
                        self.uploadNotice.html("上传图片已超过"+maxFiles+"张，无法上传").show().delay(1000).hide(0);
                        return;
                    }else if(selfFiles.length+currentCount >maxFiles){
                        self.uploadNotice.html("上传图片已超过"+maxFiles+"张，无法上传").show().delay(1000).hide(0);
                        return;
                    }else if(currentCount== maxFiles || selfFiles.length+currentCount == maxFiles){
                        self.uploadArea.hide();
                    }
                    $.each(selfFiles,function (idx, ele) {
                        var everyMark=new Date().getTime()+"m"+idx;
                        var reader=new FileReader();
                        reader.readAsDataURL(ele);
                        reader.onload=function () {
                            var result = this.result;
                            var $li=$("<li data-mark='"+everyMark+"'>");
                            var $everyNotice=$('<span class="notice">图片处理中...</span>');
                            var $everyMask=$('<p class="cover">');
                            var $everyDelImg=$('<p class="del-msk"><i class="del-img"></i></p>');
                            if(result.length<self.maxsize){
                                $li.append('<img src="'+result+'">');
                                $li.append($everyDelImg);
                                $li.append($everyMask);
                                $li.append($everyNotice);
                                self.imgBox.prepend($li);
                                self.uploadMoreImages(result,options,function (filePath) {
                                    self.photoPathList.push({mark:everyMark,path:filePath});
                                    self.photoList.push(filePath);
                                    // $this.remove();
                                    $everyDelImg.show();
                                },$li,$everyNotice,$everyMask,$everyDelImg);
                            }else {
                                var img = new Image();
                                img.src = result;
                                img.onload=function () {
                                    var r=EXIF.getData(img, function() {
                                        self.orientation = EXIF.getTag(this, 'Orientation');
                                    });
                                    var newBase64=self.compressImage(img,self.compressWidth);
                                    $li.append('<img src="'+newBase64+'">');
                                    $li.append($everyDelImg);
                                    $li.append($everyMask);
                                    $li.append($everyNotice);
                                    self.imgBox.prepend($li);
                                    self.uploadMoreImages(newBase64,options,function (filePath) {
                                        self.photoPathList.push({mark:everyMark,path:filePath});
                                        self.photoList.push(filePath);
                                        // $this.remove();
                                        $everyDelImg.show();
                                    },$li,$everyNotice,$everyMask,$everyDelImg);
                                };
                            }

                        };
                    });
                    $this.remove();
                    self.uploadArea.append(!!self.isiOS?'<input type="file" accept="image/*" multiple>':'<input type="file" accept="image/*">');
                }
            }


        });
};
UploadImage.prototype={
    uploadMoreImages:function (base64,options,callback,li,notice,cover,delImage) {
        var self=this;
        var sendData={
            fileName:""+options.fileName+"_"+new Date().getTime(),
            folder:options.folder,
            id:options.agentId,
            uploadData:base64,
            token:options.token?options.token:""
        };
        // $.ajax({
        //     url:self.uploadImageUrl,
        //     data:sendData,
        //     type: "POST",
        //     contentType: "application/x-www-form-urlencoded;charset=utf-8",
        //     dataType:"json",
        //     beforeSend:function(){
        //         notice.removeClass("success").html("图片上传中...").show();
        //     },
        //     success:function(data){
        //         if(typeof data==="string"){
        //             data=JSON.parse(data);
        //         }
        //         cover.hide();
        //         if(data.code==0){
        //             var filePath = data.res.data.filePath;
        //             !!callback && $.isFunction(callback) && callback(filePath);
        //
        //             notice.addClass("trans").addClass("success").html("上传成功").show().delay(800).hide(0);
        //             !!options.uploadSuccess && $.isFunction(options.uploadSuccess) && options.uploadSuccess(filePath,self.photoList);
        //         }else{
        //             if(data.code==101 ||data.code==102){
        //                 alert("用户权限已过期,请重新登录");
        //                 window.location.href='login.html';
        //             }
        //             li.css({backgroundImage:'url("./img/bg-uploadFail-small-b0fe565aab.png")'}).find("img").remove();
        //             notice.removeClass("success").html("上传失败，<br/>"+data.res.msg+"").show().delay(1000).hide(0);
        //             !!options.uploadFail && $.isFunction(options.uploadFail) && options.uploadFail(data);
        //         }
        //     },
        //     timeout:10000,
        //     error: function (XMLHttpRequest, textStatus, errorThrown) {
        //         notice.removeClass("success").html("网络不畅，请重新上传").show().delay(1000).hide(0);
        //     }
        // });
    },
    uploadImage:function (base64,options,callback) {
        var self=this;
        var sendData={
            fileName:"PC_"+options.fileName+"_"+new Date().getTime(),
            folder:options.folder,
            agentId:options.agentId,
            uploadData:base64,
            token:options.token?options.token:""
        };
        // $.ajax
        // ({
        //     url:self.uploadImageUrl,
        //     data:sendData,
        //     type: "POST",
        //     contentType: "application/x-www-form-urlencoded;charset=utf-8",
        //     dataType:"json",
        //     beforeSend:function(){
        //         self.uploadNotice.removeClass("success").html("<span>图片上传中...</span>").show();
        //     },
        //     success:function(data){
        //         if(typeof data==="string"){
        //             data=JSON.parse(data);
        //         }
        //         self.coverMask.hide();
        //         self.delImage.show();
        //         if(data.code==0){
        //             var filePath = data.res.data.filePath;
        //             !!callback && $.isFunction(callback) && callback();
        //             self.uploadNotice.addClass("trans").addClass("success").html("<span>上传成功</span>").show().delay(800).hide(0);
        //             !!options.uploadSuccess && $.isFunction(options.uploadSuccess) && options.uploadSuccess(filePath);
        //         }else{
        //             if(data.code==101 ||data.code==102){
        //                 alert("用户权限已过期,请重新登录");
        //                 window.location.href='login.html';
        //             }
        //             self.uploadNotice.removeClass("success").html("<span>上传失败，"+data.res.msg+"</span>").show().delay(800).hide(0);
        //             self.imgBox.find("img").remove();
        //             self.uploadBox.append(!!self.isiOS?'<input type="file" accept="image/*" multiple>':'<input type="file" accept="image/*">');
        //             !!options.uploadFail && $.isFunction(options.uploadFail) && options.uploadFail(data);
        //         }
        //     },
        //     timeout:10000,
        //     error: function (XMLHttpRequest, textStatus, errorThrown) {
        //         self.uploadNotice.removeClass("success").html("<span>网络不畅，请重新上传</span>").show().delay(1000).hide(0);
        //         self.imgBox.find("img").remove();
        //         self.uploadBox.append(!!self.isiOS?'<input type="file" accept="image/*" multiple>':'<input type="file" accept="image/*">');
        //         self.uploadBox.css({backgroundImage:'url("../img/bg-uploadFail-large-c9ac2f0362.png")'});
        //     }
        // });
    },
    init:function (initImagePath) {
        var self=this;
        // self.delImage.show();
        // self.imgBox.html('<img src="'+common.globalHost+initImagePath+'" />').show();
        var imageArr=initImagePath.split(',');
        var len=imageArr.length;
        var imageHost= self.host;
        var arrTemp=[];
        $.each(imageArr,function(idx,ele){
            var tempDOM='<li data-mark="'+ele.split("_")[2]+'">'+
                            '<img src="'+imageHost+ele+'" alt="" />'+
                            '<p class="del-msk"><i class="del-img"></i></p>'+
                            '<p class="cover" style="display:none;"></p>'+
                            '<span class="notice trans success" style="display:none"></span>'+
                        '</li>';
            self.photoList.push(ele);
            self.photoPathList.push({'mark':ele.split("_")[2],'path':ele});
            arrTemp.push(tempDOM);
        });
        self.imgBox.prepend(arrTemp.join("")).show();
    },
    localImageLoaded:function (base64) {
        var self=this;
        self.imgBox.html('<img src="'+base64+'" />').show();
        // self.coverMask.show();
    },
    loadingLocalImages:function (base64,everyTime) {
        var self=this;
        self.imgBox.append("<li data-time='"+everyTime+"'><i class='del-img'></i><img src='"+base64+"' alt=''></li>")
    },
    compressImage:function (img,compressWidth) {
        var self=this;
        var imgWidth=img.naturalWidth;
        var imgHeight=img.naturalHeight;
        var scale=imgWidth/imgHeight;
        var ctxImgHeight;
        // alert(self.orientation);
        function denominateFileName (scale, arr) {
            if (!scale) {
                alert('请传入比例值');
                return false
            }
            var flag = arr instanceof Array
            if (!flag) {
                alert('参数格式错误');
                return false
            }
//        根据图片的比例和翻转信息决定图片的胖瘦命名
            if (scale > 1) {
                this.sendData.fileName = arr[0] + '_H5_report_' + new Date().getTime()
            } else if (scale < 1) {
                this.sendData.fileName = arr[1] + '_H5_report_' + new Date().getTime()
            } else {
                // 正常的图片
                this.sendData.fileName = 'normal_H5_report_' + new Date().getTime()
            }
        }

        if(self.orientation==8){
            ctxImgHeight= compressWidth * scale;
            self.canvas.width=compressWidth;
            self.canvas.height=ctxImgHeight;
            self.ctx.clearRect(0, 0, ctxImgHeight , compressWidth);
            self.ctx.fillStyle = "#fff";
            self.ctx.fillRect(0, 0, ctxImgHeight,compressWidth);
            self.ctx.rotate(270 * Math.PI/180);
            self.ctx.drawImage(img,0,0,-ctxImgHeight,compressWidth);

        }else if(self.orientation==6){
            ctxImgHeight= compressWidth * scale;
            self.canvas.width=compressWidth;
            self.canvas.height=ctxImgHeight;
            self.ctx.clearRect(0, 0, ctxImgHeight , compressWidth);
            self.ctx.fillStyle = "#fff";
            self.ctx.fillRect(0, 0, ctxImgHeight,compressWidth);
            self.ctx.rotate(90 * Math.PI/180);
            self.ctx.drawImage(img,0,0,ctxImgHeight,-compressWidth);

        }else if(self.orientation==3){
            ctxImgHeight= compressWidth/scale;
            self.canvas.width=compressWidth;
            self.canvas.height=ctxImgHeight;
            self.ctx.clearRect(0, 0, compressWidth, ctxImgHeight);
            self.ctx.fillStyle = "#fff";
            self.ctx.fillRect(0, 0, compressWidth, ctxImgHeight);
            self.ctx.rotate(180 * Math.PI/180);
            self.ctx.drawImage(img,0,0,-compressWidth,-ctxImgHeight);
        }else {
            ctxImgHeight= compressWidth/scale;
            self.canvas.width=compressWidth;
            self.canvas.height=ctxImgHeight;
            self.ctx.clearRect(0, 0, compressWidth, ctxImgHeight);
            self.ctx.fillStyle = "#fff";
            self.ctx.fillRect(0, 0, compressWidth, ctxImgHeight);
            self.ctx.drawImage(img,0,0,compressWidth,ctxImgHeight);
        }
        var base64 = self.canvas.toDataURL("image/jpeg",0.98);
        return base64;
    }
};


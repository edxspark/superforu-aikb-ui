
// 共通参数
let server = getParamValueByName("server");                 // content:文档编辑 template:模版编辑
let mode   = getParamValueByName("mode");                   // edit:编辑 preview:预览
let fileId = getParamValueByName("fileId");                 // 文件ID
let kmType = getParamValueByName("kmType");                 // km: 知识库（不显示顶部工具栏）doc: 文档库
let templateId = getParamValueByName("templateId");         // 模版记录ID（server=template）
let spfTk= "Bearer " + getParamValueByName("spfTk"); // spfTk（server=template）
let clientId   = getParamValueByName("clientId");           // clientId（server=template）

let fileTypeCode= "";                         // 文件类型编码
let fileUUID = createUUIDByParams();                 // 文件存储唯一ID


// 配置信息
// 文档服务器地址
let spfAppServerHost = localStorage.getItem("spf_app_server_host");
let folderFileAPI    = "/api/kb/folderFile";
let fileContentAPI   = "/api/kb/fileContent";
let fileTemplateAPI  = "/api/kb/fileTemplate";
let downloadAPI      = "/api/resource/oss/downloadByUser";

// 初始化编辑器内容
let content = "";
if("content"===server){
    spfTk    = localStorage.getItem("spf_token");
    clientId = localStorage.getItem("spf_client_id");
}


/**
 * 文档编辑器处理
 * 1. 获取文件信息
 * 2. 获取文件内容
 * 3. 初始化处理
 * 4. 跳转进入编辑器
 */
let app = angular.module('myApp', []);
app.controller('myCtrl', function($scope,$interval,$filter) {

    // 1. 获取文件信息
    let fileObj = myGet(spfAppServerHost+folderFileAPI+"/"+fileId,null,false);

    if(fileObj.code==200){

        fileTypeCode      = fileObj.data.linkFileTypeCode;
        let fileContentId = fileObj.data.linkFileContentId;
        $scope.fileName   = fileObj.data.fileName;

        // 状态栏处理（知识库树形结构编辑隐藏）
        if("km"!==kmType && "attachment"!==fileTypeCode){
            $("#statusBar").show();
        }

        // 2. 获取文件内容
        let fileContentObj = myGet(spfAppServerHost+fileContentAPI+"/"+fileContentId,null,false);
        if(fileContentObj.code==200){
            content  = fileContentObj.data.linkFileContent;

            // 3. 初始化处理
            // 存储文档初始化数据
            if("flowchat"===fileTypeCode){
                if(null == content || ""===content){
                    content = editorData.drawioInitData;
                }else{
                    content=JSON.parse(content).files.data;
                }
                drawioCreateFile(fileUUID,content);
            }else if("doc"===fileTypeCode){
                if(null == content){content = editorData.aiEditorInitData;}
                localforage.setItem(fileUUID,createSaveData(content,fileTypeCode));
            }else if("whiteboard"===fileTypeCode){
                if(null == content){content = editorData.whiteboardInitData;}
                localforage.setItem(fileUUID,createSaveData(content,fileTypeCode));
            }else if("minder"===fileTypeCode){
                if(null == content || ""===content){
                    content = minderInitData;
                }else{
                    content = JSON.parse(content);
                }
                localforage.setItem(fileUUID,createSaveData(content,fileTypeCode));
            }else if("attachment"===fileTypeCode){
                let ossId    = fileObj.data.picUrl;
                let fileName = fileObj.data.fileName;
                download(spfAppServerHost+downloadAPI+"/"+ossId,fileName);
                return;
            }

            // 4. 跳转进入编辑器
            let editorPath = "";
            console.log("editor.js.fileTypeCode="+fileTypeCode);
            if("markdown"===fileTypeCode){
               editorPath = "/aieditor/index.html";
            }else if("flowchat"===fileTypeCode){
                editorPath = "/flowchat/index.html?lang=zh&ui=simple#L"+fileUUID+".drawio";
            }else if("whiteboard"===fileTypeCode){
                editorPath = "/whiteboard/build/index.html?fileUUID="+fileUUID;
            }else if("minder"===fileTypeCode){
                editorPath = "/minder/index.html?fileUUID="+fileUUID;
            }else{
                editorPath = "/office/index.html?fileUUID="+fileUUID;
            }
            $scope.editorURL = editorPath;
            console.log("editor.js.editorPath="+editorPath);
            $("#editorIframe").css("visibility","visible");
        }
    }
});




/**
 * 保存文档数据
 * iframe内部调用:window.parent.saveContentEvent
 * 1. 接收数据
 * 2. 对比新老数据hashcode
 * 3. 保存数据到localforage,回调文档更新接口
 * */
function saveContentEvent(newData){

    let myCtrlElement = document.querySelector('[ng-controller=myCtrl]');
    let $scope = angular.element(myCtrlElement).scope();

    // 1. 接收数据
    let newDataHashCode = CryptoJS.SHA256(newData).toString();

    localforage.getItem(fileUUID).then(function(value) {
        let oldDataHashCode;
        if(null !== value){
            oldDataHashCode = JSON.parse(value).hashCode;
        }
        //console.log("oldData="+value);
        //console.log("newData="+newData);

        //console.log("oldDataHashCode="+oldDataHashCode);
        //console.log("newDataHashCode="+newDataHashCode);

        // 2. 对比新老数据hashcode
        if(newDataHashCode !== oldDataHashCode){

            console.log("数据变化，正在保存...");
            // 3. 保存数据到localforage,回调文档更新接口
            localforage.setItem(fileUUID, createSaveData(newData,fileTypeCode)).then(function (value) {
                let data = {"linkFileId":fileId,"linkFileContent":newData};
                $scope.remainTip = "保存中...";
                $scope.$apply();
                myPut(spfAppServerHost+fileContentAPI,data,true);

                setTimeout(function(){
                    $scope.remainTip = "已自动保存 " + getHM();
                    $scope.$apply();
                },800);

                console.log("保存成功！");

            }).catch(function(err) {
                console.log(err);
            });
        }else{
            console.log("数据无变化");
        }

    }).catch(function(err) {
        console.log(err);
    });

}

/**
 * 文档重命名
 * */
function rename(e){
    let fileName = ""+e.value;
    if(fileName.length>64){
        $("#toastModal").show();
        alert("文档名称大于64个字符，长度为："+fileName.length);
        return;
    }

    // 更新文档名称
    let data = {"id":fileId,"fileName":e.value};
    myPut(spfAppServerHost+folderFileAPI,data,true);

    // 更新模版名称（server=template）
    if("template"===server){
        let dataTemplate = {"id":templateId,"name":e.value};
        myPut(spfAppServerHost+fileTemplateAPI,dataTemplate,true);
    }
}

/**
 * 文档重命名更新刷新状态
 * */
function updateFileRefreshStatus(e){
    // 文件被重命名，文档列表刷新
    if("doc"===kmType){
        console.log("event.setting.refresh=true")
        localStorage.setItem("spf_file_status_refresh","true");
    }
}

/**
 * 获取编辑器初始化内容
 * */
function getInitContent(){
    return content;
}


/**
 * 获取文档UUID
 * */
function getFileUUID(){
    return fileUUID;
}


// ---------draw.io.util---------------
// ------------------------------------
let database = "database";
let version= 2;

/**
 * 创建drawio文件
 * 1. IndexDB初始化
 * 2. 设置localStorage.filesInfo
 * 3. 设置localStorage.files
 *
 * localStorage.filesInfo (key=fileName, value={title: 'fileUUID.drawio', size: 971, lastModified: 1706875819481, type: 'F'})
 * localStorage.files （key=fileName,value=editorData.drawioInitData）
 * */
function drawioCreateFile(fileUUID,fileContent){

    // 1. IndexDB初始化
    openDB(database,version).then(function(value){

        let db = value.data;

        let titleKeyPath= fileUUID+".drawio";


        // 删除当前文档记录(首次进入)
        deleteData(db,"filesInfo",titleKeyPath).then(function(){
            deleteData(db,"files",titleKeyPath).then(function(){

                // 2. 设置localStorage.filesInfo
                let filesInfoData= {title:titleKeyPath,size:fileContent.length,lastModified: Date.now(), type: 'F'};
                addData(db,"filesInfo",filesInfoData);

                // 3. 设置localStorage.files
                let filesData= {title:titleKeyPath,data:fileContent};
                addData(db,"files",filesData);
            })
        })




    });
}


function drawioSaveFileContent(){
    openDB(database,version).then(function(value){
        let db = value.data;
        let titleKeyPath= fileUUID+".drawio";
        getData(db,"filesInfo",titleKeyPath).then(function(fileInfoValue){
            getData(db,"files",titleKeyPath).then(function(filesValue){
                let drawioData = {"fileInfo":fileInfoValue,"files":filesValue};
                saveContentEvent(JSON.stringify(drawioData));
            })
        })
    })
}


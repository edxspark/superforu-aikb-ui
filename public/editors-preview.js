
// 共通参数
let server = getParamValueByName("server");                 // content:文档编辑 template:模版编辑
let mode   = getParamValueByName("mode");                   // edit:编辑 preview:预览
let fileId = getParamValueByName("fileId");                 // 文件ID
let kmType = getParamValueByName("kmType");                 // km: 知识库（不显示顶部工具栏）doc: 文档库
let shareId    = getParamValueByName("shareId");            // shareId（edit=preview）

let fileTypeCode= "";                         // 文件类型编码
let fileUUID = createUUIDByParams();                 // 文件存储唯一ID


// 配置信息
// 文档服务器地址
let spfAppServerHost = "http://www.superforu.com";
let shareAPI    = "/api/kb/folderFile/getShare";

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

    // 状态栏处理（知识库树形结构编辑隐藏）
    if("km"!==kmType){
        $("#statusBar").show();
    }

    // 1. 获取文件信息
    let fileObj = myGet(spfAppServerHost+shareAPI+"/"+shareId+"/"+fileId,null,false);

    if(fileObj.code==200){

        fileTypeCode      = fileObj.data.linkFileTypeCode;
        $scope.fileName   = fileObj.data.fileName;

        // 2. 获取文件内容
        content  = fileObj.data.linkFileContent;

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
        }

        // 4. 跳转进入编辑器
        let editorPath = "";
        if("doc"===fileTypeCode){
            editorPath = "/aieditor/preview.html";
        }else if("flowchat"===fileTypeCode){
            editorPath = "/flowchat/index.html?lang=zh&ui=simple#L"+fileUUID+".drawio";
        }else if("whiteboard"===fileTypeCode){
            editorPath = "/whiteboard/build/index.html?fileUUID="+fileUUID;
        }
        $scope.editorURL = editorPath;


        $("#editorIframe").css("visibility","visible");

    }
});


/**
 * 获取编辑器初始化内容
 * */
function getInitContent(){
    return content;
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


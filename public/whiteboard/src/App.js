import './App.css';
import { Excalidraw } from "@excalidraw/excalidraw";
import {useState} from "react"
import localforage from "localforage"

/**
 * 1. 获取参数
 * 2. 初始化画板
 * 3. 调用保存接口（发生变化）
 * */
function App() {

    const [excalidrawAPI, setExcalidrawAPI] = useState(null);

    // 1. 获取参数
    // FileUUID
    const searchParams = new URLSearchParams(window.location.search);
    const fileUUID = searchParams.get('fileUUID');
    console.log("fileUUID="+fileUUID);

    if(null !=fileUUID){
        // InitData
        localforage.getItem(fileUUID, (err, value) => {
            // 2. 初始化画板
            const whiteboardInitData = JSON.parse(value).fileContent;
            const sceneData = {
                elements: JSON.parse(whiteboardInitData)
            }
            setFileData(sceneData);
        });

        const setFileData = (sceneData) =>{
            console.log("excalidrawAPI="+excalidrawAPI);
            excalidrawAPI.updateScene(sceneData);
        }

        // 3. 定时存储(调用父窗口:)
        setInterval(()=>{
            const fileData = excalidrawAPI.getSceneElements();
            window.parent.saveContentEvent(JSON.stringify(fileData));
        },3000);
    }

    const eHeight = window.innerHeight;

    const UIOptions = {
        canvasActions: {
            loadScene: false,
            saveToActiveFile:false
        },
    };

  return (
      <>
        <div style={{ height: eHeight}}>
            <Excalidraw langCode={"zh-CN"}
                        theme={"dark"}
                        UIOptions={UIOptions}
                        excalidrawAPI={(api)=> setExcalidrawAPI(api)}

            >
            </Excalidraw>
        </div>
      </>
  );
}

export default App;



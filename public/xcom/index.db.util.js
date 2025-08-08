/**
 * 创建数据库连接
 * @param {string} dbName 数据库名称
 * @param {number} dbVersion 数据库版本
 * @return {Promise<unknown>}
 */
function openDB(dbName,dbVersion) {
    return new Promise((resolve, reject) => {
        //  兼容浏览器
        let indexedDB =
            window.indexedDB
        let db = null
        const req = indexedDB.open(dbName, dbVersion)

        // 操作成功
        req.onsuccess = function () {
            console.log("数据库打开成功");

            // 数据库对象
            db = req.result
            resolve({code: 0, success: true, data: db, msg: '数据库打开成功!'})
        }

        // 操作失败
        req.onerror = function (event) {
            console.log("数据库打开失败");
            reject({code: -1, success: false, data: null, msg: '数据库打开失败!reason：'+event.target})
        }

        // 创建表和索引
        req.onupgradeneeded = function (e) {
            try
            {
                let db = req.result;
                if (e.oldVersion < 1) {
                    // Version 1 is the first version of the database.
                    db.createObjectStore('objects', {keyPath: 'key'});
                }
                if (e.oldVersion < 2) {
                    // Version 2 introduces browser file storage.
                    db.createObjectStore('files', {keyPath: 'title'});
                    db.createObjectStore('filesInfo', {keyPath: 'title'});
                }
            } catch (e)
            {
               console.log(e);
            }
        }
    })
}

/**
 * 新增数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {Object} data 数据
 **/
  function addData(db, storeName, data) {
    return new Promise((resolve, reject) => {
        console.log(data)
        let req = db
            .transaction([storeName], 'readwrite')
            .objectStore(storeName) // 仓库对象
            .add(data)
        // 操作成功
        req.onsuccess = function () {
            console.log('数据写入成功')
            resolve({code: 0, success: true, data: null, msg: '数据写入成功!'})
        }
        // 操作失败
        req.onerror = function (event) {
            console.log('数据写入失败')
            let data = {code: -1, success: false, data: null, msg: '数据写入失败!'+event}
            reject(data)
        }
    })
}

/**
 * 更新数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {object} data 数据
 */
const updateData = function (db, storeName, data) {
    return new Promise((resolve, reject) => {
        const req = db
            .transaction([storeName], 'readwrite')
            .objectStore(storeName)
            .put(data)
        // 操作成功
        req.onsuccess = function () {
            console.log('数据更新成功')
            resolve({code: 0, success: true, data: null, msg: '数据更新成功!'})
        }
        // 操作失败
        req.onerror = function (event) {
            console.log('数据更新失败')
            let data = {code: -1, success: false, data: null, msg: '数据更新失败!'+event}
            reject(data)
        }
    })
}

/**
 *
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param id 要删除的数据id
 * @return {Promise<unknown>}
 */
function deleteData(db, storeName, id){
    return new Promise((resolve, reject) => {
        const req = db
            .transaction([storeName], 'readwrite')
            .objectStore(storeName)
            .delete(id)
        // 操作成功
        req.onsuccess = function () {
            console.log('数据更新成功')
            resolve({code: 0, success: true, data: null, msg: '数据更新成功!'})
        }
        // 操作失败
        req.onerror = function (event) {
            console.log('数据更新失败')
            let data = {code: -1, success: false, data: null, msg: '数据更新失败!'+event}
            reject(data)
        }
    })
}

/**
 * 根据索引找数据
 * @param {Object} db 数据实例
 * @param {string} storeName
 * @param {string} keyPath
 * */
function getData(db,storeName,keyPath){
    if(!db){
        return "";
    }
    let store = db.transaction(storeName, 'readwrite').objectStore(storeName)
    let request = store.get(keyPath)
    return new Promise((resolve, reject) => {
        request.onerror = function(e) {
            reject(e)
        }

        request.onsuccess = function(e) {
            resolve(e.target.result)
        }
    })
}


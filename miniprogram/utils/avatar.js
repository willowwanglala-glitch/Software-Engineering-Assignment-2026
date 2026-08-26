/**
 * 头像持久化：云开发可用时上传云存储，否则落到本地用户目录。
 * 临时路径（http://tmp / wxfile://tmp）不能直接当长期 avatarUrl。
 */

function isTempPath(path) {
  if (!path || typeof path !== 'string') return true;
  if (path.indexOf('cloud://') === 0) return false;
  if (path.indexOf('https://') === 0 || path.indexOf('http://') === 0) {
    return path.indexOf('tmp') !== -1 || path.indexOf('__tmp__') !== -1;
  }
  if (wx.env && wx.env.USER_DATA_PATH && path.indexOf(wx.env.USER_DATA_PATH) === 0) {
    return false;
  }
  return true;
}

function saveLocal(tempPath) {
  return new Promise((resolve, reject) => {
    if (!tempPath) {
      reject(new Error('空图片路径'));
      return;
    }
    if (wx.env && wx.env.USER_DATA_PATH && tempPath.indexOf(wx.env.USER_DATA_PATH) === 0) {
      resolve(tempPath);
      return;
    }
    const dest =
      wx.env && wx.env.USER_DATA_PATH
        ? `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.jpg`
        : '';
    const fs = wx.getFileSystemManager();
    if (dest) {
      fs.saveFile({
        tempFilePath: tempPath,
        filePath: dest,
        success: () => resolve(dest),
        fail: () => {
          wx.saveFile({
            tempFilePath: tempPath,
            success: (r) => resolve(r.savedFilePath || tempPath),
            fail: (e) => reject(e || new Error('本地保存失败'))
          });
        }
      });
      return;
    }
    wx.saveFile({
      tempFilePath: tempPath,
      success: (r) => resolve(r.savedFilePath || tempPath),
      fail: (e) => reject(e || new Error('本地保存失败'))
    });
  });
}

function uploadCloud(tempPath, userId) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud || !wx.cloud.uploadFile) {
      reject(new Error('云存储不可用'));
      return;
    }
    const uid = String(userId || 'guest').replace(/[^\w-]/g, '_').slice(0, 32);
    const cloudPath = `avatars/${uid}_${Date.now()}.jpg`;
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
      success: (res) => {
        if (res.fileID) resolve(res.fileID);
        else reject(new Error('上传成功但无 fileID'));
      },
      fail: (err) => reject(err || new Error('云上传失败'))
    });
  });
}

/**
 * @param {string} tempPath chooseAvatar / chooseMedia 返回的临时路径
 * @param {{ userId?: string, preferCloud?: boolean }} options
 * @returns {Promise<string>} 可长期使用的 avatarUrl
 */
async function persistAvatarFile(tempPath, options = {}) {
  if (!tempPath) throw new Error('未选择图片');
  if (!isTempPath(tempPath) && tempPath.indexOf('cloud://') === 0) {
    return tempPath;
  }

  const preferCloud = options.preferCloud !== false;
  const app = typeof getApp === 'function' ? getApp() : null;
  const cloudReady = !!(app && app.globalData && app.globalData.cloudReady && wx.cloud);

  if (preferCloud && cloudReady) {
    try {
      return await uploadCloud(tempPath, options.userId);
    } catch (e) {
      console.warn('avatar cloud upload fail, fallback local', e);
    }
  }
  return saveLocal(tempPath);
}

module.exports = {
  isTempPath,
  persistAvatarFile,
  saveLocal,
  uploadCloud
};

function formatCloudCallError(err, fnName) {
  const msg = (err && (err.errMsg || err.message)) || '云函数调用失败';
  const name = fnName || 'backendApi';
  if (msg.indexOf('-501000') !== -1 || msg.indexOf('env not exists') !== -1) {
    return (
      '云环境无效(-501000)：①开发者工具→云开发→设置，核对环境ID与 cloud.js 一致；' +
      '②确认本小程序 AppID 已关联该环境；③右键 cloudfunctions/' +
      name +
      ' → 上传并部署(云端安装依赖)'
    );
  }
  if (/function not found|FUNCTION_NOT_FOUND|FUNCTIONS_EXECUTE_FAIL/i.test(msg)) {
    return (
      '云函数 ' +
      name +
      ' 未部署：在左侧 cloudfunctions/' +
      name +
      ' 右键「上传并部署：云端安装依赖」'
    );
  }
  return msg;
}

module.exports = { formatCloudCallError };

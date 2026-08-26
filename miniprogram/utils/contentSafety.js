const BLOCK_PATTERNS = [
  /违法|赌博|色情|暴力恐怖|政治敏感/i,
  /代考|替考|买卖答案|作弊器/i,
  /加微信.*代写|包过.* garantee/i
];

const DISCLAIMER =
  '\n\n【提示】以上内容由 AI 生成，仅供参考，不构成官方招生或考试承诺。';

function filterUserInput(text) {
  const t = (text || '').trim();
  if (!t) return { ok: false, reason: '内容不能为空' };
  if (t.length > 2000) return { ok: false, reason: '输入过长，请精简后重试' };
  for (let i = 0; i < BLOCK_PATTERNS.length; i++) {
    if (BLOCK_PATTERNS[i].test(t)) {
      return { ok: false, reason: '输入包含不当内容，请修改后重试' };
    }
  }
  return { ok: true, text: t };
}

function filterAiOutput(text) {
  let out = (text || '').trim();
  if (!out) return '暂无回答，请稍后重试。';
  for (let i = 0; i < BLOCK_PATTERNS.length; i++) {
    if (BLOCK_PATTERNS[i].test(out)) {
      return '抱歉，该回答未通过安全校验，请换个问法或联系人工客服。';
    }
  }
  if (!out.includes('AI 生成') && !out.includes('仅供参考')) {
    out += DISCLAIMER;
  }
  return out;
}

module.exports = { filterUserInput, filterAiOutput };

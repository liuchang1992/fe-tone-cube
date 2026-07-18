export interface ReleaseNoteItem {
  title: string;
  description: string;
}

export interface ReleaseNote {
  version: string;
  tipTitle: string;
  tipDescription: string;
  modalTitle: string;
  introduction: string;
  items: ReleaseNoteItem[];
  footer: string;
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.0.0',
    tipTitle: '语气魔方 2.0 已上线',
    tipDescription: '改写、个人风格与隐私保护完成一次全面升级',
    modalTitle: '语气魔方 2.0 更新内容',
    introduction: '这是一次围绕“可控、像你、敢用”完成的整体升级：从选择怎么改，到长期维护个人风格，再到敏感内容本地脱敏，转换流程变得更完整。',
    items: [
      {
        title: '改写流程全面升级',
        description: '使用场景重新分组，并新增政务汇报、商务、科研和论文表达；通过仅润色、常规改写或结构重组控制改动范围。',
      },
      {
        title: '个人风格成为长期资产',
        description: '支持多套风格、默认风格、关联素材分析、手动配置、试写预览、版本历史与恢复。',
      },
      {
        title: '新增本地脱敏转换',
        description: '敏感字段先在浏览器内识别和替换，确认实际发送内容后再转换；支持保护列表与本机敏感词库。',
      },
      {
        title: '结果更容易验证',
        description: '个人约束增加严格校验，支持对比默认效果，历史记录会保留使用场景、改写方式和个人风格配置。',
      },
      {
        title: '移动端体验重构',
        description: '重新整理首页、转换页、个人风格详情和隐私确认流程，让关键操作在小屏幕上更清楚、更紧凑。',
      },
    ],
    footer: '本地脱敏无需登录；不创建个人风格，也可以继续使用普通转换。',
  },
];

export const getReleaseNote = (version: string) => (
  RELEASE_NOTES.find((release) => release.version === version) || null
);

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
    version: '1.0.1',
    tipTitle: '改写与个人风格体验已升级',
    tipDescription: '现在可以更清楚地控制怎么改、像谁表达',
    modalTitle: '这次更新了什么',
    introduction: '这次主要让改写过程更可控，也让个人风格从一次分析变成可以长期维护的表达资产。',
    items: [
      {
        title: '新增改写方式',
        description: '选择仅润色、常规改写或结构重组，决定允许怎样调整原文。',
      },
      {
        title: '个人风格更完整',
        description: '支持多套风格、默认风格、手动配置、素材分析、版本历史与恢复。',
      },
      {
        title: '结果更容易验证',
        description: '硬性规则会校验，转换结果可以对比，历史记录会保存使用的配置。',
      },
    ],
    footer: '所有功能都可以按需使用，不创建个人风格也能正常转换。',
  },
];

export const getReleaseNote = (version: string) => (
  RELEASE_NOTES.find((release) => release.version === version) || null
);

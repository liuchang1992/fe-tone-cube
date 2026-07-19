import React, { useRef, useState } from 'react';
import { Button, Input, Modal, Popconfirm, message } from 'antd';
import { DeleteOutlined, ExperimentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

import {
  createCustomScene,
  deleteCustomScene,
  generateCustomScene,
  previewCustomScene,
  updateCustomScene,
  type CustomScene,
  type CustomSceneConfig,
} from '@/api/customScenes';
import type { RewriteStrength } from '@/api/convert';

interface Props {
  open: boolean;
  scene: CustomScene | null;
  rewriteStrength: RewriteStrength;
  personalStyleId: number | null;
  onClose: () => void;
  onSaved: (scene: CustomScene) => void;
  onDeleted: (sceneId: number) => void;
}

const EMPTY_CONFIG: CustomSceneConfig = {
  name: '',
  description: '',
  audience: '',
  goal: '',
  structure: [],
  instructions: [],
  prohibited: [],
};

const toLines = (items: string[]) => items.join('\n');
const fromLines = (value: string) => value
  .split('\n')
  .map((item) => item.trim())
  .filter((item, index, items) => item && items.indexOf(item) === index);

export const CustomSceneEditor: React.FC<Props> = ({
  open,
  scene,
  rewriteStrength,
  personalStyleId,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const [need, setNeed] = useState('');
  const [config, setConfig] = useState<CustomSceneConfig>(scene?.config || EMPTY_CONFIG);
  const [structureText, setStructureText] = useState(toLines(scene?.config.structure || []));
  const [instructionsText, setInstructionsText] = useState(toLines(scene?.config.instructions || []));
  const [prohibitedText, setProhibitedText] = useState(toLines(scene?.config.prohibited || []));
  const [previewText, setPreviewText] = useState('');
  const [previewResult, setPreviewResult] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const previewResultRef = useRef<HTMLDivElement>(null);

  const updateField = <K extends keyof CustomSceneConfig>(
    field: K,
    value: CustomSceneConfig[K],
  ) => setConfig((current) => ({ ...current, [field]: value }));

  const handleGenerate = async () => {
    if (need.trim().length < 10) {
      message.warning('请至少用 10 个字说明文案用途和期望效果');
      return;
    }
    setGenerating(true);
    try {
      const generated = await generateCustomScene(need.trim());
      setConfig(generated);
      setStructureText(toLines(generated.structure));
      setInstructionsText(toLines(generated.instructions));
      setProhibitedText(toLines(generated.prohibited));
      setPreviewResult('');
      message.success('配置已生成，你可以继续修改');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const validate = () => {
    if (!config.name.trim() || !config.description.trim()
      || !config.audience.trim() || !config.goal.trim()) {
      message.warning('请补全场景名称、说明、目标读者和写作目标');
      return false;
    }
    if (!config.instructions.length && !config.structure.length) {
      message.warning('请至少填写一条表达要求或推荐结构');
      return false;
    }
    if (config.structure.length > 8 || config.instructions.length > 10 || config.prohibited.length > 10) {
      message.warning('推荐结构最多 8 条，表达要求和避免事项最多各 10 条');
      return false;
    }
    if ([...config.structure, ...config.instructions, ...config.prohibited]
      .some((item) => item.length > 160)) {
      message.warning('单条配置不能超过 160 个字');
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validate()) return;
    if (!previewText.trim()) {
      message.warning('请先填写一段试写原文');
      return;
    }
    setPreviewing(true);
    try {
      const result = await previewCustomScene(
        previewText.trim(), config, rewriteStrength, personalStyleId,
      );
      setPreviewResult(result);
      message.success('试写完成，已生成预览结果');
      window.setTimeout(() => {
        previewResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '试写失败');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = scene
        ? await updateCustomScene(scene.id, config)
        : await createCustomScene(config);
      message.success(scene ? '自定义场景已更新' : '自定义场景已创建');
      onSaved(saved);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scene) return;
    try {
      await deleteCustomScene(scene.id);
      message.success('自定义场景已删除');
      onDeleted(scene.id);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <Modal
      title={scene ? '编辑自定义场景' : '创建自定义场景'}
      open={open}
      onCancel={onClose}
      width={720}
      centered
      destroyOnHidden
      className="custom-scene-editor"
      footer={(
        <div className="custom-scene-editor__footer">
          {scene && (
            <Popconfirm title="删除这个自定义场景？" onConfirm={handleDelete}>
              <Button danger type="text" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
          <span />
          <Button icon={<ExperimentOutlined />} loading={previewing} onClick={handlePreview}>试写</Button>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>保存使用</Button>
        </div>
      )}
    >
      {!scene && (
        <section className="custom-scene-generate">
          <div><strong>先描述你的需求</strong><small>例如：把技术周报改成面向非技术管理者的项目简报，先结论后风险。</small></div>
          <Input.TextArea
            value={need}
            onChange={(event) => setNeed(event.target.value)}
            maxLength={1000}
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="说明文案用途、读者和期望效果"
          />
          <Button type="primary" ghost loading={generating} onClick={handleGenerate}>生成配置</Button>
        </section>
      )}

      <div className="custom-scene-safe-note">
        <SafetyCertificateOutlined /> 只保存结构化写作配置；事实保留和内容安全规则始终生效。
      </div>

      <div className="custom-scene-fields">
        <label><span>场景名称</span><Input value={config.name} maxLength={40} onChange={(e) => updateField('name', e.target.value)} /></label>
        <label><span>简短说明</span><Input value={config.description} maxLength={300} onChange={(e) => updateField('description', e.target.value)} /></label>
        <label><span>目标读者</span><Input value={config.audience} maxLength={100} onChange={(e) => updateField('audience', e.target.value)} /></label>
        <label><span>写作目标</span><Input value={config.goal} maxLength={200} onChange={(e) => updateField('goal', e.target.value)} /></label>
        <label><span>推荐结构 <small>每行一条</small></span><Input.TextArea value={structureText} autoSize={{ minRows: 2, maxRows: 4 }} onChange={(e) => { setStructureText(e.target.value); updateField('structure', fromLines(e.target.value)); }} /></label>
        <label><span>表达要求 <small>每行一条</small></span><Input.TextArea value={instructionsText} autoSize={{ minRows: 2, maxRows: 5 }} onChange={(e) => { setInstructionsText(e.target.value); updateField('instructions', fromLines(e.target.value)); }} /></label>
        <label><span>避免事项 <small>每行一条</small></span><Input.TextArea value={prohibitedText} autoSize={{ minRows: 2, maxRows: 4 }} onChange={(e) => { setProhibitedText(e.target.value); updateField('prohibited', fromLines(e.target.value)); }} /></label>
      </div>

      <section className="custom-scene-preview">
        <div className="custom-scene-preview__heading"><strong><ExperimentOutlined /> 试写效果</strong><small>试写会消耗 1 次文本转换额度</small></div>
        <Input.TextArea value={previewText} onChange={(e) => setPreviewText(e.target.value)} maxLength={1000} autoSize={{ minRows: 2, maxRows: 5 }} placeholder="粘贴一小段原文验证效果" />
        {previewResult && <div ref={previewResultRef} className="custom-scene-preview__result">{previewResult}</div>}
      </section>
    </Modal>
  );
};

import { useState, type FC } from 'react';
import { Button, Image, Input, Modal, Select, message } from 'antd';
import { CheckCircleFilled, MessageOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import { trackFeature } from '@/api/analytics';
import { submitFeedback, type FeedbackCategory } from '@/api/feedback';
import contactWechatQr from '@/assets/contact-wechat-qr.png';
import './FeedbackWidget.less';


const CATEGORY_OPTIONS = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'bad_result', label: '转换效果不好' },
  { value: 'problem', label: '使用问题' },
  { value: 'other', label: '其他' },
] satisfies Array<{ value: FeedbackCategory; label: string }>;

const ACTIVE_DOCUMENT_TASK_KEY = 'activeDocumentTaskId';

export const FeedbackWidget: FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const resetForm = () => {
    setCategory('suggestion');
    setContent('');
    setContact('');
    setFeedbackId(null);
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
    trackFeature('feedback_open');
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
  };

  const handleSubmit = async () => {
    const normalizedContent = content.trim();
    if (normalizedContent.length < 5) {
      message.warning('请至少输入 5 个字符的反馈内容');
      return;
    }

    setSubmitting(true);
    try {
      const taskId = localStorage.getItem(ACTIVE_DOCUMENT_TASK_KEY) || undefined;
      const response = await submitFeedback({
        category,
        content: normalizedContent,
        contact: contact.trim() || undefined,
        page_path: location.pathname,
        task_id: taskId,
      });
      setFeedbackId(response.feedback_id);
      trackFeature('feedback_submit');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '反馈提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="feedback-trigger" onClick={handleOpen} aria-label="提交反馈">
        <MessageOutlined />
        <span>反馈</span>
      </button>

      <Modal
        open={open}
        title={feedbackId ? null : '告诉我们你的想法'}
        onCancel={handleClose}
        destroyOnHidden
        width={480}
        footer={
          feedbackId
            ? [
                <Button key="done" type="primary" onClick={handleClose}>
                  完成
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={handleClose} disabled={submitting}>
                  取消
                </Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
                  提交反馈
                </Button>,
              ]
        }
        className="feedback-modal"
      >
        {feedbackId ? (
          <div className="feedback-success">
            <CheckCircleFilled />
            <h2>感谢你的反馈</h2>
            <p>我们已经收到并会认真处理。</p>
            <span>反馈编号：{feedbackId}</span>
          </div>
        ) : (
          <div className="feedback-form">
            <label>
              <span>反馈类型</span>
              <Select
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                className="feedback-category"
              />
            </label>

            <label>
              <span>反馈内容</span>
              <Input.TextArea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="请描述遇到的问题或希望增加的功能"
                maxLength={2000}
                autoSize={{ minRows: 5, maxRows: 9 }}
                showCount
              />
            </label>

            <label>
              <span>联系方式（选填）</span>
              <Input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="微信、邮箱或手机号，我们将在3个工作日内回复你"
                maxLength={200}
              />
            </label>

            <p className="feedback-privacy">
              将自动记录当前页面用于定位问题，不会提交输入框或转换结果中的正文。
            </p>
          </div>
        )}

        <div className="feedback-direct-contact">
          <Image
            src={contactWechatQr}
            alt="语气魔方微信二维码"
            width={104}
            preview={{ mask: '点击放大' }}
            className="feedback-contact-qr"
          />
          <div>
            <strong>想直接和我沟通？</strong>
            <p>扫码添加微信，产品问题、使用建议都可以直接找我。</p>
            <span>手机端可点击放大后长按识别</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

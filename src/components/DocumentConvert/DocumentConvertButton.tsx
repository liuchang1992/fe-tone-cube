import React, { useEffect, useRef, useState } from 'react';
import { Modal, message } from 'antd';
import { FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';

import { useAppStore } from '@/store/appStore';

const MAX_DOCUMENT_FILE_BYTES = 2_000_000;

export const DocumentConvertButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    convertDocument,
    documentRemainingQuota,
    isDocumentLoading,
    documentTaskMessage,
    documentTaskProgress,
    documentTaskResult,
    isDocumentPreviewOpen,
    resumeDocumentConversion,
    setDocumentPreviewOpen,
    setShowLoginModal,
    user,
  } = useAppStore();
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'docx'>('txt');
  const fileName = documentTaskResult?.file_name || '';
  const documentOutputText = documentTaskResult?.result || '';
  const docxBase64 = documentTaskResult?.docx_base64 || null;
  const docxFileName = documentTaskResult?.docx_file_name || null;
  const isDocumentQuotaExhausted = (
    user.isLoggedIn
    && documentRemainingQuota !== null
    && documentRemainingQuota <= 0
  );
  const documentHint = isDocumentLoading
    ? documentTaskMessage || '文档正在后台转换，可继续使用普通文案转换'
    : isDocumentQuotaExhausted
      ? '文档转换次数已用完，请明天再试或联系管理员增加次数'
      : '文档转换每日限用 1 次；文档内容最多 8000 个字符，文件最大 2 MB';

  useEffect(() => {
    void resumeDocumentConversion();
  }, [resumeDocumentConversion]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowed = ['.txt', '.docx', '.pdf'].some((suffix) => file.name.toLowerCase().endsWith(suffix));
    if (!allowed) {
      message.warning('请上传 .txt、.docx 或 .pdf 文件');
      return;
    }
    if (file.size > MAX_DOCUMENT_FILE_BYTES) {
      message.warning('文件过大，最大支持 2 MB');
      return;
    }

    setDownloadFormat(file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'txt');
    await convertDocument(file);
  };

  const downloadResult = () => {
    if (!documentOutputText) return;
    const baseName = fileName.replace(/\.[^.]+$/, '') || '转换结果';
    const blob = new Blob([documentOutputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}-语气转换.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyResult = async () => {
    if (!documentOutputText) return;
    try {
      await navigator.clipboard.writeText(documentOutputText);
      message.success('复制成功');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const downloadDocx = () => {
    if (!docxBase64) return;
    const binary = atob(docxBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docxFileName || `${fileName.replace(/\.[^.]+$/, '') || '转换结果'}-语气转换.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadConvertedFile = () => {
    if (downloadFormat === 'docx' && docxBase64) {
      downloadDocx();
      return;
    }
    downloadResult();
  };

  const openFilePicker = () => {
    if (!user.isLoggedIn) {
      message.info('请先登录后再上传文档转换');
      setShowLoginModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="document-convert-control">
        <button
          type="button"
          className="document-convert-btn"
          onClick={openFilePicker}
          disabled={isDocumentLoading || isDocumentQuotaExhausted}
          title={isDocumentQuotaExhausted ? '文档转换次数已用完' : undefined}
        >
          <FileTextOutlined />
          {isDocumentQuotaExhausted
            ? '文档次数已用完'
            : isDocumentLoading
              ? `文档转换中 ${documentTaskProgress}%`
              : '上传文档转换'}
        </button>
        {documentTaskResult && !isDocumentLoading && (
          <button
            type="button"
            className="document-convert-btn"
            onClick={() => setDocumentPreviewOpen(true)}
          >
            最近结果
          </button>
        )}
        <span
          className="document-convert-hint"
          tabIndex={0}
          aria-label={documentHint}
        >
          <InfoCircleOutlined />
          <span className="document-convert-tooltip">{documentHint}</span>
        </span>
      </div>
      <input
        ref={fileInputRef}
        className="document-convert-input"
        type="file"
        accept=".txt,.docx,.pdf"
        onChange={handleFileChange}
      />

      <Modal
        title={fileName ? `文档转换预览：${fileName}` : '文档转换预览'}
        open={isDocumentPreviewOpen && Boolean(documentTaskResult)}
        onCancel={() => setDocumentPreviewOpen(false)}
        className="document-convert-modal"
        footer={[
          <button key="copy" className="document-modal-secondary" onClick={copyResult}>
            复制结果
          </button>,
          <div key="download" className="document-download-group">
            <select
              className="document-download-select"
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value as 'txt' | 'docx')}
            >
              <option value="txt">TXT</option>
              <option value="docx" disabled={!docxBase64}>DOCX</option>
            </select>
            <button className="document-modal-primary document-download-action" onClick={downloadConvertedFile}>
              下载
            </button>
          </div>,
        ]}
        width={720}
      >
        <div className="document-preview">{documentOutputText}</div>
      </Modal>
    </>
  );
};

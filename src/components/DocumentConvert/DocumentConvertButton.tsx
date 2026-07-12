import React, { useRef, useState } from 'react';
import { Modal, message } from 'antd';
import { FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';

import { useAppStore } from '@/store/appStore';

export const DocumentConvertButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { convertDocument, isLoading, outputText, setShowLoginModal, user } = useAppStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [docxBase64, setDocxBase64] = useState<string | null>(null);
  const [docxFileName, setDocxFileName] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'docx'>('txt');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowed = ['.txt', '.docx', '.pdf'].some((suffix) => file.name.toLowerCase().endsWith(suffix));
    if (!allowed) {
      message.warning('请上传 .txt、.docx 或 .pdf 文件');
      return;
    }

    const result = await convertDocument(file);
    if (result) {
      setFileName(result.file_name);
      setDocxBase64(result.docx_base64 || null);
      setDocxFileName(result.docx_file_name || null);
      setDownloadFormat(result.docx_base64 ? 'docx' : 'txt');
      setPreviewOpen(true);
    }
  };

  const downloadResult = () => {
    if (!outputText) return;
    const baseName = fileName.replace(/\.[^.]+$/, '') || '转换结果';
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}-语气转换.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyResult = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    message.success('复制成功');
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
          disabled={isLoading}
        >
          <FileTextOutlined />
          上传文档转换
        </button>
        <span className="document-convert-hint" tabIndex={0} aria-label="文档转换每日限用 1 次">
          <InfoCircleOutlined />
          <span className="document-convert-tooltip">文档转换每日限用 1 次</span>
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
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
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
        <div className="document-preview">{outputText}</div>
      </Modal>
    </>
  );
};

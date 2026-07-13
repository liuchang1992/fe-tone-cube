import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Typography, Divider, Tag } from 'antd';
import { LeftOutlined, MailOutlined, CheckOutlined } from '@ant-design/icons';
import './Privacy.less';

const { Title, Text, Paragraph } = Typography;

export const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        {/* ====== 头部 ====== */}
        <div className="privacy-header">
          <div className="logo-area">
            <span className="logo-icon">🎲</span>
            <span className="logo-text">
              语气<span className="highlight">魔方</span>
            </span>
          </div>
        </div>

        {/* ====== 标题区 ====== */}
        <div className="privacy-title-section">
          <Title level={1} className="title">隐私政策</Title>
          <Space size="middle" className="meta">
            <span>📅 版本：v1.1</span>
            <span>📌 更新日期：2026年7月13日</span>
            <span>⚡ 生效日期：2026年7月13日</span>
          </Space>
        </div>

        {/* ====== 正文 ====== */}
        <div className="privacy-content">
          <Paragraph className="intro">
            欢迎您使用「语气魔方」！我们深知个人信息对您的重要性，我们将严格按照法律法规要求，保护您的个人信息安全。
          </Paragraph>

          <div className="notice-box">
            <strong>请您在使用本产品前，仔细阅读并充分理解本《隐私政策》。</strong>
            如您不同意本政策中的任何条款，请立即停止使用本产品。当您使用本产品时，即表示您已同意我们按照本政策收集、使用、存储和保护您的信息。
          </div>

          <div className="training-assurance">
            <strong>我们不会使用您的文案训练或微调模型</strong>
            <span>内容仅用于安全检测、语气转换，以及您主动使用的历史记录和个人语料功能。</span>
          </div>

          {/* 一 */}
          <Title level={2}>一、我们如何收集和使用您的信息</Title>
          <Paragraph>在您使用本产品的过程中，我们会收集以下信息：</Paragraph>

          <Title level={3}>1. 您主动提交的信息</Title>
          <ul>
            <li>
              <strong>输入文本和上传文档</strong>：您在使用语气转换或文档分析功能时提交的内容。
              <br />
              <Tag color="purple" style={{ marginTop: 4 }}>✓ 不会用于训练或微调模型</Tag>
            </li>
            <li><strong>个人语料</strong>：您主动提交用于分析个人表达风格的文本或文档。</li>
            <li><strong>账户信息</strong>：如果您注册账号，我们会收集您的用户名及保障账号正常使用所需的信息。</li>
            <li><strong>反馈信息</strong>：您主动提交的反馈、评价等内容。</li>
          </ul>

          <Title level={3}>2. 自动收集的技术信息</Title>
          <ul>
            <li><strong>设备信息</strong>：设备型号、操作系统版本等。</li>
            <li><strong>日志信息</strong>：访问时间、IP地址、浏览器类型等。</li>
          </ul>

          {/* 二 */}
          <Title level={2}>二、我们如何使用您的信息</Title>
          <Paragraph>我们收集的信息将用于以下目的：</Paragraph>
          <ul>
            <li><strong>提供核心服务</strong>：将您输入的文本转换为目标语气风格。</li>
            <li><strong>内容安全检测</strong>：识别不适合处理的内容并向您提示。</li>
            <li><strong>调用模型推理服务</strong>：为提供转换和分析服务，我们会将相关内容传输至阿里云百炼进行处理。</li>
            <li><strong>历史记录与个人语料</strong>：在您登录并主动使用相关功能时，保存内容以便后续查看或复用个人表达风格。</li>
            <li><strong>优化服务质量</strong>：统计页面访问和功能使用情况以改进产品；产品分析事件不包含您的文案正文。</li>
            <li><strong>安全保障</strong>：维护服务的安全稳定运行，防止欺诈和滥用。</li>
          </ul>

          {/* 三 */}
          <Title level={2}>三、我们如何存储和保护您的信息</Title>
          <ul>
            <li>
              <strong>存储地点</strong>：您的信息存储于<Text strong>中国境内的阿里云服务器</Text>。
            </li>
            <li>
              <strong>存储期限</strong>：
              <ul>
                <li>未登录用户的普通转换内容不会写入业务历史记录。</li>
                <li>登录后的成功转换记录（包括输入和结果）会保存在您的账号下，您可在历史记录中手动删除。</li>
                <li>您主动提交的个人语料会保存在账号下，用于个人风格功能，直至您替换、删除或联系我们处理。</li>
                <li>文档异步任务的临时处理数据和任务结果会在服务端按任务有效期自动清理。</li>
              </ul>
            </li>
            <li><strong>安全措施</strong>：我们采用行业标准的安全技术（如数据加密、访问控制）保护您的信息。</li>
          </ul>

          {/* 四 */}
          <Title level={2}>四、我们如何共享您的信息</Title>
          <Paragraph>我们不会出售或非法共享您的个人信息。以下情况除外：</Paragraph>
          <ul>
            <li>
              <strong>模型推理服务商</strong>：为提供语气转换和分析服务，我们会将必要内容传输至阿里云百炼API。阿里云百炼说明，未经用户明确授权不会使用对话数据训练模型；其仍可能依据法律法规和服务运行要求处理或存储调用数据。您可查看
              <a href="https://help.aliyun.com/zh/model-studio/privacy-notice" target="_blank" rel="noreferrer">阿里云百炼隐私说明</a>。
            </li>
            <li><strong>法律法规要求</strong>：根据法律法规或政府部门的强制性要求。</li>
            <li><strong>您的明确同意</strong>：在获得您单独同意的情况下。</li>
          </ul>

          {/* 五 */}
          <Title level={2}>五、您的权利</Title>
          <Paragraph>您对自己的个人信息享有以下权利：</Paragraph>
          <ul>
            <li><strong>访问权</strong>：您可以登录账号查看您的历史记录。</li>
            <li><strong>更正权</strong>：您可以修改您的账户信息。</li>
            <li><strong>删除权</strong>：您可以删除历史记录和个人语料，或联系我们删除您的账户信息。</li>
            <li><strong>撤回同意权</strong>：您可以通过停止使用本产品来撤回您的同意。</li>
            <li><strong>注销账户</strong>：您可以联系客服注销您的账号。</li>
          </ul>

          {/* 六 */}
          <Title level={2}>六、未成年人保护</Title>
          <Paragraph>
            我们非常重视对未成年人个人信息的保护。如果您是<Text strong>14周岁以下</Text>的未成年人，请在您的父母或监护人陪同下阅读本政策，并在征得监护人同意后使用本产品。
          </Paragraph>

          {/* 七 */}
          <Title level={2}>七、隐私政策的更新</Title>
          <Paragraph>
            我们可能会适时更新本隐私政策。更新后的版本将在本页面发布，并注明更新日期。重大变更时，我们会通过弹窗或公告等方式通知您。
          </Paragraph>

          {/* 八 */}
          <Title level={2}>八、如何联系我们</Title>
          <Paragraph>
            如您对本隐私政策有任何疑问、意见或建议，可通过以下方式联系我们：
            <br />
            <Text strong>
              <MailOutlined /> 邮箱：<a href="mailto:18233383821@163.com">18233383821@163.com</a>
            </Text>
          </Paragraph>

          <div className="footer-note">
            <Text strong>感谢您信任并使用语气魔方！</Text>
            <br />
            <Text type="secondary">我们承诺持续保护您的隐私权益。</Text>
          </div>
        </div>

        {/* ====== 底部操作栏 ====== */}
        <div className="privacy-footer">
          <Button type="link" icon={<LeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            我已知晓
          </Button>
        </div>

        <div className="privacy-copyright">
          © 2026 语气魔方 · 保留所有权利 &nbsp;·&nbsp; 
          <a href="mailto:18233383821@163.com">联系我们</a>
        </div>
      </div>
    </div>
  );
};

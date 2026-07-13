import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BankOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  DownOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { FaAlipay, FaPaypal, FaWeixin } from 'react-icons/fa';

import apiClient from '@/api/client';
import { useAppStore } from '@/store/appStore';
import './Pay.less';

type PlanId = 'free' | 'monthly' | 'yearly';
type PaidPlanId = Exclude<PlanId, 'free'>;

interface PlanOption {
  id: PlanId;
  title: string;
  price: string;
  unit?: string;
  oldPrice?: string;
  badge?: string;
  save?: string;
  icon: React.ReactNode;
  features: string[];
  buttonText: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'free',
    title: '基础版',
    price: '免费',
    icon: <CheckCircleFilled />,
    features: ['每日10次转换', '基础语气模板', '标准转换速度'],
    buttonText: '当前版本',
  },
  {
    id: 'monthly',
    title: '专业版',
    price: '¥29',
    unit: '/月',
    oldPrice: '¥59',
    badge: '推荐',
    icon: <RocketOutlined />,
    features: ['每日200次转换', '全部语气模板', '优先转换速度', '风格定制分析', '专属客服支持'],
    buttonText: '立即订阅',
  },
  {
    id: 'yearly',
    title: '旗舰版',
    price: '¥199',
    unit: '/年',
    save: '节省¥149',
    icon: <SafetyCertificateOutlined />,
    features: ['无限次转换', '全部高级功能', '极速转换通道', 'API接口调用', '团队协作功能', '专属客服 + 培训'],
    buttonText: '立即订阅',
  },
];

const COMPARE_ROWS = [
  ['转换次数', '10次/天', '200次/天', '无限制'],
  ['模板数量', '基础模板', '全部模板', '全部模板'],
  ['转换速度', '标准', '优先', '极速'],
  ['风格分析', '×', '✓', '✓'],
  ['客服支持', '×', '✓', '✓'],
  ['API接口', '×', '×', '✓'],
];

const PAYMENT_METHODS = [
  { id: 'wechat', label: '微信支付', icon: <FaWeixin />, color: '#22c55e' },
  { id: 'alipay', label: '支付宝', icon: <FaAlipay />, color: '#1677ff' },
  { id: 'card', label: '银行卡', icon: <CreditCardOutlined />, color: '#374151' },
  { id: 'paypal', label: 'PayPal', icon: <FaPaypal />, color: '#0070ba' },
];

const FAQS = [
  ['如何取消自动续费？', '您可以在账户设置中随时取消自动续费功能'],
  ['退款政策是什么？', '支持7天无理由退款，退款将原路返回'],
  ['如何开具发票？', '订单完成后可在个人中心申请开具电子发票'],
];

export const Pay: React.FC = () => {
  const navigate = useNavigate();
  const { setShowLoginModal, user } = useAppStore();
  const [agreed, setAgreed] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [qrCode, setQrCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PaidPlanId>('monthly');
  const [status, setStatus] = useState<'idle' | 'pending' | 'paid' | 'cancelled'>('idle');

  useEffect(() => {
    if (!user.isLoggedIn) {
      setShowLoginModal(true);
    }
  }, [setShowLoginModal, user.isLoggedIn]);

  useEffect(() => {
    if (!orderNo || status === 'paid' || status === 'cancelled') return;

    const interval = window.setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/pay/status/${orderNo}`);
        if (response.data.is_paid) {
          setStatus('paid');
          window.clearInterval(interval);
          window.setTimeout(() => {
            navigate('/convert');
            window.location.reload();
          }, 1500);
        }
      } catch {
        // Ignore polling failures; the next tick may recover.
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [navigate, orderNo, status]);

  const activePlan = useMemo(
    () => PLANS.find((plan) => plan.id === selectedPlan)!,
    [selectedPlan]
  );

  const orderInfo = useMemo(() => {
    if (selectedPlan === 'yearly') {
      return {
        duration: '1年',
        discount: '-¥149',
        payable: '¥199',
        subtotal: '¥348',
      };
    }
    return {
      duration: '1个月',
      discount: '-¥30',
      payable: '¥29',
      subtotal: '¥59',
    };
  }, [selectedPlan]);

  const handleCreateOrder = async () => {
    if (!user.isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (!agreed) {
      setError('请先阅读并同意会员服务协议和自动续费说明');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/pay/create', {
        plan_type: selectedPlan,
      });
      setOrderNo(response.data.order_no);
      setQrCode(response.data.qr_code);
      setStatus('pending');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '创建订单失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockPay = async () => {
    if (!orderNo) return;
    try {
      await apiClient.post(`/api/pay/mock-pay/${orderNo}`);
      setStatus('paid');
      window.setTimeout(() => {
        navigate('/convert');
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || '模拟支付失败');
    }
  };

  if (status === 'pending') {
    return (
      <div className="pay-page pay-page--center">
        <div className="pay-card">
          <div className="pay-status-icon">
            <FaAlipay />
          </div>
          <h2 className="pay-card-title">扫码支付</h2>
          <p className="pay-card-desc">请使用支付宝扫描下方二维码完成支付</p>

          {qrCode && (
            <div className="qr-card">
              <img src={qrCode} alt="支付二维码" className="qr-image" />
            </div>
          )}

          <div className="order-code">
            订单号：<span>{orderNo}</span>
          </div>
          <div className="pay-waiting">
            <span className="pay-waiting-dot" />
            等待支付...
          </div>

          {import.meta.env.DEV && (
            <button onClick={handleMockPay} className="mock-pay-btn">
              模拟支付（开发环境）
            </button>
          )}

          <button
            onClick={() => {
              setStatus('cancelled');
              setOrderNo('');
              setQrCode('');
            }}
            className="pay-link-btn"
          >
            取消支付
          </button>
        </div>
      </div>
    );
  }

  if (status === 'paid') {
    return (
      <div className="pay-page pay-page--center">
        <div className="pay-card">
          <div className="pay-status-icon pay-status-icon--success">
            <CheckCircleFilled />
          </div>
          <h2 className="pay-card-title">支付成功！</h2>
          <p className="pay-success-desc">恭喜你成为语气魔方会员，所有功能已解锁</p>
          <button onClick={() => navigate('/convert')} className="pay-start-btn">
            开始使用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-page">
      <main className="pay-wrapper">
        <header className="pay-header">
          <h1>升级会员，解锁更多AI能力</h1>
          <p>选择适合你的套餐方案</p>
        </header>

        {error && <div className="pay-error">{error}</div>}

        <section className="plan-grid" aria-label="会员套餐">
          {PLANS.map((plan) => {
            const isFree = plan.id === 'free';
            const isSelected = plan.id === selectedPlan;

            return (
              <article
                key={plan.id}
                className={`plan-card ${isSelected ? 'plan-card--selected' : ''}`}
                onClick={() => !isFree && setSelectedPlan(plan.id as PaidPlanId)}
              >
                {plan.badge && <span className="plan-badge">{plan.badge}</span>}
                <div className="plan-title-row">
                  <span className="plan-icon">{plan.icon}</span>
                  <h2>{plan.title}</h2>
                </div>
                <div className="plan-price">
                  <strong>{plan.price}</strong>
                  {plan.unit && <span>{plan.unit}</span>}
                </div>
                {plan.oldPrice && <div className="old-price">{plan.oldPrice}</div>}
                {plan.save && <span className="save-badge">{plan.save}</span>}
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircleFilled />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`plan-button ${isFree ? 'plan-button--muted' : ''}`}
                  disabled={isFree}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isFree) setSelectedPlan(plan.id as PaidPlanId);
                  }}
                >
                  {plan.buttonText}
                </button>
              </article>
            );
          })}
        </section>

        <section className="pay-section compare-section">
          <h2>详细功能对比</h2>
          <table>
            <thead>
              <tr>
                <th>功能项</th>
                <th>基础版</th>
                <th>专业版</th>
                <th>旗舰版</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td key={cell} className={cell === '✓' ? 'check-cell' : cell === '×' ? 'cross-cell' : ''}>
                      {index === 0 ? <strong>{cell}</strong> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="pay-section">
          <h2>选择支付方式</h2>
          <div className="payment-grid">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                className={`payment-card ${paymentMethod === method.id ? 'payment-card--active' : ''}`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <span style={{ color: method.color }}>{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>
        </section>

        <section className="pay-section order-section">
          <h2>订单信息</h2>
          <div className="order-row">
            <span>套餐名称</span>
            <strong>{activePlan.title}会员</strong>
          </div>
          <div className="order-row">
            <span>订阅时长</span>
            <strong>{orderInfo.duration}</strong>
          </div>
          <div className="coupon-row">
            <input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value)}
              placeholder="输入优惠券代码"
            />
            <button>应用</button>
          </div>
          <div className="order-row">
            <span>小计</span>
            <strong>{orderInfo.subtotal}</strong>
          </div>
          <div className="order-row discount">
            <span>优惠</span>
            <strong>{orderInfo.discount}</strong>
          </div>
          <div className="order-total">
            <span>实付金额</span>
            <strong>{orderInfo.payable}</strong>
          </div>
          <label className="agreement-row">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span>
              我已阅读并同意
              <a href="/privacy" target="_blank" rel="noreferrer">《会员服务协议》</a>
              和
              <a href="/privacy" target="_blank" rel="noreferrer">《自动续费说明》</a>
            </span>
          </label>
        </section>

        <div className="confirm-pay-wrap">
          <button onClick={handleCreateOrder} disabled={isLoading} className="confirm-pay-btn">
            {isLoading ? '创建订单中...' : `确认支付 ${orderInfo.payable}`}
          </button>
          <p>支持7天无理由退款</p>
        </div>

        <section className="pay-section faq-section">
          <h2>常见问题</h2>
          {FAQS.map(([question, answer]) => (
            <details key={question} className="faq-item">
              <summary>
                <span>{question}</span>
                <DownOutlined />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
      </main>
    </div>
  );
};

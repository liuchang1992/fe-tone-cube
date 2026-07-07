import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import apiClient from '@/api/client';

// 定义套餐类型
interface PlanOption {
  id: string;
  name: string;
  price: number;
  days: number;
  description: string;
  popular?: boolean; // 是否为推荐套餐
  features: string[];
}

// 套餐数据
const PLANS: PlanOption[] = [
  {
    id: 'monthly',
    name: '月度会员',
    price: 9.9,
    days: 30,
    description: '按月订阅，随时取消',
    features: ['无限次数转换', '所有风格可用', '无广告体验', '随时取消'],
  },
  {
    id: 'quarterly',
    name: '季度会员',
    price: 19.9,
    days: 90,
    description: '超值性价比，省心省力',
    popular: true,
    features: ['无限次数转换', '所有风格可用', '无广告体验', '专属客服支持'],
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 49.9,
    days: 365,
    description: '长期使用，最划算的选择',
    features: ['无限次数转换', '所有风格可用', '无广告体验', '专属客服支持', '新功能优先体验'],
  },
];

export const Pay: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');
  const [orderNo, setOrderNo] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'paid' | 'cancelled'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查登录状态
  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 轮询支付状态
  useEffect(() => {
    if (!orderNo || status === 'paid' || status === 'cancelled') return;

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/pay/status/${orderNo}`);
        if (response.data.is_paid) {
          setStatus('paid');
          clearInterval(interval);
          setTimeout(() => {
            navigate('/');
            window.location.reload();
          }, 1500);
        }
      } catch (e) {
        // 忽略查询错误
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderNo, status, navigate]);

  // 创建订单
  const handleCreateOrder = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/pay/create', {
        plan_type: selectedPlan,
      });
      const data = response.data;
      setOrderNo(data.order_no);
      setQrCode(data.qr_code);
      setStatus('pending');
    } catch (err: any) {
      setError(err.message || '创建订单失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟支付（仅开发环境）
  const handleMockPay = async () => {
    if (!orderNo) return;
    try {
      await apiClient.post(`/api/pay/mock-pay/${orderNo}`);
      setStatus('paid');
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || '模拟支付失败');
    }
  };

  // ========== 支付中状态 ==========
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">扫码支付</h2>
          <p className="text-gray-400 text-sm mb-6">请使用支付宝扫描下方二维码完成支付</p>

          {qrCode && (
            <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-md">
              <img src={qrCode} alt="支付二维码" className="w-48 h-48" />
            </div>
          )}

          <div className="text-sm text-gray-500 mb-4">
            订单号：<span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{orderNo}</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            等待支付...
          </div>

          {/* 模拟支付按钮（仅开发环境） */}
          {import.meta.env.DEV && (
            <button
              onClick={handleMockPay}
              className="w-full py-2.5 text-sm font-medium text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors mb-3"
            >
              🔧 模拟支付（开发环境）
            </button>
          )}

          <button
            onClick={() => {
              setStatus('cancelled');
              setOrderNo('');
              setQrCode('');
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            取消支付
          </button>
        </div>
      </div>
    );
  }

  // ========== 支付成功状态 ==========
  if (status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">支付成功！</h2>
          <p className="text-gray-500 text-sm">恭喜你成为语气魔方会员，所有功能已解锁</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 btn-primary text-white font-semibold py-3 rounded-xl text-base w-full"
          >
            开始使用
          </button>
        </div>
      </div>
    );
  }

  // ========== 套餐选择状态 ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-6 px-4 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* 页面头部 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 rounded-full text-purple-600 text-sm font-medium mb-3">
            <span>⚡</span> 升级会员
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
            解锁<span className="gradient-text">无限</span>可能
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            选择适合你的套餐，开启无限次数转换之旅
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`
                  relative glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300
                  ${isSelected ? 'ring-2 ring-purple-500 shadow-xl transform -translate-y-1' : 'hover:shadow-lg hover:transform hover:-translate-y-0.5'}
                  ${plan.popular ? 'border-purple-200' : ''}
                `}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {/* 推荐标签 */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-lg">
                    最受欢迎
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                  </div>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-800">¥{plan.price}</span>
                  <span className="text-sm text-gray-400 ml-1">/ {plan.days}天</span>
                </div>

                <div className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-purple-400">✓</span> {feature}
                    </div>
                  ))}
                </div>

                <button
                  className={`
                    w-full mt-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isSelected
                      ? 'btn-gradient text-white shadow-lg shadow-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {isSelected ? '当前选择' : '选择套餐'}
                </button>
              </div>
            );
          })}
        </div>

        {/* 底部操作栏 */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleCreateOrder}
            disabled={isLoading}
            className="btn-primary text-white font-semibold py-3.5 rounded-2xl text-base w-full max-w-md transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                创建订单...
              </>
            ) : (
              <>
                <span>💳</span> 立即开通 {PLANS.find(p => p.id === selectedPlan)?.name}
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            稍后再说，返回首页
          </button>
        </div>

        {/* 底部信任标识 */}
        <div className="mt-8 text-center text-xs text-gray-400 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span>🔒 安全支付</span>
          <span>·</span>
          <span>随时取消</span>
          <span>·</span>
          <span>7天退款保障</span>
        </div>
      </div>
    </div>
  );
};
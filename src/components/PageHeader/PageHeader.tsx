import type { ReactNode } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';

import './index.less';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  action?: ReactNode;
}

export const PageHeader = ({ title, onBack, action }: PageHeaderProps) => (
  <div className="compact-page-header">
    <div className="compact-page-header__main">
      <button
        type="button"
        className="compact-page-header__back"
        onClick={onBack}
        aria-label="返回上一页"
        title="返回上一页"
      >
        <ArrowLeftOutlined />
      </button>
      <h1>{title}</h1>
    </div>
    {action && <div className="compact-page-header__action">{action}</div>}
  </div>
);

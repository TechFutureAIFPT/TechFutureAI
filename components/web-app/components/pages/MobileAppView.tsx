/**
 * MobileAppView — 移动端应用视图示例
 * 展示如何在移动端模拟器中渲染真实的移动端 UI
 */
import React, { useState } from 'react';
import './MobileAppView.css';

interface MobileAppViewProps {
  /** 内容区域 */
  children?: React.ReactNode;
}

type MobileTab = 'home' | 'search' | 'upload' | 'analysis' | 'profile';

export const MobileAppView: React.FC<MobileAppViewProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: MobileTab; label: string; icon: string }[] = [
    { id: 'home', label: '首页', icon: 'fa-solid fa-house' },
    { id: 'search', label: '搜索', icon: 'fa-solid fa-magnifying-glass' },
    { id: 'upload', label: '上传', icon: 'fa-solid fa-cloud-arrow-up' },
    { id: 'analysis', label: '分析', icon: 'fa-solid fa-chart-line' },
    { id: 'profile', label: '我的', icon: 'fa-solid fa-user' },
  ];

  return (
    <div className="mobile-app-view mobile-app-view--dark">
      {/* 内容区域 */}
      <div className="mobile-app-view__content">
        {activeTab === 'home' && <HomeTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'upload' && <UploadTab />}
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* 底部导航 */}
      <nav className="mobile-app-view__bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`mobile-app-view__nav-item ${activeTab === tab.id ? 'mobile-app-view__nav-item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

/* ======== Home Tab ======== */
const HomeTab: React.FC<{ searchQuery: string; setSearchQuery: (v: string) => void }> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="mobile-tab">
      {/* 搜索栏 */}
      <div className="mobile-tab__search-bar">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="text"
          placeholder="搜索候选人..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}>
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="mobile-tab__stats">
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__icon mobile-stat-card__icon--blue">
            <i className="fa-solid fa-users" />
          </div>
          <div className="mobile-stat-card__info">
            <span className="mobile-stat-card__value">128</span>
            <span className="mobile-stat-card__label">候选人</span>
          </div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__icon mobile-stat-card__icon--green">
            <i className="fa-solid fa-check-circle" />
          </div>
          <div className="mobile-stat-card__info">
            <span className="mobile-stat-card__value">45</span>
            <span className="mobile-stat-card__label">已筛选</span>
          </div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-card__icon mobile-stat-card__icon--purple">
            <i className="fa-solid fa-star" />
          </div>
          <div className="mobile-stat-card__info">
            <span className="mobile-stat-card__value">12</span>
            <span className="mobile-stat-card__label">优秀</span>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="mobile-tab__section">
        <h3 className="mobile-tab__section-title">快捷操作</h3>
        <div className="mobile-quick-actions">
          <button className="mobile-quick-action">
            <i className="fa-solid fa-file-upload" />
            <span>上传简历</span>
          </button>
          <button className="mobile-quick-action">
            <i className="fa-solid fa-file-pen" />
            <span>输入 JD</span>
          </button>
          <button className="mobile-quick-action">
            <i className="fa-solid fa-sliders" />
            <span>权重设置</span>
          </button>
          <button className="mobile-quick-action">
            <i className="fa-solid fa-wand-magic-sparkles" />
            <span>智能匹配</span>
          </button>
        </div>
      </div>

      {/* 最近筛选 */}
      <div className="mobile-tab__section">
        <h3 className="mobile-tab__section-title">最近筛选</h3>
        <div className="mobile-recent-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="mobile-recent-item">
              <div className="mobile-recent-item__avatar">
                <i className="fa-solid fa-user" />
              </div>
              <div className="mobile-recent-item__info">
                <span className="mobile-recent-item__name">候选人 #{i}</span>
                  <span className="mobile-recent-item__match">匹配度 85%</span>
              </div>
              <div className="mobile-recent-item__score">
                <span className="mobile-recent-item__score-value">{90 - i * 5}%</span>
                <span className="mobile-recent-item__score-label">匹配</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ======== Search Tab ======== */
const SearchTab: React.FC = () => {
  return (
    <div className="mobile-tab">
      <div className="mobile-tab__header">
        <h2>搜索候选人</h2>
      </div>
      <div className="mobile-tab__empty">
        <i className="fa-solid fa-magnifying-glass" />
        <p>输入关键词搜索候选人简历</p>
      </div>
    </div>
  );
};

/* ======== Upload Tab ======== */
const UploadTab: React.FC = () => {
  return (
    <div className="mobile-tab">
      <div className="mobile-tab__header">
        <h2>上传简历</h2>
      </div>
      <div className="mobile-upload-zone">
        <i className="fa-solid fa-cloud-arrow-up" />
        <p>点击或拖拽上传简历</p>
        <span>支持 PDF, DOC, DOCX 格式</span>
      </div>
    </div>
  );
};

/* ======== Analysis Tab ======== */
const AnalysisTab: React.FC = () => {
  return (
    <div className="mobile-tab">
      <div className="mobile-tab__header">
        <h2>分析报告</h2>
      </div>
      <div className="mobile-chart-placeholder">
        <i className="fa-solid fa-chart-simple" />
        <p>分析图表展示区域</p>
      </div>
    </div>
  );
};

/* ======== Profile Tab ======== */
const ProfileTab: React.FC = () => {
  return (
    <div className="mobile-tab">
      <div className="mobile-profile">
        <div className="mobile-profile__avatar">
          <i className="fa-solid fa-user" />
        </div>
        <h3 className="mobile-profile__name">用户</h3>
        <p className="mobile-profile__email">user@example.com</p>
      </div>
      <div className="mobile-settings-list">
        <button className="mobile-settings-item">
          <i className="fa-solid fa-gear" />
          <span>设置</span>
          <i className="fa-solid fa-chevron-right" />
        </button>
        <button className="mobile-settings-item">
          <i className="fa-solid fa-question-circle" />
          <span>帮助与反馈</span>
          <i className="fa-solid fa-chevron-right" />
        </button>
        <button className="mobile-settings-item mobile-settings-item--danger">
          <i className="fa-solid fa-right-from-bracket" />
          <span>退出登录</span>
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>
  );
};

export default MobileAppView;

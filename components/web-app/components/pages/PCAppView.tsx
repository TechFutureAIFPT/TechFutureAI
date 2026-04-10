/**
 * PCAppView — PC 桌面应用视图示例
 * 展示如何在 PC 模式下渲染完整的桌面端 UI
 */
import React from 'react';
import './PCAppView.css';

export const PCAppView: React.FC = () => {
  return (
    <div className="pc-app-view pc-app-view--dark">
      {/* 顶部统计栏 */}
      <div className="pc-app-view__stats-bar">
        <div className="pc-stats-item">
          <i className="fa-solid fa-users" />
          <div className="pc-stats-item__info">
            <span className="pc-stats-item__value">128</span>
            <span className="pc-stats-item__label">候选人</span>
          </div>
        </div>
        <div className="pc-stats-item">
          <i className="fa-solid fa-check-circle" />
          <div className="pc-stats-item__info">
            <span className="pc-stats-item__value">45</span>
            <span className="pc-stats-item__label">已筛选</span>
          </div>
        </div>
        <div className="pc-stats-item">
          <i className="fa-solid fa-clock" />
          <div className="pc-stats-item__info">
            <span className="pc-stats-item__value">12</span>
            <span className="pc-stats-item__label">进行中</span>
          </div>
        </div>
        <div className="pc-stats-item">
          <i className="fa-solid fa-star" />
          <div className="pc-stats-item__info">
            <span className="pc-stats-item__value">8</span>
            <span className="pc-stats-item__label">优秀</span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="pc-app-view__main">
        {/* 左侧面板 */}
        <aside className="pc-app-view__sidebar">
          <div className="pc-sidebar-section">
            <h4 className="pc-sidebar-section__title">快速操作</h4>
            <button className="pc-sidebar-btn">
              <i className="fa-solid fa-file-arrow-up" />
              上传简历
            </button>
            <button className="pc-sidebar-btn">
              <i className="fa-solid fa-file-pen" />
              输入 JD
            </button>
            <button className="pc-sidebar-btn">
              <i className="fa-solid fa-sliders" />
              权重配置
            </button>
            <button className="pc-sidebar-btn">
              <i className="fa-solid fa-wand-magic-sparkles" />
              智能匹配
            </button>
          </div>

          <div className="pc-sidebar-section">
            <h4 className="pc-sidebar-section__title">筛选条件</h4>
            <div className="pc-filter-item">
              <span>经验要求</span>
              <select defaultValue="3">
                <option value="1">1 年+</option>
                <option value="3">3 年+</option>
                <option value="5">5 年+</option>
                <option value="10">10 年+</option>
              </select>
            </div>
            <div className="pc-filter-item">
              <span>学历要求</span>
              <select defaultValue="bachelor">
                <option value="highschool">高中</option>
                <option value="associate">大专</option>
                <option value="bachelor">本科</option>
                <option value="master">硕士</option>
                <option value="phd">博士</option>
              </select>
            </div>
            <div className="pc-filter-item">
              <span>薪资范围</span>
              <select defaultValue="all">
                <option value="all">不限</option>
                <option value="5k-10k">5K-10K</option>
                <option value="10k-20k">10K-20K</option>
                <option value="20k-50k">20K-50K</option>
                <option value="50k+">50K+</option>
              </select>
            </div>
          </div>
        </aside>

        {/* 中间内容 */}
        <main className="pc-app-view__content">
          {/* 搜索栏 */}
          <div className="pc-content-header">
            <div className="pc-search-box">
              <i className="fa-solid fa-magnifying-glass" />
              <input type="text" placeholder="搜索候选人姓名、职位、技能..." />
              <button className="pc-search-box__btn">
                <i className="fa-solid fa-filter" />
              </button>
            </div>
            <div className="pc-view-toggles">
              <button className="pc-view-toggle pc-view-toggle--active">
                <i className="fa-solid fa-list" />
              </button>
              <button className="pc-view-toggle">
                <i className="fa-solid fa-table-cells" />
              </button>
            </div>
          </div>

          {/* 候选人列表 */}
          <div className="pc-candidate-list">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="pc-candidate-card">
                <div className="pc-candidate-card__header">
                  <div className="pc-candidate-card__avatar">
                    <i className="fa-solid fa-user" />
                  </div>
                  <div className="pc-candidate-card__basic">
                    <h4 className="pc-candidate-card__name">候选人 #{i}</h4>
                    <p className="pc-candidate-card__title">高级前端工程师</p>
                    <p className="pc-candidate-card__meta">
                      <span><i className="fa-solid fa-briefcase" /> 5 年经验</span>
                      <span><i className="fa-solid fa-graduation-cap" /> 本科</span>
                      <span><i className="fa-solid fa-location-dot" /> 北京</span>
                    </p>
                  </div>
                  <div className="pc-candidate-card__score">
                    <div className="pc-score-ring" style={{ '--score': `${90 - i * 5}` } as React.CSSProperties}>
                      <span>{90 - i * 5}%</span>
                    </div>
                    <span className="pc-candidate-card__match-label">匹配度</span>
                  </div>
                </div>
                <div className="pc-candidate-card__skills">
                  <span className="pc-skill-tag">React</span>
                  <span className="pc-skill-tag">TypeScript</span>
                  <span className="pc-skill-tag">Node.js</span>
                  <span className="pc-skill-tag">AWS</span>
                  <span className="pc-skill-tag pc-skill-tag--more">+3</span>
                </div>
                <div className="pc-candidate-card__actions">
                  <button className="pc-action-btn pc-action-btn--primary">
                    <i className="fa-solid fa-eye" />
                    查看详情
                  </button>
                  <button className="pc-action-btn">
                    <i className="fa-solid fa-envelope" />
                    邀请面试
                  </button>
                  <button className="pc-action-btn">
                    <i className="fa-solid fa-ellipsis" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 右侧面板 */}
        <aside className="pc-app-view__aside">
          <div className="pc-aside-section">
            <h4 className="pc-aside-section__title">匹配趋势</h4>
            <div className="pc-chart-placeholder">
              <i className="fa-solid fa-chart-line" />
              <p>匹配度趋势图</p>
            </div>
          </div>

          <div className="pc-aside-section">
            <h4 className="pc-aside-section__title">热门技能</h4>
            <div className="pc-skill-list">
              <div className="pc-skill-item">
                <span className="pc-skill-item__name">React</span>
                <div className="pc-skill-item__bar">
                  <div className="pc-skill-item__fill" style={{ width: '85%' }} />
                </div>
                <span className="pc-skill-item__count">85</span>
              </div>
              <div className="pc-skill-item">
                <span className="pc-skill-item__name">TypeScript</span>
                <div className="pc-skill-item__bar">
                  <div className="pc-skill-item__fill" style={{ width: '72%' }} />
                </div>
                <span className="pc-skill-item__count">72</span>
              </div>
              <div className="pc-skill-item">
                <span className="pc-skill-item__name">Node.js</span>
                <div className="pc-skill-item__bar">
                  <div className="pc-skill-item__fill" style={{ width: '68%' }} />
                </div>
                <span className="pc-skill-item__count">68</span>
              </div>
              <div className="pc-skill-item">
                <span className="pc-skill-item__name">Python</span>
                <div className="pc-skill-item__bar">
                  <div className="pc-skill-item__fill" style={{ width: '55%' }} />
                </div>
                <span className="pc-skill-item__count">55</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PCAppView;

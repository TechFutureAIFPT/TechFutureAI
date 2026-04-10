import React, { useState } from 'react';

export interface JDTemplate {
  id: string;
  name: string;
  category: string;
  jobPosition: string;
  jdText: string;
  hardFilters: any; 
}

const defaultTemplates: JDTemplate[] = [
  {
    id: 'frontend-dev',
    name: 'Frontend Developer (React)',
    category: 'IT/Software',
    jobPosition: 'Frontend Developer',
    jdText: `- Phát triển các ứng dụng web phức tạp sử dụng React.js, TypeScript.\n- Tối ưu hóa hiệu năng ứng dụng, đảm bảo trải nghiệm người dùng mượt mà.\n- Phối hợp với team Backend để tích hợp APIs.\n- Viết unit test và UI test.\n- Tham gia review code và đưa ra các giải pháp kỹ thuật.`,
    hardFilters: {
      location: 'Hà Nội',
      minExp: '2',
      seniority: 'Mid-level',
      education: 'Cử nhân CNTT',
      industry: 'IT',
      language: 'Tiếng Anh',
      languageLevel: 'Đọc hiểu tài liệu',
      certificates: '',
      salaryMin: '15000000',
      salaryMax: '30000000',
      workFormat: 'Hybrid',
      contractType: 'Full-time',
      locationMandatory: true,
      minExpMandatory: true,
      seniorityMandatory: true,
      educationMandatory: false,
      industryMandatory: true,
      languageMandatory: false,
      certificatesMandatory: false,
      salaryMandatory: false,
      workFormatMandatory: false,
      contractTypeMandatory: false,
      contactMandatory: false
    }
  },
  {
    id: 'backend-dev',
    name: 'Backend Developer (Node.js)',
    category: 'IT/Software',
    jobPosition: 'Backend Developer',
    jdText: `- Xây dựng và duy trì các RESTful APIs và GraphQL endpoints sử dụng Node.js/Express.\n- Thiết kế schema cơ sở dữ liệu (PostgreSQL/MongoDB).\n- Đảm bảo an ninh mật, hiệu năng và khả năng mở rộng của hệ thống.\n- Tích hợp với các dịch vụ của bên thứ ba (AWS, GCP).\n- Tối ưu hóa truy vấn cơ sở dữ liệu.`,
    hardFilters: {
      location: 'Hồ Chí Minh',
      minExp: '3',
      seniority: 'Senior',
      education: 'Cử nhân CNTT',
      industry: 'IT',
      language: 'Tiếng Anh',
      languageLevel: 'Giao tiếp khá',
      certificates: 'AWS Cloud Practitioner',
      salaryMin: '25000000',
      salaryMax: '45000000',
      workFormat: 'Remote',
      contractType: 'Full-time',
      locationMandatory: false,
      minExpMandatory: true,
      seniorityMandatory: true,
      educationMandatory: false,
      industryMandatory: true,
      languageMandatory: true,
      certificatesMandatory: false,
      salaryMandatory: false,
      workFormatMandatory: false,
      contractTypeMandatory: false,
      contactMandatory: false
    }
  },
  {
    id: 'marketing-exec',
    name: 'Marketing Executive',
    category: 'Marketing',
    jobPosition: 'Marketing Executive',
    jdText: `- Lập kế hoạch và triển khai các chiến dịch digital marketing trên các kênh (Facebook, Google, TikTok).\n- Quản lý và tối ưu hóa ngân sách quảng cáo.\n- Theo dõi, phân tích và báo cáo hiệu quả các chiến dịch (ROI, ROAS).\n- Sáng tạo nội dung (content, hình ảnh, video cơ bản) cho các chiến dịch.\n- Phối hợp với team thiết kế và sale.`,
    hardFilters: {
      location: 'Hà Nội',
      minExp: '1',
      seniority: 'Junior',
      education: 'Cử nhân Đại học',
      industry: 'Marketing/Advertising',
      language: 'Tiếng Anh',
      languageLevel: 'Cơ bản',
      certificates: 'Google Ads Certification',
      salaryMin: '10000000',
      salaryMax: '15000000',
      workFormat: 'Office',
      contractType: 'Full-time',
      locationMandatory: true,
      minExpMandatory: false,
      seniorityMandatory: false,
      educationMandatory: true,
      industryMandatory: true,
      languageMandatory: false,
      certificatesMandatory: false,
      salaryMandatory: false,
      workFormatMandatory: true,
      contractTypeMandatory: true,
      contactMandatory: false
    }
  }
];

interface JDTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: JDTemplate) => void;
}

const JDTemplatesModal: React.FC<JDTemplatesModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(defaultTemplates.map(t => t.category)))];

  const filteredTemplates = defaultTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          template.jobPosition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-[#0B1120] backdrop-blur-xl border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-blue-900/20 pointer-events-auto transform transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <i className="fa-solid fa-file-invoice text-blue-400"></i>
              </div>
              Mẫu JD (Job Description)
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 flex-shrink-0">
             <div className="relative flex-1">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm mẫu JD..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
             </div>
             <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                      selectedCategory === category 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                        : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
             </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
             {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => (
                    <div 
                      key={template.id}
                      className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group space-y-3"
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors line-clamp-1">{template.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap ml-2">
                          {template.category}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {template.jdText}
                      </div>

                      <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[10px] text-slate-500">
                           <i className="fa-solid fa-filter"></i>
                           <span>Đã thiết lập bộ lọc</span>
                         </div>
                         <button className="text-xs text-blue-400 font-medium group-hover:underline flex items-center gap-1">
                           Sử dụng <i className="fa-solid fa-arrow-right text-[10px]"></i>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                   <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-2xl">
                     <i className="fa-solid fa-box-open"></i>
                   </div>
                   <p>Không tìm thấy mẫu JD nào phù hợp.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
};

export default JDTemplatesModal;

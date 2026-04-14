import React from 'react';
import { MapPin, Clock, Layers, Building, FileText, GraduationCap, Award, Coins, ToggleLeft as ToggleIcon, Wifi, FileSignature, Sparkles } from 'lucide-react';
import type { HardFilters } from '../../../assets/types';

interface HardFilterPanelProps {
    hardFilters: HardFilters;
    setHardFilters: React.Dispatch<React.SetStateAction<HardFilters>>;
}

type MandatoryKey = Extract<keyof HardFilters, `${string}Mandatory`>;
type ValueKey = Exclude<keyof HardFilters, MandatoryKey>;

const HardFilterPanel: React.FC<HardFilterPanelProps> = ({ hardFilters, setHardFilters }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setHardFilters((prev) => ({ ...prev, [id]: value }));
    };

    const handleMandatoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        setHardFilters((prev) => ({ ...prev, [id]: checked }));
    };

    const hasValue = (val: unknown) => {
        if (typeof val === 'string') return val.trim().length > 0;
        return Boolean(val);
    };

    const inputClasses = (isMandatory: boolean, valuePresent: boolean) =>
        `w-full border backdrop-blur-sm rounded-xl px-4 py-3 text-xs placeholder-slate-500/70 transition-all duration-300 focus:outline-none focus:ring-4 appearance-none shadow-inner ${
            isMandatory
                ? valuePresent
                    ? 'bg-[#0A0F1C]/80 border-indigo-500/40 hover:border-indigo-400 focus:border-indigo-400 focus:ring-indigo-500/10 text-slate-200'
                    : 'bg-[#0A0F1C]/80 border-rose-500/40 bg-rose-500/5 hover:border-rose-500 focus:border-rose-400 focus:ring-rose-500/10 text-slate-200'
                : 'bg-[#0A0F1C]/80 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-slate-200'
        }`;

    const selectFieldConfigs: Array<{
        id: ValueKey;
        label: string;
        placeholder: string;
        mandatoryKey: MandatoryKey;
        icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        color: string;
        colorBg: string;
        options: { value: string; label: string }[];
    }> = [
        {
            id: 'location',
            label: 'Địa điểm',
            placeholder: 'Chọn địa điểm',
            mandatoryKey: 'locationMandatory',
            icon: MapPin,
            color: '#6366f1',
            colorBg: 'indigo',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Hà Nội', label: 'Hà Nội' },
                { value: 'Hải Phòng', label: 'Hải Phòng' },
                { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                { value: 'Thành phố Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
                { value: 'Remote', label: 'Remote / Từ xa' },
            ],
        },
        {
            id: 'minExp',
            label: 'Kinh nghiệm tối thiểu',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'minExpMandatory',
            icon: Clock,
            color: '#8b5cf6',
            colorBg: 'violet',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: '1', label: '1 năm' },
                { value: '2', label: '2 năm' },
                { value: '3', label: '3 năm' },
                { value: '5', label: '5 năm' },
            ],
        },
        {
            id: 'seniority',
            label: 'Cấp bậc',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'seniorityMandatory',
            icon: Layers,
            color: '#60a5fa',  // tokens.dark.primary (thống nhất cyan → blue)
            colorBg: 'cyan',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Intern', label: 'Intern' },
                { value: 'Junior', label: 'Junior' },
                { value: 'Mid-level', label: 'Mid-level' },
                { value: 'Senior', label: 'Senior' },
                { value: 'Lead', label: 'Lead / Quản lý' },
            ],
        },
        {
            id: 'workFormat',
            label: 'Hình thức làm việc',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'workFormatMandatory',
            icon: Building,
            color: '#3b82f6',
            colorBg: 'blue',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Onsite', label: 'Onsite' },
                { value: 'Hybrid', label: 'Hybrid' },
                { value: 'Remote', label: 'Remote' },
            ],
        },
        {
            id: 'contractType',
            label: 'Loại hợp đồng',
            placeholder: 'Không yêu cầu',
            mandatoryKey: 'contractTypeMandatory',
            icon: FileSignature,
            color: '#10b981',
            colorBg: 'emerald',
            options: [
                { value: '', label: 'Không yêu cầu' },
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Intern', label: 'Intern' },
                { value: 'Contract', label: 'Hợp đồng' },
            ],
        },
    ];

    const renderToggle = (id: string, isChecked: boolean, label: string = 'Bắt buộc') => (
        <div className="flex items-center gap-2">
            <label htmlFor={id} className={`text-[10px] font-bold tracking-[0.15em] cursor-pointer transition-colors duration-300 ${isChecked ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}>
                {label}
            </label>
            <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in group">
                <input
                    type="checkbox"
                    id={id}
                    checked={isChecked}
                    onChange={handleMandatoryChange}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out border-transparent top-0.5 shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
                    style={{
                        transform: isChecked ? 'translateX(100%)' : 'translateX(0)',
                        zIndex: 10,
                        left: isChecked ? '-2px' : '2px',
                        boxShadow: isChecked ? `0 0 12px ${isChecked ? 'rgba(99,102,241,0.7)' : ''}` : ''
                    }}
                />
                <label
                    htmlFor={id}
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-all duration-300 ease-in-out border ${isChecked ? 'bg-indigo-500/80 border-indigo-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' : 'bg-slate-800 border-slate-700 group-hover:bg-slate-700'}`}
                />
            </div>
        </div>
    );

    const renderCompactField = (config: (typeof selectFieldConfigs)[number]) => {
        const isMandatory = hardFilters[config.mandatoryKey];
        const hasCurrentValue = hasValue(hardFilters[config.id]);
        const Icon = config.icon;

        return (
            <div key={config.id} className={`relative isolate flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                isMandatory
                ? 'border-indigo-500/40 bg-indigo-950/20 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 hover:bg-indigo-950/30'
                : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-lg'
            }`}>
                {isMandatory && (
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-20 h-20 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-50 group-hover:opacity-100" style={{ background: `${config.color}20` }} />
                )}
                {isMandatory && (
                    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-70" />
                )}

                <div className="flex items-center justify-between z-10">
                    <label htmlFor={config.id} className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                            isMandatory
                            ? `bg-${config.colorBg}-500/15 text-${config.colorBg}-400 border-${config.colorBg}-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-inset`
                            : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 ring-1 ring-inset ring-slate-700/50'
                        }`}
                        style={isMandatory ? { background: `${config.color}15`, borderColor: `${config.color}30`, color: config.color, boxShadow: `0 0 12px ${config.color}15`, border: `1px solid ${config.color}30` } : {}}>
                            <Icon className="text-xs" />
                        </div>
                        {config.label}
                    </label>
                    {renderToggle(config.mandatoryKey, Boolean(isMandatory))}
                </div>

                <div className="relative z-10 w-full">
                    <select
                        id={config.id}
                        value={String(hardFilters[config.id] ?? '')}
                        onChange={handleChange}
                        className={inputClasses(Boolean(isMandatory), hasCurrentValue)}
                    >
                        {config.options.map((option) => (
                            <option key={option.value ?? option.label} value={option.value} className="bg-slate-900 text-slate-200">
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 flex items-center justify-center rounded bg-slate-800/60">
                        <i className="fa-solid fa-chevron-down text-[9px] text-slate-400" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-10 w-full animate-fade-in">

            {/* Elegant Header Card */}
            <div className="relative overflow-hidden flex items-start gap-4 p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 shadow-xl shadow-indigo-500/5">
                <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-6 w-40 h-40 bg-violet-500/8 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="mt-0.5">
                        <h4 className="text-[14px] font-bold text-white mb-1.5 tracking-wide flex items-center gap-2">
                           Bộ lọc cứng (Hard Filters)
                           <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-[9px] text-indigo-300 border border-indigo-500/30 uppercase tracking-widest font-bold shadow-lg">Quan trọng</span>
                        </h4>
                        <p className="text-[12px] text-slate-400 leading-relaxed max-w-2xl">
                           Thiết lập các điều kiện tiên quyết. Hồ sơ không đáp ứng các tiêu chí được chọn là <span className="text-indigo-400 font-semibold">Bắt buộc</span> sẽ bị AI từ chối tự động.
                        </p>
                    </div>
                </div>
            </div>

            {/* Group 1: Basic Info */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Điều kiện cơ bản</h5>
                        <p className="text-[10px] text-slate-600 mt-0.5">Thông tin tuyển dụng cơ bản</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-slate-800/30 ml-2" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectFieldConfigs.map((config) => renderCompactField(config))}
                </div>
            </div>

            {/* Group 2: Context & Quality */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                        <Award className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Chuyên môn & Yêu cầu</h5>
                        <p className="text-[10px] text-slate-600 mt-0.5">Kỹ năng, bằng cấp và chứng chỉ</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-slate-800/30 ml-2" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Industry */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                        hardFilters.industryMandatory
                        ? 'border-indigo-500/40 bg-indigo-950/20 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 hover:bg-indigo-950/30'
                        : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-lg'
                    }`}>
                        {hardFilters.industryMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="industry" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.industryMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 ring-1 ring-inset ring-slate-700/50'
                                }`}>
                                    <i className="fa-solid fa-industry text-xs"></i>
                                </div>
                                Ngành nghề
                            </label>
                            {renderToggle('industryMandatory', Boolean(hardFilters.industryMandatory))}
                        </div>
                        <input
                            type="text"
                            id="industry"
                            value={hardFilters.industry}
                            onChange={handleChange}
                            placeholder="Ví dụ: Fintech, SaaS, E-commerce..."
                            className={inputClasses(hardFilters.industryMandatory, hasValue(hardFilters.industry))}
                        />
                    </div>

                    {/* Language */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                        hardFilters.languageMandatory
                        ? 'border-indigo-500/40 bg-indigo-950/20 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 hover:bg-indigo-950/30'
                        : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-lg'
                    }`}>
                        {hardFilters.languageMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="language" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.languageMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 ring-1 ring-inset ring-slate-700/50'
                                }`}>
                                    <i className="fa-solid fa-language text-xs"></i>
                                </div>
                                Ngôn ngữ
                            </label>
                            {renderToggle('languageMandatory', Boolean(hardFilters.languageMandatory))}
                        </div>
                        <div className="grid grid-cols-[1fr_90px] gap-2.5 relative z-10">
                            <input
                                type="text"
                                id="language"
                                value={hardFilters.language}
                                onChange={handleChange}
                                placeholder="Tên ngôn ngữ"
                                className={inputClasses(hardFilters.languageMandatory, hasValue(hardFilters.language))}
                            />
                            <div className="relative h-full">
                                <select
                                    id="languageLevel"
                                    value={hardFilters.languageLevel}
                                    onChange={handleChange}
                                    className={`${inputClasses(false, hasValue(hardFilters.languageLevel))} h-full pl-2 pr-6 text-[11px]`}
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">Độ</option>
                                    <option value="B1" className="bg-slate-900 text-slate-200">B1</option>
                                    <option value="B2" className="bg-slate-900 text-slate-200">B2</option>
                                    <option value="C1" className="bg-slate-900 text-slate-200">C1</option>
                                    <option value="C2" className="bg-slate-900 text-slate-200">C2</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 flex items-center justify-center rounded bg-slate-800/50">
                                    <i className="fa-solid fa-chevron-down text-[9px] text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Education */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                        hardFilters.educationMandatory
                        ? 'border-indigo-500/40 bg-indigo-950/20 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 hover:bg-indigo-950/30'
                        : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-lg'
                    }`}>
                        {hardFilters.educationMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="education" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.educationMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 ring-1 ring-inset ring-slate-700/50'
                                }`}>
                                    <GraduationCap className="text-xs" />
                                </div>
                                Học vấn / Bằng cấp
                            </label>
                            {renderToggle('educationMandatory', Boolean(hardFilters.educationMandatory))}
                        </div>
                        <div className="relative z-10">
                            <select
                                id="education"
                                value={hardFilters.education}
                                onChange={handleChange}
                                className={inputClasses(hardFilters.educationMandatory, hasValue(hardFilters.education))}
                            >
                                <option value="" className="bg-slate-900 text-slate-400">Không yêu cầu</option>
                                <option value="High School" className="bg-slate-900">Tốt nghiệp THPT</option>
                                <option value="Associate" className="bg-slate-900">Cao đẳng</option>
                                <option value="Bachelor" className="bg-slate-900">Cử nhân</option>
                                <option value="Master" className="bg-slate-900">Thạc sĩ</option>
                                <option value="PhD" className="bg-slate-900">Tiến sĩ</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 flex items-center justify-center rounded bg-slate-800/50">
                                <i className="fa-solid fa-chevron-down text-[9px] text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Certificates */}
                    <div className={`relative isolate flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                        hardFilters.certificatesMandatory
                        ? 'border-indigo-500/40 bg-indigo-950/20 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 hover:bg-indigo-950/30'
                        : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-lg'
                    }`}>
                        {hardFilters.certificatesMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />}
                        <div className="flex items-center justify-between z-10">
                            <label htmlFor="certificates" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                                    hardFilters.certificatesMandatory
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 ring-1 ring-inset ring-slate-700/50'
                                }`}>
                                    <Award className="text-xs" />
                                </div>
                                Chứng chỉ / Certificates
                            </label>
                            {renderToggle('certificatesMandatory', Boolean(hardFilters.certificatesMandatory))}
                        </div>
                        <input
                            type="text"
                            id="certificates"
                            value={hardFilters.certificates}
                            onChange={handleChange}
                            placeholder="Ví dụ: PMP, AWS, IELTS..."
                            className={inputClasses(hardFilters.certificatesMandatory, hasValue(hardFilters.certificates))}
                        />
                    </div>
                </div>
            </div>

            {/* Group 3: Salary */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Mức lương kỳ vọng</h5>
                        <p className="text-[10px] text-slate-600 mt-0.5">Khoảng lương mong muốn của ứng viên</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-slate-800/30 ml-2" />
                </div>
                <div className={`relative isolate flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                    hardFilters.salaryMandatory
                    ? 'border-amber-500/40 bg-amber-950/15 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.1)] hover:border-amber-400/60 hover:bg-amber-950/20'
                    : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-lg'
                }`}>
                     {hardFilters.salaryMandatory && <div className="absolute top-0 right-0 -mr-8 -mt-8 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.1)' }} />}
                     {hardFilters.salaryMandatory && <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-amber-500 to-orange-500 opacity-70" />}

                     <div className="flex items-center justify-between z-10 flex-col sm:flex-row gap-3">
                        <label htmlFor="salary" className="text-[12px] font-bold tracking-wide flex items-center gap-2.5 text-slate-200">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                                hardFilters.salaryMandatory
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 ring-1 ring-inset ring-slate-700/50'
                            }`}>
                                <Coins className="text-xs" />
                            </div>
                            Khoảng lương (VNĐ)
                        </label>
                        {renderToggle('salaryMandatory', Boolean(hardFilters.salaryMandatory))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 relative z-10">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Từ</span>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-xs">₫</span>
                                <input
                                    type="number"
                                    id="salaryMin"
                                    value={hardFilters.salaryMin || ''}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className={`${inputClasses(hardFilters.salaryMandatory, hasValue(hardFilters.salaryMin))} pl-8`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Đến</span>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-xs">₫</span>
                                <input
                                    type="number"
                                    id="salaryMax"
                                    value={hardFilters.salaryMax || ''}
                                    onChange={handleChange}
                                    placeholder="Không giới hạn"
                                    className={`${inputClasses(hardFilters.salaryMandatory, hasValue(hardFilters.salaryMax))} pl-8`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HardFilterPanel;

export type NavLink =
  | { label: string; target: string }
  | { label: string; href: string }
  | {
      label: string;
      type?: "history" | "support";
      megaMenu: {
        highlight: {
          title: string;
          desc: string;
          icon: string;
          action?: {
            label: string;
            target?: string;
            href?: string;
            isStart?: boolean;
          };
        };
        items: {
          label: string;
          desc?: string;
          icon: string;
          target?: string;
          href?: string;
        }[];
      };
    }
  | {
      label: string;
      type: "history";
      megaMenu: {
        highlight: {
          title: string;
          desc: string;
          icon: string;
        };
      };
    };

export const primaryNavLinks: NavLink[] = [
  {
    label: "Features",
    megaMenu: {
      highlight: {
        title: "AI-Powered Screening",
        desc: "Optimize your hiring process with our advanced AI tools and structured workflow.",
        icon: "fa-solid fa-rocket",
      },
      items: [
        {
          label: "AI CV Analysis",
          desc: "Phân tích & xếp hạng CV tự động.",
          icon: "fa-solid fa-magnifying-glass-chart",
          target: "features",
        },
        {
          label: "Resume Builder",
          desc: "Tạo CV chuẩn ATS chuyên nghiệp.",
          icon: "fa-solid fa-pen-nib",
          target: "features",
        },
        {
          label: "Job Matching",
          desc: "Tìm kiếm ứng viên phù hợp nhất.",
          icon: "fa-solid fa-bullseye",
          target: "features",
        },
        {
          label: "AI Analytics",
          desc: "Bảng điểm & gợi ý phỏng vấn chuyên sâu.",
          icon: "fa-solid fa-square-poll-vertical",
          target: "steps",
        },
      ],
    },
  },
  {
    label: "Solutions",
    megaMenu: {
      highlight: {
        title: "Tailored Solutions",
        desc: "Discover how SupportHR transforms recruitment for every stakeholder.",
        icon: "fa-solid fa-lightbulb",
      },
      items: [
        {
          label: "For Candidates",
          desc: "Tối ưu hồ sơ & tìm việc thông minh.",
          icon: "fa-solid fa-user-graduate",
          target: "hero",
        },
        {
          label: "For Enterprise",
          desc: "Quy trình tuyển dụng tinh gọn, hiệu quả.",
          icon: "fa-solid fa-building-briefcase",
          target: "partners",
        },
        {
          label: "Why SupportHR",
          desc: "Lý do chúng tôi vượt trội trên thị trường.",
          icon: "fa-solid fa-award",
          target: "why-support-hr",
        },
        {
          label: "Compare Platforms",
          desc: "So sánh chi tiết với các nền tảng khác.",
          icon: "fa-solid fa-code-compare",
          target: "compare",
        },
      ],
    },
  },
  {
    label: "Tools",
    megaMenu: {
      highlight: {
        title: "TechFuture Tools",
        desc: "Hệ sinh thái công cụ thông minh cho quy trình làm việc hiện đại.",
        icon: "fa-solid fa-screwdriver-wrench",
      },
      items: [
        {
          label: "Lọc CV Gia sư",
          desc: "Phần Mềm Hỗ Trợ Tuyển Dụng",
          icon: "fa-solid fa-user-graduate",
          href: "https://turbondcv.vercel.app/",
        },
        {
          label: "Database & Phân Loại Rác",
          desc: "Phần Mềm Khác",
          icon: "fa-solid fa-dumpster",
          href: "https://tf-greeneye1.netlify.app/",
        },
      ],
    },
  },
  {
    label: "Pricing",
    megaMenu: {
      highlight: {
        title: "Bảng giá",
        desc: "Dùng thử miễn phí và các gói trả phí linh hoạt cho mọi nhu cầu.",
        icon: "fa-solid fa-tags",
      },
      items: [
        {
          label: "BASIC",
          desc: "$39 / tháng · 300CV",
          icon: "fa-solid fa-leaf",
          target: "pricing",
        },
        {
          label: "STANDARD",
          desc: "$99 / tháng · 1000CV",
          icon: "fa-solid fa-tree",
          target: "pricing",
        },
        {
          label: "PREMIUM",
          desc: "$249 / tháng · 5000CV",
          icon: "fa-solid fa-crown",
          target: "pricing",
        },
        {
          label: "ENTERPRISE",
          desc: "$599 / tháng · 20000CV",
          icon: "fa-solid fa-building",
          target: "pricing",
        },
      ],
    },
  },
];

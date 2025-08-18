/**
 * 简历隐私过滤器 - 过滤敏感个人信息
 */

interface FilteredResumeContent {
  filteredText: string;
  removedFields: string[];
  sensitiveInfo: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasAddress: boolean;
    hasIdNumber: boolean;
  };
}

export class PrivacyFilter {
  // 敏感信息正则表达式
  private static readonly PATTERNS = {
    // 手机号码 (各种格式)
    phone: [
      /1[3-9]\d{9}/g,                           // 中国手机号
      /\+86\s*1[3-9]\d{9}/g,                    // +86格式
      /\d{3}-\d{3}-\d{4}/g,                     // 美国格式
      /\d{3}\s\d{3}\s\d{4}/g,                   // 空格分隔
      /\(\d{3}\)\s?\d{3}-?\d{4}/g,              // (xxx) xxx-xxxx
    ],
    
    // 邮箱地址
    email: [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    ],
    
    // 身份证号
    idNumber: [
      /\d{15}|\d{18}/g,                         // 15或18位数字
      /\d{17}[0-9Xx]/g,                         // 18位身份证
    ],
    
    // 详细地址
    address: [
      /[省市区县][^\s]{2,20}[市区县][^\s]{2,20}[路街道][^\s]{1,30}[号栋单元室]/g,
      /\d{6}\s*[省市区县][^\s]{2,15}/g,          // 邮编+地址
    ],
    
    // 银行卡号
    bankCard: [
      /\d{16,19}/g,                             // 16-19位银行卡号
    ],
    
    // QQ号/微信号
    socialAccount: [
      /[QQ|qq][:：\s]*\d{5,12}/g,
      /[微信|wechat|WeChat][:：\s]*[a-zA-Z0-9_-]{6,20}/g,
    ]
  };

  /**
   * 过滤简历中的敏感信息
   */
  static filterResumeContent(content: string): FilteredResumeContent {
    let filteredText = content;
    const removedFields: string[] = [];
    const sensitiveInfo = {
      hasPhone: false,
      hasEmail: false,
      hasAddress: false,
      hasIdNumber: false,
    };

    // 过滤手机号
    this.PATTERNS.phone.forEach(pattern => {
      if (pattern.test(filteredText)) {
        sensitiveInfo.hasPhone = true;
        filteredText = filteredText.replace(pattern, '[手机号已隐藏]');
        if (!removedFields.includes('phone')) removedFields.push('phone');
      }
    });

    // 过滤邮箱 (保留域名用于技术分析)
    this.PATTERNS.email.forEach(pattern => {
      const matches = filteredText.match(pattern);
      if (matches) {
        sensitiveInfo.hasEmail = true;
        matches.forEach(email => {
          const domain = email.split('@')[1];
          filteredText = filteredText.replace(email, `[邮箱@${domain}]`);
        });
        if (!removedFields.includes('email')) removedFields.push('email');
      }
    });

    // 过滤身份证号
    this.PATTERNS.idNumber.forEach(pattern => {
      if (pattern.test(filteredText)) {
        sensitiveInfo.hasIdNumber = true;
        filteredText = filteredText.replace(pattern, '[身份证号已隐藏]');
        if (!removedFields.includes('idNumber')) removedFields.push('idNumber');
      }
    });

    // 过滤详细地址 (保留城市信息)
    this.PATTERNS.address.forEach(pattern => {
      const matches = filteredText.match(pattern);
      if (matches) {
        sensitiveInfo.hasAddress = true;
        matches.forEach(addr => {
          // 提取城市信息保留
          const cityMatch = addr.match(/([省市区县][^\s]{2,10}[市区县])/);
          const city = cityMatch ? cityMatch[1] : '[城市]';
          filteredText = filteredText.replace(addr, `${city}[详细地址已隐藏]`);
        });
        if (!removedFields.includes('address')) removedFields.push('address');
      }
    });

    // 过滤银行卡号
    this.PATTERNS.bankCard.forEach(pattern => {
      if (pattern.test(filteredText)) {
        filteredText = filteredText.replace(pattern, '[银行卡号已隐藏]');
        if (!removedFields.includes('bankCard')) removedFields.push('bankCard');
      }
    });

    // 过滤社交账号
    this.PATTERNS.socialAccount.forEach(pattern => {
      if (pattern.test(filteredText)) {
        filteredText = filteredText.replace(pattern, '[社交账号已隐藏]');
        if (!removedFields.includes('socialAccount')) removedFields.push('socialAccount');
      }
    });

    return {
      filteredText,
      removedFields,
      sensitiveInfo
    };
  }

  /**
   * 检查文本是否包含敏感信息
   */
  static hasSensitiveInfo(content: string): boolean {
    for (const patternGroup of Object.values(this.PATTERNS)) {
      for (const pattern of patternGroup) {
        if (pattern.test(content)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 提取保留的有用信息
   */
  static extractUsefulInfo(content: string): {
    educationInfo: string[];
    workExperience: string[];
    skills: string[];
    projectKeywords: string[];
  } {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    const educationKeywords = ['大学', '学院', '专业', '学历', '本科', '硕士', '博士', '毕业'];
    const workKeywords = ['公司', '工作', '职位', '经验', '年', '开发', '负责'];
    const skillKeywords = ['技能', '熟悉', '精通', '掌握', '了解', '使用'];
    const projectKeywords = ['项目', '系统', '平台', '开发', '设计', '实现'];

    const educationInfo = lines.filter(line => 
      educationKeywords.some(keyword => line.includes(keyword))
    );

    const workExperience = lines.filter(line =>
      workKeywords.some(keyword => line.includes(keyword))
    );

    const skills = lines.filter(line =>
      skillKeywords.some(keyword => line.includes(keyword))
    );

    const projects = lines.filter(line =>
      projectKeywords.some(keyword => line.includes(keyword))
    );

    return {
      educationInfo,
      workExperience,
      skills,
      projectKeywords: projects
    };
  }
}

/**
 * 简历文本预处理 - 为AI分析准备数据
 */
export class ResumePreprocessor {
  /**
   * 预处理简历文本，去除敏感信息并结构化
   */
  static preprocessForAI(content: string): {
    processedContent: string;
    metadata: {
      originalLength: number;
      filteredLength: number;
      removedFields: string[];
      hasContactInfo: boolean;
    };
  } {
    const originalLength = content.length;
    
    // 过滤敏感信息
    const filtered = PrivacyFilter.filterResumeContent(content);
    
    // 结构化处理
    const structuredContent = this.structureContent(filtered.filteredText);
    
    return {
      processedContent: structuredContent,
      metadata: {
        originalLength,
        filteredLength: filtered.filteredText.length,
        removedFields: filtered.removedFields,
        hasContactInfo: filtered.sensitiveInfo.hasPhone || filtered.sensitiveInfo.hasEmail
      }
    };
  }

  /**
   * 结构化简历内容，添加标记便于AI理解
   */
  private static structureContent(content: string): string {
    let structured = content;
    
    // 添加结构标记
    const sections = [
      { keyword: ['基本信息', '个人信息'], tag: '[PERSONAL_INFO]' },
      { keyword: ['教育经历', '教育背景'], tag: '[EDUCATION]' },
      { keyword: ['工作经历', '工作经验'], tag: '[WORK_EXPERIENCE]' },
      { keyword: ['项目经历', '项目经验'], tag: '[PROJECTS]' },
      { keyword: ['技能', '专业技能'], tag: '[SKILLS]' },
      { keyword: ['自我评价', '个人评价'], tag: '[SELF_EVALUATION]' }
    ];

    sections.forEach(section => {
      section.keyword.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        structured = structured.replace(regex, `${section.tag} $1`);
      });
    });

    return structured;
  }
}
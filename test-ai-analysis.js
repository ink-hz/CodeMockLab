// 测试AI简历分析功能
const fs = require('fs');
const path = require('path');

async function testAIAnalysis() {
  console.log("=== 测试AI简历分析功能 ===");

  // 创建一个模拟的简历文本
  const mockResumeText = `
    张三 - 高级前端工程师
    
    联系方式：
    邮箱：zhangsan@email.com
    
    工作经验：
    2022-2024 字节跳动 前端开发工程师
    - 负责抖音前端核心功能开发，使用React和TypeScript
    - 主导前端架构优化，性能提升30%
    - 团队技术分享和新人指导
    
    2020-2022 腾讯 前端工程师
    - 微信小程序开发，使用Vue.js和Node.js
    - 参与微信支付前端重构项目
    
    项目经验：
    1. 短视频推荐系统前端 (2023)
       - 技术栈：React, TypeScript, Redux, Webpack
       - 负责推荐算法可视化和用户交互优化
       - 日活用户超过1000万
    
    2. 实时聊天系统 (2022)
       - 技术栈：Vue.js, Socket.io, Node.js, MongoDB
       - 支持百万级并发用户
       - 实现消息推送和实时通知
    
    3. 电商后台管理系统 (2021)
       - 技术栈：Angular, Spring Boot, MySQL
       - 商品管理、订单处理、数据分析
    
    技能：
    - 前端：React, Vue, Angular, TypeScript, JavaScript
    - 后端：Node.js, Spring Boot, Python
    - 数据库：MySQL, MongoDB, Redis
    - 工具：Git, Docker, Jenkins, Webpack
    
    教育背景：
    2016-2020 清华大学 计算机科学与技术 本科
  `;

  try {
    // 测试上传简历
    console.log("1. 测试简历上传和AI分析...");
    
    const formData = new FormData();
    const blob = new Blob([mockResumeText], { type: 'text/plain' });
    formData.append('file', blob, 'test-resume.txt');

    const uploadResponse = await fetch('http://localhost:3001/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'next-auth.session-token=test' // 需要实际的session token
      }
    });

    const uploadResult = await uploadResponse.json();
    console.log("上传结果:", uploadResult);

    if (uploadResult.success && uploadResult.data) {
      console.log("✅ 简历上传成功");
      console.log("基础分析:", uploadResult.data.basicAnalysis);
      console.log("AI分析:", uploadResult.data.aiAnalysis);

      // 如果有resumeId，获取详细AI分析
      if (uploadResult.data.resumeId) {
        console.log("\n2. 获取详细AI分析结果...");
        
        const aiProfileResponse = await fetch(`http://localhost:3001/api/resume/ai-profile/${uploadResult.data.resumeId}`, {
          headers: {
            'Cookie': 'next-auth.session-token=test'
          }
        });

        const aiProfileResult = await aiProfileResponse.json();
        console.log("详细AI分析:", aiProfileResult);

        if (aiProfileResult.success && aiProfileResult.data.hasAIProfile) {
          console.log("✅ AI分析完成");
          console.log("技术栈数量:", aiProfileResult.data.techStack.length);
          console.log("技术亮点:", aiProfileResult.data.techHighlights);
          console.log("专长领域:", aiProfileResult.data.specializations);
          console.log("经验等级:", aiProfileResult.data.experienceLevel);
        }
      }
    }

  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

// 如果直接运行这个文件
if (require.main === module) {
  console.log("注意：这个测试需要实际的用户session，建议通过浏览器测试");
  console.log("可以访问 http://localhost:3001/upload 进行测试");
}

module.exports = { testAIAnalysis };
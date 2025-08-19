-- 检查AI内置题库的50道题目状态
WITH ai_bank_questions AS (
  -- 从architectureDesign类别提取题目
  SELECT 
    jsonb_array_elements_text("simulatedInterview"->'architectureDesign') as question_content,
    'architectureDesign' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL 
    AND "simulatedInterview"->'architectureDesign' IS NOT NULL
  
  UNION ALL
  
  -- 从leadership类别提取题目  
  SELECT 
    jsonb_array_elements_text("simulatedInterview"->'leadership') as question_content,
    'leadership' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL 
    AND "simulatedInterview"->'leadership' IS NOT NULL
    
  UNION ALL
  
  -- 从techDepth的Kubernetes分支提取题目
  SELECT 
    jsonb_array_elements_text("simulatedInterview"->'techDepth'->'Kubernetes') as question_content,
    'techDepth-Kubernetes' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL 
    AND "simulatedInterview"->'techDepth'->'Kubernetes' IS NOT NULL
    
  UNION ALL
  
  -- 从techDepth的Flink分支提取题目
  SELECT 
    jsonb_array_elements_text("simulatedInterview"->'techDepth'->'Flink') as question_content,
    'techDepth-Flink' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL 
    AND "simulatedInterview"->'techDepth'->'Flink' IS NOT NULL
    
  UNION ALL
  
  -- 从techDepth的TensorFlow分支提取题目
  SELECT 
    jsonb_array_elements_text("simulatedInterview"->'techDepth'->'TensorFlow') as question_content,
    'techDepth-TensorFlow' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL 
    AND "simulatedInterview"->'techDepth'->'TensorFlow' IS NOT NULL
)

-- 统计结果
SELECT 
  abq.category,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN q."modelAnswer" IS NOT NULL AND q."modelAnswer" != '' THEN 1 END) as has_answer,
  COUNT(CASE WHEN q."modelAnswer" IS NULL OR q."modelAnswer" = '' THEN 1 END) as no_answer,
  ROUND(
    COUNT(CASE WHEN q."modelAnswer" IS NOT NULL AND q."modelAnswer" != '' THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as answer_coverage_percent
FROM ai_bank_questions abq
LEFT JOIN "Question" q ON q.content = abq.question_content
GROUP BY abq.category
ORDER BY abq.category;
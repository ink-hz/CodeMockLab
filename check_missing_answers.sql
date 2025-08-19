-- 查询AI内置题库中缺少最佳答案的问题
WITH ai_bank_questions AS (
  SELECT 
    jsonb_array_elements_text(
      CASE 
        WHEN jsonb_typeof("simulatedInterview"->'architectureDesign') = 'array' 
        THEN "simulatedInterview"->'architectureDesign' 
        ELSE '[]'::jsonb 
      END
    ) as question_content,
    'architectureDesign' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL
  
  UNION ALL
  
  SELECT 
    jsonb_array_elements_text(
      CASE 
        WHEN jsonb_typeof("simulatedInterview"->'techDepth'->'Kubernetes') = 'array' 
        THEN "simulatedInterview"->'techDepth'->'Kubernetes'
        ELSE '[]'::jsonb 
      END
    ) as question_content,
    'techDepth' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL
  
  UNION ALL
  
  SELECT 
    jsonb_array_elements_text(
      CASE 
        WHEN jsonb_typeof("simulatedInterview"->'techDepth'->'Flink') = 'array' 
        THEN "simulatedInterview"->'techDepth'->'Flink'
        ELSE '[]'::jsonb 
      END
    ) as question_content,
    'techDepth' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL
  
  UNION ALL
  
  SELECT 
    jsonb_array_elements_text(
      CASE 
        WHEN jsonb_typeof("simulatedInterview"->'techDepth'->'TensorFlow') = 'array' 
        THEN "simulatedInterview"->'techDepth'->'TensorFlow'
        ELSE '[]'::jsonb 
      END
    ) as question_content,
    'techDepth' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL
  
  UNION ALL
  
  SELECT 
    jsonb_array_elements_text(
      CASE 
        WHEN jsonb_typeof("simulatedInterview"->'leadership') = 'array' 
        THEN "simulatedInterview"->'leadership'
        ELSE '[]'::jsonb 
      END
    ) as question_content,
    'leadership' as category
  FROM "ResumeAIProfile" 
  WHERE "simulatedInterview" IS NOT NULL
)
SELECT 
  abq.question_content,
  abq.category,
  CASE 
    WHEN q.id IS NULL THEN '❌ 无最佳答案'
    WHEN q."modelAnswer" IS NULL THEN '❌ 无最佳答案'
    ELSE '✅ 有最佳答案'
  END as answer_status
FROM ai_bank_questions abq
LEFT JOIN "Question" q ON q.content = abq.question_content AND q."modelAnswer" IS NOT NULL
WHERE q.id IS NULL OR q."modelAnswer" IS NULL
ORDER BY abq.category, abq.question_content;
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid tool types for input validation
const VALID_TOOL_TYPES = [
  'mental_health_assessment',
  'symptom_assessment',
  'ovulation_prediction',
  'sleep_analysis',
  'testosterone_analysis',
  'libido_analysis',
  'substance_analysis',
  'vision_analysis',
  'fitness_analysis',
  'health_assessment_analysis',
  'safe_medicines_check'
] as const;

// --- Rate Limiter (15 requests per minute - AI operations) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = { maxRequests: 15, windowMs: 60_000 };
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key)?.filter(t => now - t < RATE_LIMIT.windowMs) || [];
  if (timestamps.length >= RATE_LIMIT.maxRequests) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) { if (v.every(t => now - t >= RATE_LIMIT.windowMs)) rateLimitMap.delete(k); }
  }
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Verify JWT and get user claims
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub;
    console.log('Authenticated user:', authenticatedUserId);

    const { toolType, data } = await req.json();
    
    if (!toolType) {
      throw new Error('Tool type is required');
    }

    // Validate toolType against allowed values
    if (!VALID_TOOL_TYPES.includes(toolType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tool type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the authenticated user's ID instead of client-provided userId
    const userId = authenticatedUserId;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let result: any = {};

    console.log(`Processing health tool: ${toolType} for user: ${userId}`);

    switch (toolType) {
      case 'mental_health_assessment': {
        const { moodRating, anxietyLevel, stressLevel, energyLevel, sleepQuality, symptoms, journalEntry } = data;
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a compassionate mental health support AI. Provide helpful, supportive insights based on the user's mental health check-in data. Be empathetic, offer practical coping strategies, and always recommend professional help for serious concerns. Never diagnose conditions.`
              },
              {
                role: 'user',
                content: `Mental health check-in data:
- Mood Rating (1-10): ${moodRating}
- Anxiety Level (1-10): ${anxietyLevel}
- Stress Level (1-10): ${stressLevel}
- Energy Level (1-10): ${energyLevel}
- Sleep Quality (1-10): ${sleepQuality}
- Symptoms reported: ${symptoms?.join(', ') || 'None'}
- Journal entry: ${journalEntry || 'None provided'}

Please provide:
1. A brief, empathetic summary of their current state
2. 3-4 personalized coping strategies or recommendations
3. Whether they should consider professional support (based on severity)`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API error:', response.status, errorText);
          throw new Error('Failed to get AI insights');
        }

        const aiData = await response.json();
        const aiInsights = aiData.choices[0]?.message?.content || '';

        const { error: insertError } = await supabase
          .from('mental_health_checkins')
          .insert({
            user_id: userId,
            mood_rating: moodRating,
            anxiety_level: anxietyLevel,
            stress_level: stressLevel,
            energy_level: energyLevel,
            sleep_quality: sleepQuality,
            symptoms: symptoms || [],
            journal_entry: journalEntry,
            ai_insights: aiInsights
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw new Error('Failed to save check-in');
        }

        result = { success: true, insights: aiInsights };
        break;
      }

      case 'symptom_assessment': {
        const { assessmentType, symptoms, severity, duration } = data;
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a medical symptom analysis AI. Provide helpful health information but always emphasize that this is not a medical diagnosis. Recommend seeking professional medical care for serious symptoms.`
              },
              {
                role: 'user',
                content: `Symptom assessment for: ${assessmentType}
Symptoms: ${symptoms.join(', ')}
Severity: ${severity}
Duration: ${duration}

Please provide:
1. A general analysis of these symptoms
2. Possible causes (without diagnosing)
3. Self-care recommendations
4. When to seek medical attention
5. Urgency level (low/medium/high/critical)`
              }
            ],
            max_completion_tokens: 1200,
            tools: [
              {
                type: 'function',
                function: {
                  name: 'symptom_analysis',
                  description: 'Structured symptom analysis results',
                  parameters: {
                    type: 'object',
                    properties: {
                      analysis: { type: 'string', description: 'General analysis of symptoms' },
                      recommendations: { type: 'array', items: { type: 'string' }, description: 'Self-care recommendations' },
                      urgency_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Urgency level' },
                      seek_care_when: { type: 'string', description: 'When to seek medical attention' }
                    },
                    required: ['analysis', 'recommendations', 'urgency_level', 'seek_care_when'],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'symptom_analysis' } }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API error:', response.status, errorText);
          throw new Error('Failed to analyze symptoms');
        }

        const aiData = await response.json();
        const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
        const analysisResult = toolCall ? JSON.parse(toolCall.function.arguments) : null;

        if (analysisResult) {
          const { error: insertError } = await supabase
            .from('symptom_assessments')
            .insert({
              user_id: userId,
              assessment_type: assessmentType,
              symptoms: symptoms,
              severity: severity,
              duration: duration,
              ai_analysis: analysisResult.analysis,
              recommendations: analysisResult.recommendations,
              urgency_level: analysisResult.urgency_level
            });

          if (insertError) {
            console.error('Database insert error:', insertError);
          }

          result = { success: true, ...analysisResult };
        } else {
          throw new Error('Failed to parse AI response');
        }
        break;
      }

      case 'ovulation_prediction': {
        const { lastPeriodStart, cycleLength, periodDuration } = data;
        
        const { data: periodHistory } = await supabase
          .from('period_records')
          .select('start_date, end_date')
          .eq('user_id', userId)
          .order('start_date', { ascending: false })
          .limit(6);

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a fertility and cycle prediction AI. Provide accurate predictions based on menstrual cycle data. Use standard medical calculations for ovulation (typically cycle length - 14 days for ovulation day).`
              },
              {
                role: 'user',
                content: `Calculate ovulation and fertility window:
- Last period start: ${lastPeriodStart}
- Average cycle length: ${cycleLength} days
- Average period duration: ${periodDuration} days
- Period history (last 6 cycles): ${JSON.stringify(periodHistory || [])}

Please calculate:
1. Predicted ovulation date
2. Fertile window (start and end dates)
3. Next expected period date
4. Any notes about cycle regularity`
              }
            ],
            max_completion_tokens: 800,
            tools: [
              {
                type: 'function',
                function: {
                  name: 'fertility_prediction',
                  description: 'Fertility and ovulation prediction results',
                  parameters: {
                    type: 'object',
                    properties: {
                      predicted_ovulation_date: { type: 'string', description: 'ISO date string' },
                      fertile_window_start: { type: 'string', description: 'ISO date string' },
                      fertile_window_end: { type: 'string', description: 'ISO date string' },
                      next_period_date: { type: 'string', description: 'ISO date string' },
                      cycle_notes: { type: 'string', description: 'Notes about cycle pattern' }
                    },
                    required: ['predicted_ovulation_date', 'fertile_window_start', 'fertile_window_end', 'next_period_date'],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'fertility_prediction' } }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API error:', response.status, errorText);
          throw new Error('Failed to calculate predictions');
        }

        const aiData = await response.json();
        const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
        const prediction = toolCall ? JSON.parse(toolCall.function.arguments) : null;

        if (prediction) {
          const { error: insertError } = await supabase
            .from('ovulation_predictions')
            .insert({
              user_id: userId,
              predicted_ovulation_date: prediction.predicted_ovulation_date,
              fertile_window_start: prediction.fertile_window_start,
              fertile_window_end: prediction.fertile_window_end,
              next_period_date: prediction.next_period_date,
              cycle_length: cycleLength,
              ai_notes: prediction.cycle_notes
            });

          if (insertError) {
            console.error('Database insert error:', insertError);
          }

          result = { success: true, ...prediction };
        } else {
          throw new Error('Failed to parse AI response');
        }
        break;
      }

      case 'sleep_analysis': {
        const { data: sleepHistory } = await supabase
          .from('sleep_records')
          .select('*')
          .eq('user_id', userId)
          .order('sleep_date', { ascending: false })
          .limit(14);

        if (!sleepHistory || sleepHistory.length === 0) {
          result = { success: true, analysis: 'Not enough sleep data for analysis. Please log at least a few days of sleep.' };
          break;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a sleep health analyst AI. Analyze sleep patterns and provide helpful recommendations for improving sleep quality.`
              },
              {
                role: 'user',
                content: `Analyze this sleep data from the last 2 weeks:
${JSON.stringify(sleepHistory, null, 2)}

Please provide:
1. Overall sleep quality assessment
2. Patterns identified (bedtime consistency, duration trends)
3. Specific recommendations for improvement
4. Any concerning patterns that should be addressed`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze sleep data');
        }

        const aiData = await response.json();
        const analysis = aiData.choices[0]?.message?.content || '';

        result = { success: true, analysis };
        break;
      }

      case 'testosterone_analysis': {
        const { totalTestosterone, freeTestosterone, unit } = data;
        
        const { data: testHistory } = await supabase
          .from('testosterone_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(10);

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are an endocrinology AI assistant specializing in testosterone analysis. Provide insights about testosterone levels, their implications, and lifestyle recommendations. Always emphasize that this is informational and professional medical consultation is needed for diagnosis and treatment.`
              },
              {
                role: 'user',
                content: `Analyze testosterone levels:
- Total Testosterone: ${totalTestosterone} ${unit}
- Free Testosterone: ${freeTestosterone || 'Not provided'} ${freeTestosterone ? unit : ''}
- Historical data: ${JSON.stringify(testHistory || [])}

Please provide:
1. Assessment of current levels compared to normal ranges
2. Trend analysis if historical data is available
3. Potential factors affecting levels
4. Lifestyle recommendations for optimization
5. When to consult a doctor`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze testosterone data');
        }

        const aiData = await response.json();
        const insights = aiData.choices[0]?.message?.content || '';

        const { error: insertError } = await supabase
          .from('testosterone_records')
          .insert({
            user_id: userId,
            total_testosterone: totalTestosterone,
            free_testosterone: freeTestosterone,
            testosterone_unit: unit,
            ai_insights: insights
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
        }

        result = { success: true, insights };
        break;
      }

      case 'libido_analysis': {
        const { data: libidoHistory } = await supabase
          .from('libido_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(30);

        if (!libidoHistory || libidoHistory.length < 3) {
          result = { success: true, analysis: 'Not enough data for analysis. Please log at least 3 entries.' };
          break;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a sexual health AI assistant. Analyze libido patterns and provide helpful, sensitive insights. Be respectful and professional. Always recommend consulting healthcare providers for persistent concerns.`
              },
              {
                role: 'user',
                content: `Analyze libido tracking data:
${JSON.stringify(libidoHistory, null, 2)}

Please provide:
1. Pattern analysis (correlations with stress, sleep, exercise)
2. Trends over time
3. Lifestyle factors that may be influencing libido
4. Recommendations for improvement
5. When to seek medical advice`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze libido data');
        }

        const aiData = await response.json();
        const analysis = aiData.choices[0]?.message?.content || '';

        result = { success: true, analysis };
        break;
      }

      case 'substance_analysis': {
        const { data: substanceHistory } = await supabase
          .from('substance_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(60);

        if (!substanceHistory || substanceHistory.length < 5) {
          result = { success: true, analysis: 'Not enough data for analysis. Please log more entries.' };
          break;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a supportive health AI focusing on substance use patterns. Provide non-judgmental insights and harm reduction information. Always recommend professional support for addiction concerns.`
              },
              {
                role: 'user',
                content: `Analyze substance use tracking data:
${JSON.stringify(substanceHistory, null, 2)}

Please provide:
1. Consumption patterns and trends
2. Common triggers identified
3. Health impact assessment
4. Harm reduction recommendations
5. Resources for support if needed`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze substance data');
        }

        const aiData = await response.json();
        const analysis = aiData.choices[0]?.message?.content || '';

        result = { success: true, analysis };
        break;
      }

      case 'vision_analysis': {
        const { data: visionHistory } = await supabase
          .from('vision_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(20);

        if (!visionHistory || visionHistory.length < 2) {
          result = { success: true, analysis: 'Not enough data for analysis. Please log more entries.' };
          break;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are an eye health AI assistant. Analyze vision tracking data and provide insights about eye health. Always recommend regular eye exams with professionals.`
              },
              {
                role: 'user',
                content: `Analyze vision health tracking data:
${JSON.stringify(visionHistory, null, 2)}

Please provide:
1. Vision trend analysis
2. Screen time impact assessment
3. Symptom pattern analysis
4. Eye health recommendations
5. When to see an optometrist/ophthalmologist`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze vision data');
        }

        const aiData = await response.json();
        const analysis = aiData.choices[0]?.message?.content || '';

        result = { success: true, analysis };
        break;
      }

      case 'fitness_analysis': {
        const { data: fitnessHistory } = await supabase
          .from('fitness_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(30);

        if (!fitnessHistory || fitnessHistory.length < 3) {
          result = { success: true, analysis: 'Not enough data for analysis. Please log more workouts.' };
          break;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a fitness and exercise AI coach. Analyze workout patterns and provide personalized recommendations for improvement. Be encouraging and supportive.`
              },
              {
                role: 'user',
                content: `Analyze fitness tracking data:
${JSON.stringify(fitnessHistory, null, 2)}

Please provide:
1. Activity pattern analysis
2. Progress assessment (calories, distance, duration trends)
3. Workout variety evaluation
4. Personalized recommendations for improvement
5. Recovery and rest day suggestions`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze fitness data');
        }

        const aiData = await response.json();
        const analysis = aiData.choices[0]?.message?.content || '';

        result = { success: true, analysis };
        break;
      }

      case 'health_assessment_analysis': {
        const { assessmentType, score, severity, answers } = data;
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a health assessment AI. Provide helpful, empathetic analysis of health assessment results. Never diagnose - instead provide general information and recommend professional consultation when appropriate.`
              },
              {
                role: 'user',
                content: `Health assessment results:
- Assessment Type: ${assessmentType}
- Total Score: ${score}
- Severity Level: ${severity}
- Individual Answers: ${JSON.stringify(answers)}

Please provide:
1. Summary of assessment results
2. What these results may indicate (without diagnosing)
3. Lifestyle recommendations
4. When to seek professional help
5. Additional resources or information`
              }
            ],
            max_completion_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze assessment');
        }

        const aiData = await response.json();
        const analysis = aiData.choices[0]?.message?.content || '';
        const recommendations = analysis.split('\n').filter((line: string) => line.includes('•') || line.includes('-')).slice(0, 5);

        result = { success: true, analysis, recommendations };
        break;
      }

      case 'safe_medicines_check': {
        const { medication, condition } = data;
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a medication safety AI specializing in pregnancy medication safety. Provide information based on FDA pregnancy categories and current medical guidelines. Always emphasize consulting a healthcare provider before taking any medication during pregnancy.`
              },
              {
                role: 'user',
                content: `Check medication safety during pregnancy:
- Medication: ${medication}
- Condition/Purpose: ${condition || 'General inquiry'}

Please provide in JSON format:
{
  "medication": "${medication}",
  "category": "A/B/C/D/X or Unknown",
  "safety_level": "safe/use_with_caution/avoid/contraindicated",
  "description": "Brief explanation of safety profile",
  "alternatives": ["List of safer alternatives if applicable"]
}`
              }
            ],
            max_completion_tokens: 800,
            tools: [
              {
                type: 'function',
                function: {
                  name: 'medication_safety',
                  description: 'Medication safety information',
                  parameters: {
                    type: 'object',
                    properties: {
                      medication: { type: 'string' },
                      category: { type: 'string', description: 'FDA pregnancy category' },
                      safety_level: { type: 'string', enum: ['safe', 'use_with_caution', 'avoid', 'contraindicated'] },
                      description: { type: 'string' },
                      alternatives: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['medication', 'category', 'safety_level', 'description'],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'medication_safety' } }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check medication safety');
        }

        const aiData = await response.json();
        const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
        const safetyInfo = toolCall ? JSON.parse(toolCall.function.arguments) : null;

        if (safetyInfo) {
          result = { success: true, ...safetyInfo };
        } else {
          throw new Error('Failed to parse medication safety response');
        }
        break;
      }

      default:
        throw new Error(`Unknown tool type: ${toolType}`);
    }

    console.log(`Health tool ${toolType} completed successfully`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in health-tools:', error);
    // Return generic error message to avoid information leakage
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred processing your request. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
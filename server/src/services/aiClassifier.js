/**
 * Offline-first emergency NLP classifier.
 * Optional OpenAI enrichment when OPENAI_API_KEY is set.
 */

const CATEGORY_RULES = [
  {
    type: 'fire',
    priority: 'critical',
    services: ['fire', 'ambulance', 'hospital'],
    keywords: [
      'fire',
      'burning',
      'smoke',
      'flames',
      'blaze',
      'explosion',
      'gas leak',
      'aag',
      'dhuaan',
    ],
    guidance: 'Evacuate if safe, stay low under smoke, and contact fire services immediately.',
  },
  {
    type: 'medical',
    priority: 'high',
    services: ['hospital', 'ambulance'],
    keywords: [
      'fainted',
      'unconscious',
      'bleeding',
      'injury',
      'accident',
      'heart',
      'chest pain',
      'stroke',
      'breathing',
      'ambulance',
      'hospital',
      'medical',
      'sick',
      'seizure',
      'fracture',
      'burn',
      'poison',
      'overdose',
      'pregnant',
      'labor',
    ],
    guidance: 'Keep the person safe and still. Call emergency medical services and share your location.',
  },
  {
    type: 'security',
    priority: 'high',
    services: ['police'],
    keywords: [
      'theft',
      'stolen',
      'robbery',
      'break-in',
      'break in',
      'threat',
      'assault',
      'attack',
      'crime',
      'harassment',
      'stalking',
      'violence',
      'weapon',
      'police',
    ],
    guidance: 'Move to a safe location if possible and contact police. Avoid confronting the threat.',
  },
  {
    type: 'medical',
    priority: 'medium',
    services: ['pharmacy', 'hospital'],
    keywords: ['pharmacy', 'medicine', 'prescription', 'chemist', 'first aid'],
    guidance: 'Locate a nearby pharmacy or clinic. For severe symptoms, go to a hospital.',
  },
];

const SERVICE_SEARCH_MAP = {
  hospital: ['hospital', 'hospitals', 'clinic', 'er', 'emergency room', 'medical center'],
  ambulance: ['ambulance', 'paramedic', 'ems'],
  police: ['police', 'cop', 'station', 'law enforcement'],
  fire: ['fire', 'fire station', 'firefighter', 'fire department'],
  pharmacy: ['pharmacy', 'chemist', 'drugstore', 'medicine shop'],
};

function scoreCategory(text, rule) {
  let score = 0;
  for (const keyword of rule.keywords) {
    if (text.includes(keyword)) {
      score += keyword.split(' ').length > 1 ? 3 : 2;
    }
  }
  return score;
}

function classifyLocally(message) {
  const text = (message || '').toLowerCase().trim();
  if (!text) {
    return {
      emergencyType: 'general',
      priority: 'medium',
      recommendedServices: ['hospital', 'police', 'fire', 'ambulance'],
      confidence: 0.2,
      summary: 'Unable to determine emergency type from the message.',
      suggestedAction: 'Use SOS or choose a service category manually, and call local emergency numbers if needed.',
      disclaimer:
        'AILEA is an assistance tool and not a replacement for professional emergency services. Call your local emergency number immediately if you are in danger.',
    };
  }

  let best = { type: 'general', priority: 'medium', services: ['hospital', 'police', 'fire'], score: 0, guidance: '' };

  for (const rule of CATEGORY_RULES) {
    const score = scoreCategory(text, rule);
    if (score > best.score) {
      best = { ...rule, score };
    }
  }

  const confidence = best.score === 0 ? 0.35 : Math.min(0.95, 0.45 + best.score * 0.08);

  return {
    emergencyType: best.type || 'general',
    priority: best.priority || 'medium',
    recommendedServices: best.services || ['hospital', 'police', 'fire'],
    confidence,
    summary:
      best.score > 0
        ? `Detected a likely ${best.type} emergency based on your description.`
        : 'Treating this as a general emergency. Direct service options are available below.',
    suggestedAction:
      best.guidance ||
      'Contact the most relevant emergency service nearby and share your location with trusted contacts.',
    disclaimer:
      'AILEA is an assistance tool and not a replacement for professional emergency services. Call your local emergency number immediately if you are in danger.',
  };
}

function parseSearchIntent(message) {
  const text = (message || '').toLowerCase();
  const types = [];

  for (const [type, keywords] of Object.entries(SERVICE_SEARCH_MAP)) {
    if (keywords.some((k) => text.includes(k))) {
      types.push(type);
    }
  }

  const openNow = /open now|currently open|24.?7|available now/.test(text);
  const nearest = /nearest|near me|closest|nearby/.test(text);

  return {
    types: types.length ? types : null,
    openNow,
    nearest,
    query: message,
  };
}

async function classifyWithOptionalLLM(message) {
  const local = classifyLocally(message);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { ...local, engine: 'local' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You classify emergency descriptions. Return JSON with emergencyType (medical|security|fire|general), priority (low|medium|high|critical), recommendedServices (array of hospital|ambulance|police|fire|pharmacy), summary, suggestedAction, confidence (0-1). Be conservative. Never invent facts.',
          },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      return { ...local, engine: 'local-fallback' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      emergencyType: parsed.emergencyType || local.emergencyType,
      priority: parsed.priority || local.priority,
      recommendedServices: parsed.recommendedServices || local.recommendedServices,
      confidence: parsed.confidence ?? local.confidence,
      summary: parsed.summary || local.summary,
      suggestedAction: parsed.suggestedAction || local.suggestedAction,
      disclaimer: local.disclaimer,
      engine: 'openai',
    };
  } catch {
    return { ...local, engine: 'local-fallback' };
  }
}

module.exports = {
  classifyLocally,
  classifyWithOptionalLLM,
  parseSearchIntent,
};

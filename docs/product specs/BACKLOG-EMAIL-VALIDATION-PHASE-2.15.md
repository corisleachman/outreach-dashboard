# Email List Validation (Phase 2.15) — Post-MVP Pro Feature

**Status:** Backlog (Post-MVP)  
**Priority:** Medium-High (Pro feature, adds user trust + revenue)  
**Effort:** 25–30 hours engineering  
**Timeline:** Phase 2.15 or 2.16 (after activation loop & monetisation locked)

---

## OVERVIEW

Integrate third-party email validation API (ZeroBounce recommended) to verify prospect email validity at import time. Free tier gets "quick check" signal; Pro tier gets full validation with confidence scoring. Monetize per-email or per-campaign basis.

---

## PROBLEM STATEMENT

- Users importing CSV lists lack confidence in email validity
- Invalid/catch-all emails hurt sender reputation and conversion
- DIY SMTP validation is 60–70% accurate (grey-listing, catch-all false positives)
- Professional services (NeverBounce, ZeroBounce) are 98% accurate but require integration

---

## SOLUTION: ZEROBOUNCE API INTEGRATION

### **Why ZeroBounce Over NeverBounce**
- Better GDPR story (DNS/pattern-based, not "ping" framed)
- Cheaper: $0.008–0.015 per email in bulk vs. $0.01–0.02
- Stronger catch-all detection
- Better Node.js documentation
- Batch API supports up to 100K emails per request

### **Core Feature Set**

#### **For Free Tier**
- No real-time validation
- UI informational badge only: "List quality: [Run full check →]" (upgrade CTA)
- Optionally: 1 free validation per campaign (loss leader, shows value)

#### **For Pro Tier**
- Full email validation on import (async, background job)
- Per-prospect validation status badge: **✓ Valid** | **⚠ Risky** | **✗ Invalid**
- Confidence score (0–100): "97% of emails verified valid"
- Invalid emails greyed out in Review tab (non-clickable, skip-only)
- Re-validate button: Check list validity again (costs user)

---

## TECHNICAL SPEC

### **Database Schema Changes**

```sql
-- Add to prospects table
ALTER TABLE prospects ADD COLUMN (
  email_validation_status VARCHAR(20) DEFAULT 'unknown',
    -- 'valid', 'invalid', 'risky', 'catch_all', 'unknown', 'role_based'
  email_validation_score NUMERIC(5,2),
    -- 0–100 confidence %
  email_validation_vendor VARCHAR(20) DEFAULT 'zerobounce',
  email_validation_timestamp TIMESTAMP,
  email_validation_details JSONB
    -- { "status": "...", "sub_status": "...", "abuse_score": 0–100, "free_email": bool }
);

-- New table for validation batch jobs
CREATE TABLE email_validation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'processing', 'complete', 'failed'
  total_prospects INT,
  validated_count INT DEFAULT 0,
  valid_count INT DEFAULT 0,
  invalid_count INT DEFAULT 0,
  risky_count INT DEFAULT 0,
  avg_confidence_score NUMERIC(5,2),
  cost_cents INT,  -- Track cost for user visibility (transparency)
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS: users see only their own validation jobs
CREATE POLICY "Users can view own validation jobs"
  ON email_validation_jobs
  FOR SELECT
  USING (user_id = auth.uid());
```

### **API Routes**

#### **POST /api/validate-email-list**
```typescript
// Request
{
  campaign_id: string,
  force_revalidate?: boolean  // Override existing validation
}

// Response
{
  job_id: string,
  status: 'queued' | 'processing',
  estimated_cost_cents: number,
  prospect_count: number
}

// On completion (webhook or polling):
{
  job_id: string,
  status: 'complete',
  results: {
    valid_count: number,
    invalid_count: number,
    risky_count: number,
    catch_all_count: number,
    avg_confidence_score: number
  },
  cost_cents: number
}
```

#### **GET /api/validate-email-list/:job_id**
Real-time job status polling. Returns job record + current progress.

#### **POST /api/validate-email-list/:job_id/cancel**
Cancel in-progress validation (refund cost if not yet consumed by vendor).

---

### **ZeroBounce API Integration (Backend Service)**

**File:** `/lib/services/zerobounce.ts`

```typescript
import fetch from 'node-fetch';

interface ZeroBounceEmailResult {
  address: string;
  status: 'valid' | 'invalid' | 'catch_all' | 'unknown' | 'spamtrap' | 'abuse';
  sub_status: string;
  confidence_score: number;  // 0–100
  free_email: boolean;
  abuse_score: number;
}

class ZeroBounceClient {
  private apiKey: string;
  private baseUrl = 'https://bulkapi.zerobounce.net/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Validate single email
  async validateEmail(email: string): Promise<ZeroBounceEmailResult> {
    const res = await fetch(
      `${this.baseUrl}/email/status?api_key=${this.apiKey}&email=${email}`
    );
    return res.json();
  }

  // Batch validation (preferred)
  async validateBatch(emails: string[]): Promise<ZeroBounceEmailResult[]> {
    // Use /sendfile endpoint (async batch processing)
    // Upload file → get file_id → poll for results
    const formData = new FormData();
    formData.append('file', new Blob([emails.join('\n')]));
    formData.append('api_key', this.apiKey);

    const uploadRes = await fetch(`${this.baseUrl}/sendfile`, {
      method: 'POST',
      body: formData,
    });
    const { file_id } = await uploadRes.json();

    // Poll for results (endpoint returns: { status: 'processing' | 'complete', results: [...] })
    let results = [];
    let retries = 0;
    while (retries < 120) {  // ~10 min polling timeout
      const statusRes = await fetch(
        `${this.baseUrl}/getfile?api_key=${this.apiKey}&file_id=${file_id}`
      );
      const { status, results: data } = await statusRes.json();
      if (status === 'complete') {
        results = data;
        break;
      }
      await new Promise(r => setTimeout(r, 5000));  // 5s between polls
      retries++;
    }
    return results;
  }

  // Calculate cost
  calculateCost(emailCount: number): number {
    // ZeroBounce pricing: bulk rates typically $0.008–0.015 per email
    // Assume $0.01 per email
    return emailCount * 10;  // cents
  }
}

export default ZeroBounceClient;
```

### **Background Job (Supabase Edge Function or Bull Queue)**

**File:** `/jobs/validate-emails-job.ts`

```typescript
import { supabase } from '@/lib/supabase';
import ZeroBounceClient from '@/lib/services/zerobounce';

async function validateEmailListJob(jobId: string) {
  const job = await supabase
    .from('email_validation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  const { campaign_id, total_prospects } = job.data;

  // Mark job as processing
  await supabase
    .from('email_validation_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId);

  try {
    // Fetch all prospect emails for campaign
    const prospects = await supabase
      .from('prospects')
      .select('id, email')
      .eq('campaign_id', campaign_id);

    const emails = prospects.data.map(p => p.email);
    const zerobounce = new ZeroBounceClient(process.env.ZEROBOUNCE_API_KEY);

    // Validate batch
    const results = await zerobounce.validateBatch(emails);

    // Map results back to prospects
    let validCount = 0, invalidCount = 0, riskyCount = 0;
    let totalScore = 0;

    for (const result of results) {
      const prospect = prospects.data.find(p => p.email === result.address);
      if (!prospect) continue;

      let status = 'unknown';
      if (result.status === 'valid') status = 'valid';
      else if (result.status === 'invalid') status = 'invalid';
      else if (result.status === 'catch_all') status = 'catch_all';
      else if (result.status === 'spamtrap') status = 'invalid';

      if (status === 'valid') validCount++;
      else if (status === 'invalid') invalidCount++;
      else riskyCount++;

      totalScore += result.confidence_score;

      // Update prospect record
      await supabase
        .from('prospects')
        .update({
          email_validation_status: status,
          email_validation_score: result.confidence_score,
          email_validation_timestamp: new Date(),
          email_validation_details: {
            status: result.status,
            sub_status: result.sub_status,
            abuse_score: result.abuse_score,
            free_email: result.free_email,
          },
        })
        .eq('id', prospect.id);
    }

    // Mark job as complete
    const avgScore = totalScore / results.length;
    await supabase
      .from('email_validation_jobs')
      .update({
        status: 'complete',
        validated_count: results.length,
        valid_count: validCount,
        invalid_count: invalidCount,
        risky_count: riskyCount,
        avg_confidence_score: avgScore,
        completed_at: new Date(),
      })
      .eq('id', jobId);

    // Emit real-time update (optional: websocket or polling)
    // supabase.realtime.broadcast(`validation:${jobId}`, { status: 'complete', ... })

  } catch (error) {
    await supabase
      .from('email_validation_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date(),
      })
      .eq('id', jobId);
  }
}

export { validateEmailListJob };
```

---

## UI/UX SPEC

### **Review Tab — Email Validation Badges**

```
┌─────────────────────────────────────────┐
│ [Name]        [Email]        [Status]   │
├─────────────────────────────────────────┤
│ Alice        alice@co.com   ✓ Valid     │
│ Bob          bob@co.com     ⚠ Risky     │
│ Charlie      charlie@bad    ✗ Invalid   │
│ Diana        diana@co.com   ? Unknown   │
└─────────────────────────────────────────┘

Status Breakdown (Pro users only):
┌──────────────────────────────┐
│ Valid:    42 (87%)          │
│ Risky:     5 (10%)          │
│ Invalid:   1 (2%)           │
│ Unknown:   1 (2%)           │
└──────────────────────────────┘
[Re-validate]  [Download Results]
```

### **Free Tier — Upgrade CTA**

```
┌──────────────────────────────┐
│ List Quality Check           │
│ [Run full validation ↗]      │
│ Verify email validity before │
│ sending. Pro only.           │
└──────────────────────────────┘
```

### **Validation Modal (Pro Tier)**

```
Validating 48 emails...
┌──────────────────────────────┐
│ ⏳ Processing   [Cancel]      │
│                              │
│ Emails validated: 24 / 48    │
│ Estimated cost: $0.48        │
│ Time remaining: ~30s         │
└──────────────────────────────┘

[On complete]
✓ Validation complete
Valid:    42 (87%)
Risky:     5 (10%)
Invalid:   1 (2%)
Cost: $0.48 (deducted from balance)
[Close]
```

---

## MONETISATION MODEL

### **Option A: Per-Email Cost (Recommended)**
- Free tier: None
- Pro tier: $0.02 per email validated
- First validation: Free (1x per campaign)
- User sees: "Validating 48 emails: estimated cost $0.96"
- Deduct from Stripe balance or monthly allowance

**Pros:** Transparent, scales with value  
**Cons:** Friction if users validate repeatedly

### **Option B: Monthly Allowance**
- Free: 0 validations
- Pro: 2,000 email validations/month included
- Overage: $0.01 per email

**Pros:** Less friction, predictable costs  
**Cons:** Unused allowances feel wasteful

### **Option C: Hybrid (Best UX)**
- Free: 1 free validation per campaign (loss leader)
- Pro: Subsequent validations at $0.02/email or $5 per campaign
- Encourage repeated use for list refreshes

---

## IMPLEMENTATION SEQUENCE

1. **Sign up for ZeroBounce API** (free tier, $50 credit to test)
2. **Implement database schema** (new columns + job table)
3. **Build ZeroBounceClient service** (batch validation)
4. **Create background job** (Supabase Edge Function or Bull queue)
5. **Build API route** (`/api/validate-email-list`)
6. **Implement UI badges** (Review tab, status display)
7. **Add monetisation** (cost tracking, Stripe integration)
8. **QA + rollout** (Pro users first, gradual ramp)

---

## METRICS TO TRACK

- **Adoption:** % of Pro users running at least 1 validation
- **Revenue per user:** Avg validation cost per Pro subscriber
- **Accuracy feedback:** % of users reporting validation discrepancies (low = good)
- **Engagement impact:** Does validation correlate with higher send rates / conversion?

---

## ROLLOUT PLAN

**Phase A (Soft Launch — Week 1–2):**
- Beta test with 5–10 Pro users
- Collect feedback on UX, accuracy, cost perception
- Adjust messaging/pricing

**Phase B (Full Launch — Week 3+):**
- Roll out to all Pro users
- In-app announcement + email
- Monitor adoption, cost, support load

**Phase C (Expansion):**
- Consider UI enhancements (export results, schedule recurring validations)
- Monitor vendor costs vs. revenue; consider tiering (free tier gets 50 free validations/year?)

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| **False positives** (marking valid emails invalid) | Use ZeroBounce + confidence scoring; user can manually override |
| **Vendor API downtime** | Graceful degradation; show "validation unavailable" badge; no blocking |
| **Cost overruns** | Set API spend limit; monitor usage dashboard; warn users before validation |
| **GDPR concerns** (pinging mailboxes) | ZeroBounce uses pattern analysis + DNS, not live SMTP; document in privacy policy |
| **User churn** (if cost is too high) | Run A/B test; consider free allowance model instead of per-email |

---

## SUCCESS CRITERIA

- ✅ 40%+ of Pro users run at least 1 validation per month
- ✅ No increase in support tickets related to false positives
- ✅ Net revenue positive: validation revenue > vendor cost
- ✅ User feedback: "This gave me confidence in my list" (NPS survey)

---

## DEPENDENCIES

- Phase 2.14: Stripe integration (payment method required)
- Phase 2.10+: Pro tier fully functional
- No blockers; can run in parallel with other phases

---

## ESTIMATED TIMELINE

**After MVP ships:**
- Design + spec: 2–3 hours
- Implementation: 20–25 hours
- QA + refinement: 3–5 hours
- **Total: ~30 hours**
- **Calendar time: 1–2 weeks** (sprint-sized task)

---

## NOTES

- **Keep it optional.** Validation should never block campaign creation or sending.
- **Show cost upfront.** Transparency builds trust; users should know cost before validating.
- **Layer it gradually.** Start with API integration + basic UI; add export/scheduling later.
- **Monitor vendor relationship.** ZeroBounce is solid, but rate limits exist (batching helps).


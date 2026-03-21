# Email Notification System — Phase 2.X (Post-MVP)

**Status:** Backlog (Post-MVP, Medium Priority)  
**Target Timeline:** Phase 2.15–2.17 (after activation loop & monetisation locked)  
**Total Effort:** 35–50 hours (split into 2.X-A and 2.X-B phases)  
**Dependencies:** Phases 2.10–2.14 must be complete and stable

---

## EXECUTIVE SUMMARY

The Email Notification System bridges out-of-app engagement by sending contextual, actionable emails that pull users back into the product without requiring login. Core mechanic: **JWT-signed tokens enable single-click actions** (send campaign, respond to reply) directly from email, dramatically reducing friction and improving activation metrics.

**Key outcomes:**
- Reduce campaign abandonment (draft → send conversion +40%)
- Improve reply engagement (replies seen → responded +60%)
- Decrease churn via re-engagement emails (14-day inactivity recovery)
- Enable async workflow (users can take critical actions without app login)

---

## CORE PHILOSOPHY

### **Three Principles**

1. **Remove friction, don't create it**
   - Emails must enable action without login
   - Notifications must be sparse (1–3/week) and high-signal
   - Every email must answer: "Why am I getting this now?"

2. **Respect user agency**
   - No guilt-based messaging
   - No artificial urgency or streak mechanics
   - Clear, accessible preference controls + unsubscribe

3. **Measure impact relentlessly**
   - Track open rate, click-through, action completion
   - A/B test subject lines + send times
   - Correlate notifications to retention & repeat usage

---

## PROBLEM STATEMENT

Users naturally fall off between sessions at key moments:

| Drop-off Point | Current State | Impact |
|---|---|---|
| **After prospect import** | User imports list; doesn't write message | 25% abandon without sending |
| **Message drafted** | Campaign ready; user procrastinates sending | 15% sit in drafts >24 hrs |
| **Campaign sent** | User forgets to monitor replies | Replies go unread 40% of time |
| **Got a reply** | Prospect reply received; user doesn't respond | 30% of conversations die here |
| **Inactive 7+ days** | User dormant after first campaign | 50% churn rate by day 30 |

**Solution:** Email notifications pull users back at these moments, with actionable buttons that require no login.

---

## NOTIFICATION ARCHITECTURE

### **Three Notification Tiers**

#### **TIER 1: ACTIVATION-CRITICAL**
Sent during onboarding or immediately post-launch. Block user drop-off.

- Campaign ready to send (drafted but not sent)
- Prospects imported, no message (cold start after CSV)

**Frequency:** Up to 1 per day max; tied to user action  
**Actionable:** YES (JWT send button)  
**User Control:** Can be disabled, but on by default

#### **TIER 2: ENGAGEMENT**
Sent when meaningful activity occurs. Keep user engaged with live campaign.

- First reply received
- Multiple replies (weekly digest)
- Campaign milestone (10 replies, 100 contacted)
- Follow-up reminder

**Frequency:** Per-event or batched weekly  
**Actionable:** Partial (some require login)  
**User Control:** Individually toggleable

#### **TIER 3: RETENTION**
Sent to inactive users. Re-engage dormant accounts.

- No activity for 7 days
- No activity for 14 days
- Re-engagement offer (free validation check, etc.)

**Frequency:** Once per inactivity threshold  
**Actionable:** Limited  
**User Control:** Opt-in for re-engagement

---

## NOTIFICATION TRIGGERS & SPECIFICATIONS

### **TIER 1: ACTIVATION-CRITICAL NOTIFICATIONS**

#### **1.1 — Campaign Ready to Send**

**Trigger:** Campaign reaches "drafted" status (message written, prospects added, no send initiated)  
**Timing:** 1 hour after draft completion  
**Conditions:**
- Campaign has ≥1 prospect
- Campaign has step 1 message
- Campaign has never been sent
- User hasn't received "campaign ready" email in last 24 hrs

**Email Template:**

```
TO: {user_email}
SUBJECT: Your campaign is ready to launch

Hi {user_name},

Your {prospect_count}-prospect campaign "{campaign_name}" is drafted and ready to send.

Email preview:
─────────────────────────────────
To: {example_prospect_email}
Subject: {subject_line}

{message_body_first_100_chars}...

Best,
{user_name}
─────────────────────────────────

[SEND NOW]  [Review in Outreach]
[Unsubscribe]

---
P.S. Your message will be sent from {gmail_address}.
```

**Technical Details:**

```typescript
// Generate JWT for action
const sendCampaignToken = jwt.sign(
  {
    user_id: userId,
    campaign_id: campaignId,
    action: 'send_campaign',
    email: userEmail,
    expires_in: 7 * 24 * 60 * 60 * 1000  // 7 days
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const actionUrl = `${process.env.APP_URL}/email-actions/send-campaign?token=${sendCampaignToken}`;

// Log notification sent
await db.from('notification_log').insert({
  user_id: userId,
  campaign_id: campaignId,
  notification_type: 'campaign_ready',
  email_address: userEmail,
  sent_at: new Date()
});
```

**Email Button Implementation:**

```html
<!-- In Sendgrid / Mailgun template -->
<a 
  href="https://outreach-app-theta.vercel.app/email-actions/send-campaign?token={{sendCampaignToken}}"
  class="btn btn-primary"
  data-tracking="email-action-send-campaign"
>
  SEND NOW
</a>

<!-- Alternative: Form POST for better security -->
<form method="POST" action="https://outreach-app-theta.vercel.app/api/email-actions/send-campaign">
  <input type="hidden" name="token" value="{{sendCampaignToken}}">
  <button type="submit" class="btn btn-primary">SEND NOW</button>
</form>
```

**API Endpoint:**

```typescript
// POST /api/email-actions/send-campaign
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      user_id: string;
      campaign_id: string;
      action: string;
    };

    // Authorization check (prevent token reuse for other campaigns)
    const campaign = await db
      .from('campaigns')
      .select('user_id')
      .eq('id', decoded.campaign_id)
      .single();

    if (campaign.data.user_id !== decoded.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Execute campaign send
    await sendCampaign(decoded.campaign_id);

    // Log action completion
    await db
      .from('notification_log')
      .update({
        action_completed: true,
        action_completed_at: new Date(),
        clicked_at: new Date()
      })
      .eq('campaign_id', decoded.campaign_id)
      .eq('notification_type', 'campaign_ready');

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.APP_URL}/dashboard?success=campaign_sent`,
      { status: 303 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
```

**Metrics to Track:**
- Send rate (% of users who receive this email after drafting)
- Open rate
- Click rate
- Action completion rate (clicked → campaign actually sent)
- Time from send email to send action

---

#### **1.2 — Prospects Imported, No Message**

**Trigger:** CSV import completes; campaign has ≥1 prospect but no message yet  
**Timing:** Immediately after import  
**Conditions:**
- First message is empty or not started
- Campaign has never been sent
- User is first-time onboarder (or new campaign creator)

**Email Template:**

```
TO: {user_email}
SUBJECT: {prospect_count} prospects ready — write your first message

Hi {user_name},

Great! You've imported {prospect_count} prospects.

Next step: Write your outreach message.

[WRITE MESSAGE]  [View Prospects]

Your first campaign can be live in 2 minutes.

Best,
The Outreach Team

---
[Unsubscribe]
```

**Note:** This email is **NOT actionable** (no JWT button for message creation—too complex). Instead, it points to app with pre-filled context.

**Metrics:**
- Open rate
- Click rate
- Time to message creation after email sent

---

### **TIER 2: ENGAGEMENT NOTIFICATIONS**

#### **2.1 — First Reply Received**

**Trigger:** New reply detected in Gmail inbox  
**Timing:** Immediate (via webhook or polling, max 5 min delay)  
**Conditions:**
- Email is reply to outreach message sent by campaign
- Campaign is still active
- User hasn't received "reply" notification for this prospect in last 2 hrs

**Email Template:**

```
TO: {user_email}
SUBJECT: Reply from {prospect_name}

Hi {user_name},

{prospect_name} replied to your email.

─────────────────────────────────
From: {prospect_email}
Subject: {reply_subject}

{reply_body_first_200_chars}...
─────────────────────────────────

[RESPOND]  [View in Outreach]

Great work — you're building momentum.

Best,
The Outreach Team

---
[Unsubscribe from reply notifications]
```

**Technical Details:**

```typescript
// Detect reply via Gmail polling (Phase 2.9)
async function detectRepliesAndNotify(campaignId: string, userId: string) {
  const sentEmails = await db
    .from('sent_emails')
    .select('prospect_id, gmail_message_id, prospect_email')
    .eq('campaign_id', campaignId);

  for (const sent of sentEmails.data) {
    // Check Gmail for replies to this thread
    const reply = await gmailClient.getThreadReplies(sent.gmail_message_id);

    if (reply && !reply.notified) {
      // Send notification
      const prospect = await db
        .from('prospects')
        .select('name')
        .eq('id', sent.prospect_id)
        .single();

      await sendEmail({
        to: userEmail,
        template: 'reply_received',
        data: {
          prospect_name: prospect.data.name,
          prospect_email: sent.prospect_email,
          reply_subject: reply.subject,
          reply_body: reply.body
        }
      });

      // Mark as notified
      await db
        .from('sent_emails')
        .update({ notified_at: new Date() })
        .eq('id', sent.id);
    }
  }
}
```

**Action Button (JWT):**

```html
<a 
  href="https://outreach.app/email-actions/reply?token={{replyToken}}&prospect_id={{prospectId}}"
  class="btn btn-primary"
>
  RESPOND
</a>

<!-- On click, opens reply composer with pre-filled prospect email & subject -->
```

**Metrics:**
- Open rate (highest engagement of all notifications—users care about replies)
- Click rate
- Avg time to response after notification

---

#### **2.2 — Weekly Digest (Replies + Activity)**

**Trigger:** Cron job, once per week  
**Timing:** Sunday 9:00 AM (user's timezone)  
**Conditions:**
- User has sent ≥1 campaign
- User has received ≥1 reply OR activity in last 7 days
- User has digest enabled in preferences
- User hasn't unsubscribed

**Email Template:**

```
TO: {user_email}
SUBJECT: Your outreach update for {week_start}–{week_end}

Hi {user_name},

Here's what happened with your outreach this week:

─────────────────────────────────
📧 Emails sent:     {emails_sent}
💬 Replies:         {replies_received}
✅ Conversations:   {active_conversations}
🔗 Connections:     {linkedin_connections_added}
─────────────────────────────────

Top replies:
{reply_1_prospect}: "{reply_1_snippet}..."
{reply_2_prospect}: "{reply_2_snippet}..."

[VIEW ALL REPLIES]  [RESPOND]

You're making great progress. Keep the momentum going.

Best,
The Outreach Team

---
[Manage notification preferences]
[Unsubscribe]
```

**Note:** Digest is **NOT fully actionable** (can't respond to all replies from email). Clicking [RESPOND] takes user to Conversations tab.

**Technical Implementation:**

```typescript
// Cron: Run weekly
export async function sendWeeklyDigest() {
  // Get all users with digest enabled
  const users = await db
    .from('user_notification_preferences')
    .select('user_id, email, timezone')
    .eq('weekly_digest_enabled', true)
    .eq('unsubscribed', false);

  for (const user of users.data) {
    // Get user's activity for past 7 days
    const startDate = subDays(now(), 7);
    
    const emailsSent = await db
      .from('sent_emails')
      .select('id')
      .eq('user_id', user.user_id)
      .gte('sent_at', startDate);

    const replies = await db
      .from('sent_emails')
      .select('id')
      .eq('user_id', user.user_id)
      .eq('reply_status', 'replied')
      .gte('replied_at', startDate);

    // Only send if there's activity
    if (emailsSent.data.length > 0 || replies.data.length > 0) {
      await sendEmail({
        to: user.email,
        template: 'weekly_digest',
        data: {
          emails_sent: emailsSent.data.length,
          replies_received: replies.data.length,
          // ... more data
        }
      });
    }
  }
}
```

**Metrics:**
- Send rate (% of eligible users who receive)
- Open rate
- Click rate
- Return to app rate (do digests drive logins?)

---

#### **2.3 — Campaign Milestone**

**Trigger:** Campaign reaches milestone threshold  
**Timing:** Immediately on threshold  
**Conditions:**
- Campaign has sent ≥1 email
- Campaign reaches: 10 replies, 25 replies, 50 replies, 100 contacted

**Email Template:**

```
TO: {user_email}
SUBJECT: 🎯 You've hit 10 replies!

Hi {user_name},

Your "{campaign_name}" campaign just hit 10 replies.

That's solid progress. You're proving the message resonates.

Next step: Keep the momentum going.

[VIEW CAMPAIGN]

Best,
The Outreach Team

---
[Unsubscribe from milestone emails]
```

**Note:** Milestones are **celebratory, not actionable**. Keep them brief and professional (no confetti, no fake urgency).

**Thresholds:**
- 5 replies (early win)
- 10 replies (solid signal)
- 25 replies (10% conversion, strong)
- 50 replies (traction)
- 100 contacted (scale achieved)

**Metrics:**
- Send rate (how many campaigns hit milestones)
- Open rate (lower than reply notifications; expected)
- Emotional impact (survey if users find them encouraging)

---

#### **2.4 — Follow-Up Reminder**

**Trigger:** Follow-up step due tomorrow  
**Timing:** 9 AM, 1 day before follow-up auto-send  
**Conditions:**
- Campaign has follow-up scheduled for tomorrow
- Follow-up hasn't been sent yet
- User hasn't received reminder in last 24 hrs

**Email Template:**

```
TO: {user_email}
SUBJECT: Follow-up reminder — {prospect_count} waiting

Hi {user_name},

Your follow-up to "{campaign_name}" is due tomorrow.

{prospect_count} prospects are waiting for step 2.

[SEND FOLLOW-UP NOW]  [Review Follow-ups]

Send today to maintain momentum.

Best,
The Outreach Team

---
[Unsubscribe]
```

**Action Button (JWT):**

```html
<a 
  href="https://outreach.app/email-actions/send-follow-up?token={{followUpToken}}&campaign_id={{campaignId}}"
>
  SEND FOLLOW-UP NOW
</a>
```

**Metrics:**
- Open rate
- Click rate
- Follow-up send rate (correlation between reminder + actual send)

---

### **TIER 3: RETENTION NOTIFICATIONS**

#### **3.1 — 7-Day Inactivity Re-engagement**

**Trigger:** User hasn't logged in for 7 days  
**Timing:** Day 7, 10 AM (user's timezone)  
**Conditions:**
- User signed up ≥7 days ago
- User hasn't logged in for 7+ days
- User has sent ≥1 campaign
- User hasn't unsubscribed from retention emails

**Email Template:**

```
TO: {user_email}
SUBJECT: Missing your outreach, {user_name}

Hi {user_name},

It's been a week since we've seen you.

Here's what you're missing:
- {last_campaign_replies} new replies waiting
- {draft_campaigns} campaigns ready to send
- {linkedin_pending} LinkedIn connections pending

Jump back in with your next campaign in 2 minutes.

[VIEW DASHBOARD]

We're here when you're ready to get back to outreach.

Best,
The Outreach Team

---
[Unsubscribe from these emails]
```

**Metrics:**
- Send rate (% of eligible users)
- Open rate (indicator of re-engagement success)
- Return rate (did email drive login?)
- Re-activation rate (did user take action after returning?)

---

#### **3.2 — 14-Day Inactivity (Last Chance)**

**Trigger:** User hasn't logged in for 14 days  
**Timing:** Day 14, 10 AM  
**Conditions:**
- User signed up ≥14 days ago
- No login for 14+ days
- Only sent if 7-day email was received (don't re-email immediately)

**Email Template:**

```
TO: {user_email}
SUBJECT: Your outreach campaign is on pause

Hi {user_name},

It's been 2 weeks since your last campaign.

Your prospects are waiting—but more importantly, 
you might be missing opportunities.

Here's how to get back on track:

1. Import prospects (30 seconds)
2. Write a message (2 minutes)
3. Send to {avg_prospect_count} people

Cold email works best with consistent follow-up.
Let's get back to it.

[JUMP BACK IN]

If you're taking a break, no problem. Just let us know.

Best,
The Outreach Team

---
[Pause my account]  [Unsubscribe]
```

**Metrics:**
- Send rate
- Open rate
- Click rate
- Return rate
- Churn rate (compare users who receive this email vs. don't)

---

---

## NOTIFICATION FREQUENCY RULES (Anti-Spam)

To prevent overwhelming users, enforce strict rate limits:

```typescript
// 1. Max 1 "campaign_ready" email per day per user
async function checkCampaignReadyFrequency(userId: string): boolean {
  const recent = await db
    .from('notification_log')
    .select('sent_at')
    .eq('user_id', userId)
    .eq('notification_type', 'campaign_ready')
    .gte('sent_at', subHours(now(), 24));

  return recent.data.length === 0;  // Safe to send if 0 sent today
}

// 2. Batch reply notifications into weekly digest (don't send per-reply if digest enabled)
async function shouldSendReplyNotification(userId: string): boolean {
  const prefs = await getNotificationPreferences(userId);

  // If weekly digest enabled, hold reply notifications for digest
  if (prefs.weekly_digest_enabled) {
    return false;  // Will be included in Sunday digest instead
  }

  // Otherwise, send immediate reply notification
  return true;
}

// 3. Gap rule: Min 48 hrs between re-engagement emails (7-day, 14-day, etc.)
async function checkRetentionEmailGap(userId: string): boolean {
  const recent = await db
    .from('notification_log')
    .select('sent_at')
    .eq('user_id', userId)
    .in('notification_type', ['inactivity_7d', 'inactivity_14d'])
    .gte('sent_at', subHours(now(), 48));

  return recent.data.length === 0;
}

// 4. Never send if user unsubscribed
async function isUserSubscribed(userId: string): boolean {
  const prefs = await getNotificationPreferences(userId);
  return !prefs.unsubscribed;
}

// 5. Respect per-notification-type toggles
async function isNotificationTypeEnabled(
  userId: string,
  notificationType: string
): boolean {
  const prefs = await getNotificationPreferences(userId);
  const typeKey = `${notificationType}_enabled`;  // e.g., 'reply_received_enabled'
  return prefs[typeKey] ?? true;  // Default true if not set
}

// Master function: Should we send?
async function shouldSendNotification(
  userId: string,
  notificationType: string,
  context?: { campaign_id?: string }
): Promise<boolean> {
  // 1. Check if user is subscribed
  if (!await isUserSubscribed(userId)) return false;

  // 2. Check if notification type is enabled
  if (!await isNotificationTypeEnabled(userId, notificationType)) return false;

  // 3. Type-specific frequency checks
  switch (notificationType) {
    case 'campaign_ready':
      return await checkCampaignReadyFrequency(userId);
    case 'reply_received':
      return await shouldSendReplyNotification(userId);
    case 'inactivity_7d':
    case 'inactivity_14d':
      return await checkRetentionEmailGap(userId);
    default:
      return true;
  }
}
```

---

## DATABASE SCHEMA

### **1. User Notification Preferences**

```sql
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- TIER 1: ACTIVATION CRITICAL
  campaign_ready_enabled BOOLEAN DEFAULT true,
  prospects_imported_enabled BOOLEAN DEFAULT true,
  
  -- TIER 2: ENGAGEMENT
  reply_received_enabled BOOLEAN DEFAULT true,
  weekly_digest_enabled BOOLEAN DEFAULT true,
  weekly_digest_day VARCHAR(10) DEFAULT 'sunday',
  weekly_digest_time VARCHAR(5) DEFAULT '09:00',
  milestone_enabled BOOLEAN DEFAULT true,
  follow_up_reminder_enabled BOOLEAN DEFAULT true,
  
  -- TIER 3: RETENTION
  inactivity_7d_enabled BOOLEAN DEFAULT true,
  inactivity_14d_enabled BOOLEAN DEFAULT true,
  
  -- Master controls
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribe_timestamp TIMESTAMP,
  unsubscribe_reason TEXT,
  
  -- User preferences
  email_address TEXT NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  preferred_send_time VARCHAR(5) DEFAULT '09:00',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_notification_preferences_user_id 
  ON user_notification_preferences(user_id);
```

### **2. Notification Log**

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL,
    -- 'campaign_ready', 'reply_received', 'weekly_digest', 
    -- 'milestone', 'follow_up_reminder', 'inactivity_7d', 'inactivity_14d'
  email_address TEXT NOT NULL,
  email_subject TEXT,
  
  -- Send details
  sent_at TIMESTAMP DEFAULT NOW(),
  send_id VARCHAR(255),  -- Provider ID (Sendgrid, etc.)
  
  -- Engagement tracking
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  clicked_link TEXT,  -- Which link/button
  
  -- Action tracking
  action_name VARCHAR(50),  -- 'send_campaign', 'send_follow_up', 'reply', etc.
  action_token VARCHAR(500),  -- JWT token if applicable
  action_completed BOOLEAN DEFAULT false,
  action_completed_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB,  -- Custom data per notification type
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_notification_type ON notification_log(notification_type);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at);
CREATE INDEX idx_notification_log_action_completed ON notification_log(action_completed);
```

### **3. Notification Queue (For Async Processing)**

```sql
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Queue state
  status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'processing', 'sent', 'failed', 'skipped'
  scheduled_for TIMESTAMP,  -- When to send
  
  -- Payload
  email_data JSONB,  -- Email params: to, subject, template vars, etc.
  
  -- Error tracking
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
```

### **4. RLS Policies**

```sql
-- Users see only their own preferences
CREATE POLICY "Users view own notification preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notification preferences"
  ON user_notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users see own notification logs (for analytics)
CREATE POLICY "Users view own notification logs"
  ON notification_log
  FOR SELECT
  USING (user_id = auth.uid());
```

---

## NOTIFICATION SERVICE ARCHITECTURE

### **Service Layer** (`lib/services/notifications.ts`)

```typescript
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

interface NotificationPayload {
  user_id: string;
  notification_type: string;
  campaign_id?: string;
  prospect_id?: string;
  data: Record<string, any>;
}

class NotificationService {
  /**
   * Main entry point: Queue a notification for sending
   */
  async queue(payload: NotificationPayload): Promise<string> {
    // 1. Check rate limits & preferences
    const shouldSend = await this.shouldSendNotification(
      payload.user_id,
      payload.notification_type
    );

    if (!shouldSend) {
      await this.logSkipped(payload);
      return 'skipped';
    }

    // 2. Generate email content
    const email = await this.generateEmailContent(payload);

    // 3. Generate JWT tokens for actionable buttons
    const email_with_actions = await this.injectActionTokens(email, payload);

    // 4. Queue for sending (async)
    const queueId = await this.addToQueue({
      ...payload,
      email_data: email_with_actions,
      scheduled_for: new Date()  // Send immediately
    });

    return queueId;
  }

  /**
   * Check if notification should be sent
   */
  private async shouldSendNotification(
    userId: string,
    notificationType: string
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    // Master unsubscribe check
    if (prefs.unsubscribed) return false;

    // Type-specific enabled check
    const typeKey = `${notificationType}_enabled`;
    if (prefs[typeKey] === false) return false;

    // Frequency rules (defined in Rate Limiting section above)
    const frequency_ok = await this.checkFrequencyRules(userId, notificationType);
    return frequency_ok;
  }

  /**
   * Generate email HTML/text from template
   */
  private async generateEmailContent(
    payload: NotificationPayload
  ): Promise<EmailContent> {
    const template = this.getTemplate(payload.notification_type);
    const user = await this.getUser(payload.user_id);
    
    // Render template with data
    const html = Handlebars.compile(template.html)(
      { ...payload.data, user_name: user.full_name }
    );
    const text = Handlebars.compile(template.text)(
      { ...payload.data, user_name: user.full_name }
    );

    return { html, text, subject: template.subject };
  }

  /**
   * Inject JWT tokens for actionable buttons
   */
  private async injectActionTokens(
    email: EmailContent,
    payload: NotificationPayload
  ): Promise<EmailContent> {
    const actionable_types = ['campaign_ready', 'reply_received', 'follow_up_reminder'];

    if (!actionable_types.includes(payload.notification_type)) {
      return email;  // No tokens needed
    }

    let action_name = '';
    let token_payload = {};

    switch (payload.notification_type) {
      case 'campaign_ready':
        action_name = 'send_campaign';
        token_payload = {
          user_id: payload.user_id,
          campaign_id: payload.campaign_id,
          action: 'send_campaign'
        };
        break;
      case 'reply_received':
        action_name = 'reply';
        token_payload = {
          user_id: payload.user_id,
          prospect_id: payload.prospect_id,
          action: 'reply'
        };
        break;
      case 'follow_up_reminder':
        action_name = 'send_follow_up';
        token_payload = {
          user_id: payload.user_id,
          campaign_id: payload.campaign_id,
          action: 'send_follow_up'
        };
        break;
    }

    const token = jwt.sign(token_payload, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    });

    // Replace token placeholders in email
    email.html = email.html.replace(
      '{{actionToken}}',
      token
    );
    email.html = email.html.replace(
      '{{actionName}}',
      action_name
    );

    return email;
  }

  /**
   * Add notification to processing queue
   */
  private async addToQueue(queuePayload: any): Promise<string> {
    const { data, error } = await supabase
      .from('notification_queue')
      .insert(queuePayload)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Log skipped notification for analytics
   */
  private async logSkipped(payload: NotificationPayload): Promise<void> {
    await supabase.from('notification_log').insert({
      user_id: payload.user_id,
      notification_type: payload.notification_type,
      campaign_id: payload.campaign_id,
      status: 'skipped',
      reason: 'frequency_limit'
    });
  }

  private async getPreferences(userId: string): Promise<any> {
    const { data } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }

  private async getUser(userId: string): Promise<any> {
    const { data } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single();
    return data;
  }

  private getTemplate(notificationType: string): any {
    // Returns template object { html, text, subject }
    // Templates stored in `/emails/templates/`
    return templates[notificationType];
  }

  private async checkFrequencyRules(
    userId: string,
    notificationType: string
  ): Promise<boolean> {
    // Implement frequency rules from Rate Limiting section
    // Returns true if safe to send
    return true;
  }
}

export default new NotificationService();
```

### **Background Job: Queue Processor** (`jobs/notification-queue-worker.ts`)

```typescript
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import notificationService from '@/lib/services/notifications';

/**
 * Run every 5 minutes: process pending notifications
 */
export async function processNotificationQueue() {
  // Get pending notifications (max 100 per batch)
  const { data: pending } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date())
    .limit(100);

  for (const item of pending) {
    try {
      // Mark as processing
      await supabase
        .from('notification_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      // Send via email provider
      const { MessageId } = await sendEmail({
        to: item.email_data.to,
        subject: item.email_data.subject,
        html: item.email_data.html,
        text: item.email_data.text
      });

      // Log successful send
      const logId = await supabase
        .from('notification_log')
        .insert({
          user_id: item.user_id,
          notification_type: item.notification_type,
          campaign_id: item.campaign_id,
          prospect_id: item.prospect_id,
          email_address: item.email_data.to,
          email_subject: item.email_data.subject,
          send_id: MessageId,
          sent_at: new Date()
        })
        .select('id')
        .single();

      // Mark queue item as sent
      await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          updated_at: new Date()
        })
        .eq('id', item.id);

    } catch (error) {
      // Handle retry logic
      const retry_count = item.retry_count + 1;

      if (retry_count < item.max_retries) {
        // Retry: reschedule for 30 mins later
        await supabase
          .from('notification_queue')
          .update({
            retry_count,
            scheduled_for: addMinutes(new Date(), 30)
          })
          .eq('id', item.id);
      } else {
        // Max retries exceeded: mark as failed
        await supabase
          .from('notification_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date()
          })
          .eq('id', item.id);
      }
    }
  }
}
```

---

## EMAIL TEMPLATE SYSTEM

### **Template Structure** (`emails/templates/index.ts`)

Each notification type has a dedicated template with HTML, plain text, and subject.

```typescript
// emails/templates/campaign_ready.ts
export const campaignReady = {
  subject: 'Your campaign is ready to launch',
  html: `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="16px" line-height="1.6">
              Hi {{user_name}},
              <br><br>
              Your {{prospect_count}}-prospect campaign "{{campaign_name}}" is drafted and ready to send.
            </mj-text>
            
            <mj-divider border-color="#e0e0e0"></mj-divider>
            
            <mj-text font-size="14px" color="#666">
              <strong>Preview:</strong>
            </mj-text>
            
            <mj-text font-size="13px" font-family="monospace" background-color="#f5f5f5" padding="16px">
              <strong>To:</strong> {{example_prospect_email}}<br>
              <strong>Subject:</strong> {{subject_line}}<br><br>
              {{message_body_preview}}...
            </mj-text>
            
            <mj-button href="{{actionUrl}}" background-color="#000" padding="16px">
              SEND NOW
            </mj-button>
            
            <mj-button href="{{dashboardUrl}}" background-color="#f0f0f0" color="#000" padding="16px">
              Review in Outreach
            </mj-button>
            
            <mj-divider border-color="#e0e0e0"></mj-divider>
            
            <mj-text font-size="12px" color="#999">
              P.S. Your message will be sent from {{gmail_address}}.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  text: `
    Hi {{user_name}},
    
    Your {{prospect_count}}-prospect campaign "{{campaign_name}}" is drafted and ready to send.
    
    Preview:
    To: {{example_prospect_email}}
    Subject: {{subject_line}}
    
    {{message_body_preview}}...
    
    Send: {{actionUrl}}
    Review: {{dashboardUrl}}
    
    P.S. Your message will be sent from {{gmail_address}}.
  `
};

// emails/templates/reply_received.ts
export const replyReceived = {
  subject: 'Reply from {{prospect_name}}',
  html: `...`,
  text: `...`
};

// ... more templates
```

### **Template Rendering** (`lib/email.ts`)

```typescript
import Handlebars from 'handlebars';
import mjml2html from 'mjml';

export async function renderTemplate(
  template: string,
  data: Record<string, any>
): Promise<{ html: string; text: string }> {
  // Compile Handlebars template
  const compiledHtml = Handlebars.compile(template.html);
  const compiledText = Handlebars.compile(template.text);

  // Render with data
  const html_raw = compiledHtml(data);
  const text = compiledText(data);

  // Convert MJML to HTML
  const { html } = mjml2html(html_raw);

  return { html, text };
}
```

---

## UI: NOTIFICATION PREFERENCES PAGE

### **Location:** `/dashboard/settings/notifications`

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ NOTIFICATION PREFERENCES                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ ACTIVATION ALERTS                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ☑ Campaign ready to send                       │
│   Get notified when a campaign is drafted      │
│   and ready to launch.                         │
│                                                 │
│ ☑ Prospects imported                           │
│   Reminder to write your first message         │
│   after importing prospects.                   │
│                                                 │
│ ENGAGEMENT & REPLIES                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ☑ Reply notifications                          │
│   Get notified when someone replies.           │
│                                                 │
│ ☑ Weekly digest                                │
│   Summary of replies and activity each week.   │
│   Preferred day:  [Sunday ▼]                   │
│   Preferred time: [09:00 ▼]                    │
│                                                 │
│ ☑ Campaign milestones                          │
│   Celebrate when you hit 10 replies, etc.      │
│                                                 │
│ ☑ Follow-up reminders                          │
│   Reminder when follow-ups are due.            │
│                                                 │
│ REENGAGEMENT                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ☑ Inactivity reminders                         │
│   Get pulled back if you go dormant.           │
│                                                 │
│ EMAIL ADDRESS                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ your.email@gmail.com  [Change]                 │
│                                                 │
│ TIMEZONE                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Europe/London ▼]                              │
│                                                 │
│ [Save Preferences]                             │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Unsubscribe from all emails]                  │
│ [Delete my notification history]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// pages/dashboard/settings/notifications.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch user's current preferences
    async function loadPreferences() {
      const { data } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setPrefs(data);
    }
    loadPreferences();
  }, [user.id]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('user_notification_preferences')
      .update(prefs)
      .eq('user_id', user.id);

    if (!error) {
      toast.success('Preferences saved');
    }
    setSaving(false);
  }

  if (!prefs) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Notification Preferences</h1>

      {/* Activation section */}
      <Section title="ACTIVATION ALERTS">
        <Toggle
          label="Campaign ready to send"
          description="Get notified when a campaign is drafted and ready to launch."
          checked={prefs.campaign_ready_enabled}
          onChange={(v) => setPrefs({ ...prefs, campaign_ready_enabled: v })}
        />
        <Toggle
          label="Prospects imported"
          description="Reminder to write your first message after importing prospects."
          checked={prefs.prospects_imported_enabled}
          onChange={(v) => setPrefs({ ...prefs, prospects_imported_enabled: v })}
        />
      </Section>

      {/* Engagement section */}
      <Section title="ENGAGEMENT & REPLIES">
        <Toggle
          label="Reply notifications"
          description="Get notified when someone replies."
          checked={prefs.reply_received_enabled}
          onChange={(v) => setPrefs({ ...prefs, reply_received_enabled: v })}
        />

        <Toggle
          label="Weekly digest"
          description="Summary of replies and activity each week."
          checked={prefs.weekly_digest_enabled}
          onChange={(v) => setPrefs({ ...prefs, weekly_digest_enabled: v })}
        >
          {prefs.weekly_digest_enabled && (
            <div className="mt-4 ml-6 flex gap-4">
              <Select
                label="Day"
                value={prefs.weekly_digest_day}
                onChange={(v) => setPrefs({ ...prefs, weekly_digest_day: v })}
                options={['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']}
              />
              <Select
                label="Time"
                value={prefs.weekly_digest_time}
                onChange={(v) => setPrefs({ ...prefs, weekly_digest_time: v })}
                options={['06:00', '09:00', '12:00', '15:00', '18:00', '21:00']}
              />
            </div>
          )}
        </Toggle>

        {/* More toggles... */}
      </Section>

      {/* Reengagement section */}
      <Section title="REENGAGEMENT">
        <Toggle
          label="Inactivity reminders"
          description="Get pulled back if you go dormant."
          checked={prefs.inactivity_7d_enabled}
          onChange={(v) => setPrefs({ ...prefs, inactivity_7d_enabled: v })}
        />
      </Section>

      {/* Email & Timezone */}
      <Section title="EMAIL & TIMEZONE">
        <Input
          label="Email address"
          type="email"
          value={prefs.email_address}
          onChange={(v) => setPrefs({ ...prefs, email_address: v })}
        />
        <Select
          label="Timezone"
          value={prefs.timezone}
          onChange={(v) => setPrefs({ ...prefs, timezone: v })}
          options={timezones}
        />
      </Section>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button onClick={handleUnsubscribeAll} variant="secondary">
          Unsubscribe from all
        </Button>
      </div>
    </div>
  );
}
```

---

## JWT TOKEN IMPLEMENTATION

### **Token Generation**

All actionable emails contain a signed JWT token that authorizes specific actions without requiring user login.

**Security Considerations:**

1. **Token Expiration:** 7 days (prevents indefinite reuse)
2. **User ID + Action Binding:** Token includes user_id + action to prevent cross-user attacks
3. **One-time verification:** Log token usage to prevent double-sends
4. **HTTP-only cookie support:** Alternative to URL params for extra security (optional)

**Example Token:**

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "campaign_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "action": "send_campaign",
  "email": "coris@example.com",
  "iat": 1681234567,
  "exp": 1681839367  // 7 days later
}
```

**Generation:**

```typescript
function generateActionToken(
  user_id: string,
  action: string,
  payload: Record<string, any>
): string {
  const token = jwt.sign(
    {
      user_id,
      action,
      ...payload,
      email: user.email  // Prevent token reuse across accounts
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  return token;
}
```

**Verification:**

```typescript
function verifyActionToken(token: string): any {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    // Token expired or invalid
    throw new Error('Invalid or expired token');
  }
}
```

---

## API ROUTES FOR EMAIL ACTIONS

### **POST /api/email-actions/send-campaign**

```typescript
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  try {
    // 1. Verify token
    const decoded = verifyActionToken(token);

    // 2. Authorization check
    const campaign = await supabase
      .from('campaigns')
      .select('user_id')
      .eq('id', decoded.campaign_id)
      .single();

    if (campaign.data.user_id !== decoded.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 3. Check for double-send (token already used)
    const used = await supabase
      .from('notification_log')
      .select('id')
      .eq('action_token', token)
      .eq('action_name', 'send_campaign')
      .eq('action_completed', true)
      .single();

    if (used.data) {
      return NextResponse.json(
        { error: 'Token already used. Campaign already sent.' },
        { status: 400 }
      );
    }

    // 4. Send campaign
    const result = await sendCampaign(decoded.campaign_id);

    // 5. Log action completion
    await supabase
      .from('notification_log')
      .update({
        action_completed: true,
        action_completed_at: new Date(),
        clicked_at: new Date()
      })
      .eq('campaign_id', decoded.campaign_id)
      .eq('notification_type', 'campaign_ready');

    // 6. Return success + redirect
    return NextResponse.json({
      success: true,
      campaign_id: decoded.campaign_id,
      redirect: '/dashboard?success=campaign_sent'
    });

  } catch (error: any) {
    console.error('Email action error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}
```

### **POST /api/email-actions/send-follow-up**

```typescript
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  try {
    const decoded = verifyActionToken(token);

    // Similar auth + double-send checks...

    // Send follow-up step
    const result = await sendFollowUpStep(
      decoded.campaign_id,
      decoded.step_number
    );

    await supabase
      .from('notification_log')
      .update({
        action_completed: true,
        action_completed_at: new Date()
      })
      .eq('campaign_id', decoded.campaign_id)
      .eq('notification_type', 'follow_up_reminder');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}
```

### **GET /email-actions/[action]**

For email clients that don't support POST, provide a GET endpoint with token in URL:

```typescript
// GET /email-actions/send-campaign?token=eyJhbGc...
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  // Verify + execute same as POST above

  // Return HTML redirect page:
  return new NextResponse(`
    <html>
      <head>
        <script>
          window.location.href = '/dashboard?action=processing';
        </script>
      </head>
      <body>
        <p>Processing your action...</p>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

---

## NOTIFICATION TRIGGERS (WHEN TO FIRE)

### **Event-Based Triggers**

These fire immediately when conditions are met:

```typescript
// In sendCampaign() function
async function sendCampaign(campaignId: string) {
  // ... send email logic ...

  // Trigger notification
  await notificationService.queue({
    user_id: campaign.user_id,
    notification_type: 'campaign_ready',  // Actually: just sent
    campaign_id: campaignId,
    data: {
      campaign_name: campaign.name,
      prospect_count: prospects.length,
      // ... more data
    }
  });
}

// In Gmail reply detection (Phase 2.9)
async function detectReplyAndNotify(sentEmailId: string) {
  const sentEmail = await db.from('sent_emails').select('*').eq('id', sentEmailId).single();

  // Check Gmail for reply
  const reply = await gmailClient.getThreadReplies(sentEmail.gmail_thread_id);

  if (reply && !sentEmail.notified) {
    await notificationService.queue({
      user_id: sentEmail.user_id,
      notification_type: 'reply_received',
      campaign_id: sentEmail.campaign_id,
      prospect_id: sentEmail.prospect_id,
      data: {
        prospect_name: sentEmail.prospect_name,
        prospect_email: sentEmail.prospect_email,
        reply_subject: reply.subject,
        reply_body: reply.body
      }
    });
  }
}
```

### **Cron-Based Triggers**

These run on schedule:

```typescript
// Run every Sunday at 09:00 in user's timezone
export async function sendWeeklyDigests() {
  const users = await db
    .from('user_notification_preferences')
    .select('user_id, timezone, weekly_digest_time')
    .eq('weekly_digest_enabled', true)
    .eq('unsubscribed', false);

  for (const user of users.data) {
    // Check if it's the right time in user's timezone
    const now = new Date();
    const userTime = toTimeZone(now, user.timezone);

    if (userTime.getDay() === 0 && userTime.getHours() === parseInt(user.weekly_digest_time.split(':')[0])) {
      // Send digest
      await notificationService.queue({
        user_id: user.user_id,
        notification_type: 'weekly_digest',
        data: {
          // ... aggregate data
        }
      });
    }
  }
}

// Run every day to check for milestone campaigns
export async function checkMilestones() {
  const campaigns = await db
    .from('campaigns')
    .select('id, user_id, reply_count')
    .in('reply_count', [5, 10, 25, 50, 100]);

  for (const campaign of campaigns.data) {
    // Check if milestone email already sent
    const already_sent = await db
      .from('notification_log')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('notification_type', 'milestone')
      .single();

    if (!already_sent.data) {
      await notificationService.queue({
        user_id: campaign.user_id,
        notification_type: 'milestone',
        campaign_id: campaign.id,
        data: {
          milestone_count: campaign.reply_count
        }
      });
    }
  }
}

// Run daily at 10:00 UTC to check for inactivity
export async function checkInactivity() {
  // 7-day inactivity
  const inactive_7d = await db
    .from('users')
    .select('id, email')
    .lt('last_login_at', subDays(new Date(), 7))
    .gt('created_at', subDays(new Date(), 30));  // Only for recent signups

  for (const user of inactive_7d.data) {
    const should_send = await shouldSendNotification(user.id, 'inactivity_7d');
    if (should_send) {
      await notificationService.queue({
        user_id: user.id,
        notification_type: 'inactivity_7d',
        data: { /* ... */ }
      });
    }
  }
}
```

---

## ANALYTICS & METRICS

### **Tracking Points**

Every notification is logged with:

```typescript
interface NotificationMetrics {
  notification_id: string;
  sent_at: Date;
  opened_at?: Date;
  first_click_at?: Date;
  action_completed_at?: Date;
  action_name?: string;
  user_id: string;
  notification_type: string;
}
```

### **Key Metrics Dashboard** (`/dashboard/analytics/notifications`)

```
NOTIFICATION PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Campaign Ready Emails
  Sent:           247
  Opened:         156 (63%)
  Clicked:        89 (36%)
  Action Done:    67 (27%)

Reply Received Emails
  Sent:           412
  Opened:         368 (89%)
  Clicked:        284 (69%)
  Responded:      201 (49%)

Weekly Digest
  Sent:           156
  Opened:         98 (63%)
  Clicked:        34 (22%)

Inactivity Emails (7-day)
  Sent:           23
  Opened:         12 (52%)
  Returned:       8 (35%)

USER ENGAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Users with notifications enabled:      387 (92%)
Users who unsubscribed:                10 (2%)
Avg notifications per user per week:   2.3
```

**Implementation:**

```typescript
// lib/analytics/notifications.ts
export async function getNotificationMetrics(dateRange: DateRange) {
  const notifications = await db
    .from('notification_log')
    .select('*')
    .gte('sent_at', dateRange.start)
    .lte('sent_at', dateRange.end);

  const metrics = {
    total_sent: notifications.data.length,
    total_opened: notifications.data.filter(n => n.opened_at).length,
    total_clicked: notifications.data.filter(n => n.clicked_at).length,
    total_actions: notifications.data.filter(n => n.action_completed).length,

    by_type: {} // Group by notification_type
  };

  // Group by type and calculate rates
  for (const type of NOTIFICATION_TYPES) {
    const type_data = notifications.data.filter(n => n.notification_type === type);
    metrics.by_type[type] = {
      sent: type_data.length,
      open_rate: type_data.filter(n => n.opened_at).length / type_data.length,
      click_rate: type_data.filter(n => n.clicked_at).length / type_data.length,
      action_rate: type_data.filter(n => n.action_completed).length / type_data.length,
      avg_time_to_open: calculateAvg(type_data.map(n => n.opened_at - n.sent_at))
    };
  }

  return metrics;
}
```

---

## ROLLOUT STRATEGY

### **Phase 2.X-A: MVP Notifications (Weeks 1–3)**

**Goals:**
- Ship 3 core notifications (campaign ready, reply received, weekly digest)
- Establish infrastructure (queue, templates, logging)
- Validate user preference model

**Implementation:**
1. Week 1: Schema + service layer + templates
2. Week 2: Queue processor + API endpoints + JWT auth
3. Week 3: QA + soft launch to 10% of Pro users

**Soft Launch Criteria:**
- ✅ 0% false sends
- ✅ 99% delivery rate (tracking open events)
- ✅ <1% of users unsubscribe
- ✅ Action completion rate >20%

### **Phase 2.X-B: Advanced Features (Weeks 4–6)**

**Goals:**
- Add follow-up reminders, milestones, inactivity emails
- Launch preference UI
- A/B test subject lines

**Implementation:**
1. Week 4: Follow-up + milestone triggers
2. Week 5: Preference UI + analytics dashboard
3. Week 6: A/B testing framework + gradual rollout

---

## SUCCESS METRICS

### **Tier 1: Activation**

| Metric | Target | Why |
|--------|--------|-----|
| Draft → Send conversion (via email) | +40% | Reduces abandonment |
| Email open rate | >60% | Shows relevance |
| Action completion rate | >25% | Validates JWT flow |

### **Tier 2: Engagement**

| Metric | Target | Why |
|--------|--------|-----|
| Reply notification open rate | >80% | Users care about replies |
| Response time (reply → action) | <2 hrs | Measures urgency |
| Weekly digest return rate | >30% | Drives re-engagement |

### **Tier 3: Retention**

| Metric | Target | Why |
|--------|--------|-----|
| 7-day inactivity recovery | +25% | Prevents churn |
| Unsubscribe rate | <5% | Prevents list decay |
| Repeated campaign creation | +35% | Measures habit formation |

---

## RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Notification fatigue** | Users unsubscribe | Strict rate limits; sparse frequency; user control |
| **JWT token abuse** | Security breach | Short expiration (7d); user_id binding; logging |
| **Email deliverability** | Notifications never arrive | Use reputable provider (Sendgrid); monitor bounce rate |
| **False sends** | User trust erosion | Rigorous testing; double-send prevention; logging |
| **Timezone handling** | Wrong send times | Test all major timezones; user can override |
| **No action on email** | Users still need to log in | Ensure most critical actions have JWT buttons |

---

## FUTURE ENHANCEMENTS (Layer 5+)

- **Smart sending time:** ML-based optimal send time per user
- **Personalized subject lines:** A/B tested dynamic subjects
- **SMS + Push notifications:** Expand beyond email
- **Notification API:** Let users trigger custom notifications
- **Template marketplace:** User-created notification templates
- **Conditional logic:** Send notification only if X hasn't happened

---

## IMPLEMENTATION CHECKLIST

**Before Launch:**
- [ ] Database schema created + RLS policies
- [ ] NotificationService class built + tested
- [ ] Queue processor running + monitoring
- [ ] Email templates designed + rendered correctly
- [ ] JWT token generation + verification working
- [ ] API endpoints tested (POST + GET variants)
- [ ] Notification preferences UI built
- [ ] Analytics instrumentation complete
- [ ] Rate-limiting rules enforced
- [ ] Unsubscribe mechanism working
- [ ] Email provider setup (Sendgrid/Mailgun)
- [ ] Error handling + retry logic solid
- [ ] Documentation + runbooks written

**After Soft Launch:**
- [ ] Monitor unsubscribe rate
- [ ] Monitor action completion rates
- [ ] Collect user feedback
- [ ] Fix any false sends
- [ ] Tune rate limits based on data
- [ ] A/B test subject lines
- [ ] Gradual rollout to 100%

---

## CONCLUSION

The Email Notification System is a **force multiplier for activation and retention**. By sending contextual, actionable emails with JWT-signed tokens, you enable users to take critical actions without leaving their inbox.

**Key wins:**
1. **Activation:** Draft → Send conversion increases 40%+ (removes friction)
2. **Engagement:** Reply notifications drive immediate re-engagement (highest open rate)
3. **Retention:** Inactivity emails recover 25%+ of at-risk users
4. **Trust:** Shows the system is always "listening" and responsive

**Implementation is non-trivial** (35–50 hours), but ROI is massive. Prioritize after core product (2.14) is locked.


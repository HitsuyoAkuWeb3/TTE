# TTE Vernacular Dictionary — Complete Reference

**Source**: `contexts/VernacularContext.tsx` (981 lines)
**Total Keys**: 226 (across interface `VernacularDictionary`)
**Last Updated**: Feb 2026

## How to Use

```tsx
const { v, mode, setMode } = useVernacular();
// Then: <h1>{v.phase_armory}</h1>
```

For non-React code (services): use `LABELS[mode]` registry pattern.

---

## Phase Names

| Key | Mythic (⚔ Architect) | Industrial (⚙ Strategist) | Plain (🛠 Builder) |
|:----|:----------------------|:---------------------------|:-------------------|
| `phase_armory` | The Armory | Asset Inventory | Your Skills |
| `phase_scoring` | The Crucible | Performance Audit | Skill Scorecard |
| `phase_lock` | The Verdict | Selection Report | Your Best Skill |
| `phase_synthesis` | Value Chemistry | Market Analysis | Your Offer |
| `phase_installation` | The Installation | Launch Protocol | Your Game Plan |
| `phase_calibration` | Neural Calibration | Operator Setup | About You |
| `phase_archive` | Dossier Archive | Report Archive | Saved Plans |
| `ritual_dashboard` | Ritual Dashboard | Operations Dashboard | Daily Tracker |

## Quadrant Labels

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `quadrant_sandbox` | Sandbox | R&D | For Fun |
| `quadrant_mischief` | Mischief | Disruptor | Side Hustle |
| `quadrant_craft` | Craft | Core Process | Day Job |
| `quadrant_ritual` | Ritual | SOP | Daily Habit |

## Scoring Dimensions

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `score_unbidden` | Unbidden Requests | Inbound Demand | People Ask You |
| `score_frictionless` | Frictionless Doing | Execution Speed | Easy for You |
| `score_evidence` | Result Evidence | ROI Evidence | Proof It Works |
| `score_extraction` | Extraction Risk | Dependency Risk | Depends on You |

## Scoring Sublabels

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `sublabel_unbidden` | Do clients request this without you marketing it? | How often do clients request this service unprompted? | Do people come to you for this without you asking? |
| `sublabel_frictionless` | Can you deliver this in your sleep? | Can you execute this deliverable in under 30 minutes? | Could you do this in 30 minutes without thinking? |
| `sublabel_evidence` | Do you have undeniable proof this generates revenue? | Do you have documented case studies or revenue metrics? | Do you have examples or results to show? |
| `sublabel_extraction` | Does this revenue stop if you take a vacation? | Is this revenue tied to your personal availability? | Does it stop working when you stop doing it? |

## System Language

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `tool_singular` | Weapon | Asset | Skill |
| `tool_plural` | Weapons | Assets | Skills |
| `starting_tool` | Starting Tool | Primary Asset | Best Skill |
| `locked_tool` | Locked Weapon | Selected Asset | Chosen Skill |
| `theory_of_value` | Theory of Value | Value Proposition | Your Value |
| `godfather_offer` | Godfather Offer | Premium Offer | Your Offer |
| `fatal_wound` | Fatal Wound | Core Problem | The Problem You Solve |
| `sacred_cow` | Sacred Cow | Market Assumption | Common Myth |
| `molecular_bond` | Molecular Bond | Competitive Edge | What Makes You Different |
| `shadow_beliefs` | Shadow Beliefs | Market Friction Points | Hidden Doubts |

## Actions

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `action_forge` | Forge | Analyze | Add |
| `action_lock` | Lock | Select | Pick |
| `action_scan` | Radar Scan | Market Scan | Search |
| `action_challenge` | Challenge | Audit | Test |

## Status Labels

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `status_pass` | SOVEREIGN | VALIDATED | READY TO GO |
| `status_fail` | REJECTED | INSUFFICIENT DATA | NEEDS WORK |
| `status_risk` | CONTAINMENT REQ | HIGH DEPENDENCY | TOO DEPENDENT ON YOU |
| `status_asset` | SCALABLE ASSET | SCALABLE REVENUE | CAN SCALE |

## App Shell

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `menu_archive` | [ DOSSIER ARCHIVE ] | [ REPORT ARCHIVE ] | [ SAVED PLANS ] |
| `menu_calibrate` | [ RE-CALIBRATE ] | [ UPDATE PROFILE ] | [ EDIT PROFILE ] |
| `menu_logout` | [ TERMINATE LINK ] | [ SIGN OUT ] | [ LOG OUT ] |
| `footer_archive_link` | Access Existing Dossiers | View Past Reports | View Saved Plans |
| `xp_calibration` | Calibration Complete | Profile Updated | Profile Saved |
| `xp_finalized` | Dossier Finalized | Report Finalized | Plan Finalized |
| `xp_burned` | Tool Burned — Space Cleared | Asset Retired | Skill Removed |

## Calibration Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `calibration_title` | Neural Calibration System | Operator Setup | About You |
| `calibration_subtitle` | Operator Profiling & Identity Ledger | Analyst Profiling & Domain Registry | Tell us about your work |
| `label_name` | Operator Alias | Analyst Name | Your Name |
| `label_industry` | Domain of Operation | Market Domain | Your Industry |
| `label_goal` | Core Strategic Directive | Primary Business Objective | Your Main Goal |
| `label_tone` | Architectural Tone | Communication Style | Communication Style |
| `placeholder_name` | e.g., ARCHITECT 01 | e.g., J. Smith | e.g., Sarah Johnson |
| `placeholder_industry` | e.g., Enterprise Software / BioTech | e.g., SaaS / Consulting / E-Commerce | e.g., Fitness Coaching / Real Estate |
| `placeholder_goal` | e.g., Automate client acquisition... | e.g., Scale revenue to $50k/month... | e.g., Get more clients online... |
| `calibration_submit` | Finalize Calibration | Save Configuration | Save & Continue |
| `calibration_footer` | TetraTool // Profile Ledger Locked After Initialization | TetraTool // Operator profile saved securely | TetraTool // Your profile is saved automatically |

## Value Chemistry Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `synthesis_title` | Molecular Synthesis | Market Synthesis | Build Your Offer |
| `synthesis_subtitle` | Identify the Root Glitch. Manufacture Certainty. | Identify the core market gap. Build the value proposition. | Find the real problem your audience has. Show why you solve it. |
| `synthesis_scan_ready` | Ready to scan the MVA Radar for | Ready to conduct market scan for | Ready to research the audience for |
| `synthesis_scan_cta` | INITIALIZE RADAR SCAN | START MARKET SCAN | START RESEARCH |
| `synthesis_scanning` | [ SCANNING NICHE FORUMS... ] | [ ANALYZING MARKET DATA... ] | [ RESEARCHING YOUR AUDIENCE... ] |
| `synthesis_scanning_detail` | Extracting Shadow Beliefs & Fatal Wound patterns | Extracting market friction & core problem patterns | Finding hidden doubts & problem patterns |
| `synthesis_shadow_title` | Shadow Belief Inventory | Market Friction Inventory | Hidden Doubts Your Audience Has |
| `synthesis_complete` | Chemistry extracted. Ready for White Paper synthesis. | Analysis complete. Ready for value proposition synthesis. | Research complete. Ready to build your offer. |
| `synthesis_build_cta_prefix` | ARCHITECT | BUILD | BUILD |
| `synthesis_forging` | [ THE FORGE IS ACTIVE ] | [ BUILDING VALUE PROPOSITION... ] | [ BUILDING YOUR OFFER... ] |
| `synthesis_back` | RETURN TO PREVIOUS PHASE | BACK TO PREVIOUS STEP | GO BACK |

## Installation Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `dossier_badge_sovereign` | SOVEREIGN DOSSIER | PRIMARY ASSET REPORT | YOUR REPORT |
| `dossier_badge_official` | OFFICIAL DOSSIER | ASSET REPORT | YOUR REPORT |
| `tov_summary_label` | Forensic Theory of Value v.1 | Value Proposition Summary | Your Value Summary |
| `tov_promise_label` | The Magick Pill Promise | Core Transformation Promise | The Promise |
| `generate_plan` | Generate 7-Day Pilot Protocol | Generate 7-Day Launch Protocol | Create 7-Day Action Plan |
| `generating_plan` | Architecting Pilot... | Building Launch Plan... | Creating your plan... |
| `plan_title` | 7-Day Installation Protocol | 7-Day Launch Protocol | 7-Day Action Plan |
| `listen_idle` | Listen to Protocol | Listen | Listen |
| `listen_playing` | Broadcasting... | Playing... | Playing... |
| `download_pdf` | Download Dossier (PDF) | Download Report (PDF) | Download Report (PDF) |
| `export_calendar` | 📅 Export 7-Day Protocol (.ics) | 📅 Export Launch Calendar (.ics) | 📅 Export 7-Day Plan (.ics) |
| `save_plan` | Commit Protocol to System | Save Report | Save My Plan |
| `saving_plan` | Synching with Neural Link... | Saving... | Saving... |
| `finalize_dossier` | ⬡ Finalize Dossier | ⬡ Finalize Report | ⬡ Lock It In |

## Archive Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `archive_title` | Dossier Archive | Report Archive | Your Saved Plans |
| `archive_subtitle` | Previously completed protocol sessions | Previously completed analysis sessions | Plans you've created before |
| `archive_new_button` | + New Session | + New Analysis | + Start New Plan |
| `archive_loading` | Decrypting... | Loading... | Loading your plans... |
| `archive_empty` | No sessions found. Begin a new calibration to start. | No reports found. Start a new analysis to begin. | No plans yet. Start a new one to begin. |
| `archive_subject_label` | Subject | Analyst | Name |
| `archive_footer` | TetraTool // Sovereign Architecture | TetraTool // Strategic Operations | TetraTool // Your Plans |

## Ritual Dashboard

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `ritual_subtitle` | Daily execution tracking. The data does not lie. | Daily KPI tracking. Numbers don't lie. | Track your daily progress. Numbers tell the truth. |
| `ritual_active_weapon` | Active Weapon | Primary Asset | Your Current Skill |
| `ritual_offer_label` | Godfather Offer | Premium Offer | Your Offer |
| `ritual_warning_title` | ⚠ FALSE POSITIVE WARNING | ⚠ ENGAGEMENT ALERT | ⚠ HEADS UP |
| `ritual_warning_detail` | It has been {days} days since your last entry. Consistency is non-negotiable. | It has been {days} days since your last entry. Consistency drives results. | It has been {days} days since your last entry. Try to stay consistent! |
| `ritual_log_button` | Log Ritual | Log Activity | Log Today |
| `ritual_entry_title` | Today's Entry Logged | Entry Logged | Today's Entry Saved |
| `ritual_mood_label` | Mood | Status | How Are You Feeling? |
| `ritual_notes_label` | Field Notes | Notes | Notes |
| `ritual_commit` | Commit Entry | Submit Entry | Save Entry |
| `ritual_history_title` | Ritual History | Activity History | History |
| `ritual_reaudit_button` | Re-Run Audit → | Re-Run Assessment → | Re-Run Audit → |

## Auth Terminal

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `auth_title` | NEURAL VAULT / AUTH | SECURE LOGIN | SIGN IN |
| `auth_subtitle` | Awaiting Verification Handshake | Authenticate to proceed | Log in to continue |
| `auth_footer` | TetraTool Engine // Enterprise Node | TetraTool Engine // Secure Portal | TetraTool Engine // Welcome |

## Refinement Terminal

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `refine_title` | Protocol Patch Terminal | Report Editor | Edit Your Plan |
| `refine_subtitle` | Authorized Access: Senior Architect | Modify your launch protocol | Make changes to your action plan |
| `refine_log_label` | // System Log Active | // Processing | // Ready |
| `refine_log_waiting` | > Awaiting user optimization signals... | > Awaiting your feedback... | > Waiting for your feedback... |
| `refine_log_processing` | > RE-CALCULATING PROPORTIONS... [GEM-3-FLASH] | > UPDATING REPORT... | > UPDATING YOUR PLAN... |
| `refine_input_label` | Input Optimization Feedback | Your Feedback | What would you change? |
| `refine_cta` | EXECUTE RE-SYNTHESIS | UPDATE REPORT | UPDATE PLAN |
| `refine_cta_processing` | PROCESSING PATCH... | UPDATING... | UPDATING... |
| `refine_footer` | TetraTool Engine // Live Refinement Node | TetraTool Engine // Report Editor | TetraTool Engine // Plan Editor |

## Pyre (Tool Retirement)

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `pyre_title` | The Pyre | Asset Retirement | Remove Skill |
| `pyre_subtitle` | Tool Retirement Ceremony | Asset Decommission | Skill Removal |
| `pyre_target_label` | Weapon to Burn | Asset to Retire | Skill to Remove |
| `pyre_description` | This tool no longer serves the mission. Burning it clears space for a new Starting Tool. This action archives the tool permanently. | This asset no longer aligns with your strategy. Retiring it clears space for a new primary asset. | This skill no longer fits your goals. Removing it clears space for something better. This action is permanent. |
| `pyre_cancel` | Stand Down | Cancel | Cancel |
| `pyre_ignite` | 🔥 Ignite the Pyre | 🔥 Retire Asset | 🔥 Remove Skill |
| `pyre_progress_label` | Burning | Retiring | Removing |
| `pyre_complete` | Archived. Space cleared for evolution. | Retired. Capacity freed for new assets. | Removed. Space cleared for new skills. |

## Axis Labels (ArmoryMap)

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `axis_top` | INSTRUMENT (DISCIPLINE) | STRUCTURED (DISCIPLINE) | STRUCTURED |
| `axis_bottom` | TOY (DISCOVERY) | EXPLORATORY (INNOVATION) | EXPLORATORY |
| `axis_left` | TOOL (CONSTRUCTION) | DELIVERY (PRODUCTION) | BUILDING |
| `axis_right` | WEAPON (DISRUPTION) | DISRUPTION (MARKET IMPACT) | DISRUPTING |

## Quadrant Hover Info

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `quadrant_craft_title` | The Builder | The Producer | The Builder |
| `quadrant_craft_desc` | You use discipline to construct lasting systems. | Disciplined execution of repeatable systems. | You use discipline to build lasting systems. |
| `quadrant_craft_examples` | Engineering, Writing Code, Architecture | Operations, SOPs, Process Design | Engineering, Writing, Project Management |
| `quadrant_ritual_title` | The Critic | The Optimizer | The Analyst |
| `quadrant_ritual_desc` | You use discipline to audit or disrupt systems. | Systematic improvement of existing processes. | You use discipline to evaluate and improve systems. |
| `quadrant_ritual_examples` | Code Review, QA, Security Research | QA, Compliance, Performance Reviews | Quality Checks, Reviews, Research |
| `quadrant_sandbox_title` | The Explorer | The Innovator | The Explorer |
| `quadrant_sandbox_desc` | You play to discover new patterns or ideas. | Exploratory work to discover new opportunities. | You play to discover new patterns or ideas. |
| `quadrant_sandbox_examples` | Prototyping, Brainstorming, Sketching | R&D, Prototyping, Market Research | Brainstorming, Prototyping, Experimenting |
| `quadrant_mischief_title` | The Hacker | The Disruptor | The Disruptor |
| `quadrant_mischief_desc` | You play to break or exploit existing patterns. | Challenging established norms for competitive advantage. | You play to challenge or change existing patterns. |
| `quadrant_mischief_examples` | Pentesting, Pranks, guerrilla marketing | Growth Hacking, Competitive Analysis, Pivots | Growth Hacking, Testing Limits, Marketing |

## Intro Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `intro_headline_1` | Tetra | Asset | Figure out |
| `intro_headline_2` | Tool | Discovery | what you're |
| `intro_headline_3` | Engine | Engine | best at. |
| `intro_subtitle` | POST-NEON DIAGNOSTIC ENGINE v2.0... | STRATEGIC ASSET IDENTIFICATION SUITE v2.0... | Answer some questions about your skills... |
| `intro_input_label` | Subject Identification [Entity Name] | Client / Organization Name | What's your name? |
| `intro_placeholder` | Enter Client/Entity Name | Enter client name | Your name |
| `intro_button` | Initialize System | Begin Assessment | Let's Go → |
| `intro_mode_label` | Interface Mode | Interface Mode | How do you think about your work? |

## Tool Lock Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `lock_phase_prefix` | Phase 4: | Phase 4: | Step 4: |
| `lock_confirm` | Confirm | Select | Pick This |

## Global Labels

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `unknown_subject` | Unknown Subject | Unknown Organization | Unknown Person |
| `label_pts` | PTS | PTS | POINTS |
| `phase_label` | Phase | Phase | Step |

## Armory Audit Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `armory_subtitle` | List every recurring activity. Verbs only. No metaphors. | Log every recurring professional activity. Action verbs only. | List everything you do regularly. Use action words. |
| `armory_view_spatial` | Spatial Forge | Grid View | Visual Map |
| `armory_view_terminal` | Terminal Audit | Table View | List View |
| `armory_list_title` | My Armory | My Assets | My Skills |
| `armory_empty_spatial` | Armory empty. Add at least 3 items to map your arsenal. | No assets logged. Add at least 3 to generate your map. | No skills added yet. Add at least 3 to see your map. |
| `armory_empty_terminal` | Armory empty. Start adding items above. | No assets yet. Start adding above. | No skills yet. Start adding above. |
| `armory_status_label` | items | assets | skills |
| `armory_proceed` | Proceed to Compression → | Proceed to Performance Audit → | Next Step → |

## Evidence Scoring Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `scoring_subtitle` | Evidence Gates. High claims require high proof. | Score each asset against performance benchmarks. | Rate how strong each skill really is. Be honest. |
| `scoring_challenging` | ⚡ Adversarial Auditor scanning your claim... | ⚡ Validating claim against benchmark... | ⚡ Checking your claim... |
| `scoring_proof_unbidden` | Evidence Required — Paste DMs, Emails, or Requests | Evidence Required — Paste Inbound Communications | Show proof — paste messages, emails, or requests |
| `scoring_proof_result` | Evidence Required — Paste Testimonial or Metric | Evidence Required — Paste Case Study or Metric | Show proof — paste a testimonial or result |
| `scoring_risk_explanation` | HIGH = You ARE the product (job). LOW = The product works without you (asset). | HIGH = Revenue requires your presence. LOW = Revenue persists without you. | HIGH = You have to do it yourself (a job). LOW = It works without you (an asset). |
| `scoring_proceed` | Audit Complete → Lock Tool | Audit Complete → Select Asset | Done → Pick Your Best Skill |

## Tool Compression Phase

| Key | Mythic | Industrial | Plain |
|:----|:-------|:-----------|:------|
| `compression_sovereign_badge` | SOVEREIGN AUTHORITY | PRIMARY ASSET | YOUR TOP SKILL |
| `compression_sovereign_synthesizing` | Synthesizing Authority... | Consolidating Assets... | Combining... |
| `compression_sovereign_button` | Refine into One Sovereign Authority | Consolidate into Primary Asset | Combine Into One Top Skill |
| `compression_compress_button` | Compress into Market Function | Analyze Market Position | Analyze My Top Skills |
| `compression_result_subtitle` | The Engine has compressed your skills into commercially viable functions. | Your skills have been mapped to commercially viable professional functions. | We turned your skills into roles you can sell. |
| `compression_result_title` | Market Synthesis | Market Analysis | Your Skills |
| `compression_proceed` | Proceed to Evidence → | Proceed to Validation → | Next Step → |
| `compression_select_subtitle` | Select 3 core activities. The AI will synthesize them into market roles. | Select 3 key competencies. The system will map them to market functions. | Choose 3 things you do best. We will figure out how to sell them. |
| `compression_cap_warning` | ⚠ ARMORY OVERLOADED | ⚠ INVENTORY OVERLOADED | ⚠ TOO MANY SKILLS |
| `compression_cap_explainer` | The 80/20 rule: your top 20% of skills generate 80% of value. Compress or delete until ≤ {cap}. | The Pareto principle: 20% of your competencies generate 80% of value. Consolidate until ≤ {cap}. | Focus on the 20% of skills that create 80% of your value. Remove or merge until you have {cap} or fewer. |
| `compression_analyzing_hint` | Applying 32k context reasoning to niche down... | Evaluating market positioning vectors... | Finding the best way to package your skills... |
| `compression_select_title` | Skill Selection | Competency Selection | Pick Your Top Skills |
| `compression_merge_header` | Compression Recommendations | Consolidation Recommendations | Suggested Combinations |

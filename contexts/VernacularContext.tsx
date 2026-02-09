import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// THE VERNACULAR ENGINE — Cross-Domain Translation Layer
// ============================================================
// The logic remains identical (Input -> Process -> Output).
// The Label Layer shifts based on user archetype.
//
// Setting A (Mythic):     "Toy / Weapon / Ritual"
// Setting B (Industrial): "R&D / Disruptor / SOP"
// Setting C (Plain):      "For Fun / Side Hustle / Daily Habit"
// ============================================================

export type VernacularMode = 'mythic' | 'industrial' | 'plain';

export interface VernacularDictionary {
    // Phase names
    phase_armory: string;
    phase_scoring: string;
    phase_lock: string;
    phase_synthesis: string;
    phase_installation: string;
    phase_calibration: string;
    phase_archive: string;
    ritual_dashboard: string;

    // Tool categories (Quadrant labels)
    quadrant_sandbox: string;
    quadrant_mischief: string;
    quadrant_craft: string;
    quadrant_ritual: string;

    // Scoring dimensions
    score_unbidden: string;
    score_frictionless: string;
    score_evidence: string;
    score_extraction: string;

    // Scoring sublabels
    sublabel_unbidden: string;
    sublabel_frictionless: string;
    sublabel_evidence: string;
    sublabel_extraction: string;

    // System language
    tool_singular: string;
    tool_plural: string;
    starting_tool: string;
    locked_tool: string;
    theory_of_value: string;
    godfather_offer: string;
    fatal_wound: string;
    sacred_cow: string;
    molecular_bond: string;
    shadow_beliefs: string;

    // Actions
    action_forge: string;
    action_lock: string;
    action_scan: string;
    action_challenge: string;

    // Status
    status_pass: string;
    status_fail: string;
    status_risk: string;
    status_asset: string;

    // ── App Shell (menus, navigation) ──────────────────
    menu_archive: string;
    menu_calibrate: string;
    menu_logout: string;
    footer_archive_link: string;
    xp_calibration: string;
    xp_finalized: string;
    xp_burned: string;
    xp_armory_item: string;
    xp_compressed: string;
    xp_scored: string;
    xp_locked: string;
    xp_theory: string;
    xp_ritual_entry: string;
    ceremony_overline: string;
    ceremony_level: string;
    ceremony_dismiss: string;

    // ── Calibration Phase ──────────────────────────────
    calibration_title: string;
    calibration_subtitle: string;
    label_name: string;
    label_industry: string;
    label_goal: string;
    label_tone: string;
    placeholder_name: string;
    placeholder_industry: string;
    placeholder_goal: string;
    calibration_submit: string;
    calibration_footer: string;

    // ── Value Chemistry Phase ──────────────────────────
    synthesis_title: string;
    synthesis_subtitle: string;
    synthesis_scan_ready: string;
    synthesis_scan_cta: string;
    synthesis_scanning: string;
    synthesis_scanning_detail: string;
    synthesis_shadow_title: string;
    synthesis_complete: string;
    synthesis_build_cta_prefix: string;
    synthesis_forging: string;
    synthesis_back: string;

    // ── Installation Phase ────────────────────────────
    dossier_badge_sovereign: string;
    dossier_badge_official: string;
    tov_summary_label: string;
    tov_promise_label: string;
    generate_plan: string;
    generating_plan: string;
    plan_title: string;
    listen_idle: string;
    listen_playing: string;
    download_pdf: string;
    export_calendar: string;
    save_plan: string;
    saving_plan: string;
    finalize_dossier: string;

    // ── Archive Phase ─────────────────────────────────
    archive_title: string;
    archive_subtitle: string;
    archive_new_button: string;
    archive_loading: string;
    archive_empty: string;
    archive_subject_label: string;
    archive_footer: string;

    // ── Ritual Dashboard ──────────────────────────────
    ritual_subtitle: string;
    ritual_active_weapon: string;
    ritual_offer_label: string;
    ritual_warning_title: string;
    ritual_warning_detail: string;
    ritual_log_button: string;
    ritual_entry_title: string;
    ritual_mood_label: string;
    ritual_notes_label: string;
    ritual_commit: string;
    ritual_history_title: string;

    // ── Auth Terminal ─────────────────────────────────
    auth_title: string;
    auth_subtitle: string;
    auth_footer: string;

    // ── Refinement Terminal ───────────────────────────
    refine_title: string;
    refine_subtitle: string;
    refine_log_label: string;
    refine_log_waiting: string;
    refine_log_processing: string;
    refine_input_label: string;
    refine_cta: string;
    refine_cta_processing: string;
    refine_footer: string;

    // ── Tone Warden (Signal Fidelity) ─────────────────
    warden_title: string;
    warden_subtitle: string;
    warden_input_label: string;
    warden_input_placeholder: string;
    warden_analyze_cta: string;
    warden_analyzing: string;
    warden_score_label: string;
    warden_rewrite_label: string;
    warden_copy_cta: string;
    warden_drift_label: string;

    // ── Pyre (tool retirement) ────────────────────────
    pyre_title: string;
    pyre_subtitle: string;
    pyre_target_label: string;
    pyre_description: string;
    pyre_cancel: string;
    pyre_confirm_prompt: string;
    pyre_confirm_mismatch: string;
    pyre_confirm_oath: string;
    pyre_ignite: string;
    pyre_progress_label: string;
    pyre_complete: string;

    // ── Axis labels (ArmoryMap) ───────────────────────
    axis_top: string;
    axis_bottom: string;
    axis_left: string;
    axis_right: string;

    // ── ArmoryMap hover info ──────────────────────────
    quadrant_craft_title: string;
    quadrant_craft_desc: string;
    quadrant_craft_examples: string;
    quadrant_ritual_title: string;
    quadrant_ritual_desc: string;
    quadrant_ritual_examples: string;
    quadrant_sandbox_title: string;
    quadrant_sandbox_desc: string;
    quadrant_sandbox_examples: string;
    quadrant_mischief_title: string;
    quadrant_mischief_desc: string;
    quadrant_mischief_examples: string;

    // ── Intro Phase ──────────────────────────────────
    intro_headline_1: string;
    intro_headline_2: string;
    intro_headline_3: string;
    intro_subtitle: string;
    intro_input_label: string;
    intro_placeholder: string;
    intro_button: string;
    intro_mode_label: string;

    lock_phase_prefix: string;
    lock_confirm: string;

    // ── Global Labels ────────────────────────────────
    unknown_subject: string;
    label_pts: string;
    phase_label: string; // 'Phase' or 'Step'

    // ── Armory Audit Phase (inline) ───────────────────
    armory_subtitle: string;
    armory_view_spatial: string;
    armory_view_terminal: string;
    armory_list_title: string;
    armory_empty_spatial: string;
    armory_empty_terminal: string;
    armory_status_label: string;
    armory_proceed: string;
    armory_cap_locked: string;
    armory_cap_locked_detail: string;
    armory_cap_input_blocked: string;
    warden_intercept_blocked: string;
    warden_intercept_warning: string;
    cremate_toggle: string;
    cremate_title: string;
    cremate_warning: string;
    cremate_confirm_prompt: string;
    cremate_button: string;
    xp_phoenix_reborn: string;
    degraded_banner: string;
    degraded_detail: string;
    interrogation_title: string;
    interrogation_placeholder: string;
    interrogation_xp: string;
    xp_interrogation: string;
    scaffold_title: string;
    scaffold_success_signal: string;
    scaffold_proceed: string;
    simulation_title: string;
    simulation_placeholder: string;
    simulation_exit: string;
    simulation_complete: string;
    simulation_fail_msg: string;
    simulation_score_label: string;
    simulation_archetype_label: string;
    simulation_start_btn: string;
    simulation_pass_msg: string;

    // ── Evidence Scoring Phase (inline) ───────────────
    scoring_subtitle: string;
    scoring_challenging: string;
    scoring_proof_unbidden: string;
    scoring_proof_result: string;
    scoring_risk_explanation: string;
    scoring_proceed: string;

    // ── Tool Compression Phase ────────────────────────
    compression_sovereign_badge: string;
    compression_sovereign_synthesizing: string;
    compression_sovereign_button: string;
    compression_compress_button: string;
    compression_result_subtitle: string;
    compression_result_title: string;
    compression_proceed: string;
    compression_select_subtitle: string;
    compression_cap_warning: string;
    compression_cap_explainer: string;
    compression_analyzing_hint: string;
    compression_select_title: string;
    compression_merge_header: string;
    chimera_bond_label: string;
    chimera_result_subtitle: string;
    chimera_fused_from: string;
    chimera_count: string;

    // ── Ritual Dashboard ─────────────────────────────
    ritual_reaudit_button: string;
    ritual_streak: string;
    ritual_signal_fidelity: string;
    ritual_multiplier: string;

    // ── Cortex Terminal ──────────────────────────────
    cortex_status: string;

    // ── Signal Triangulation ─────────────────────────
    triangulation_title: string;
    triangulation_subtitle: string;
    triangulation_q1: string;
    triangulation_q2: string;
    triangulation_q3: string;
    triangulation_label_1: string;
    triangulation_label_2: string;
    triangulation_label_3: string;
    triangulation_next: string;
    triangulation_cta: string;
    triangulation_synthesizing: string;
    triangulation_footer: string;
    triangulation_placeholder: string;
    triangulation_button: string;

    // ── Candidate Card Labels ────────────────────────
    primitives_menu: string;
    deck_of_sparks: string;
    candidate_function: string;
    candidate_promise: string;
    candidate_antipitch: string;

    // ── Tier 1: Citadel Hardening ────────────────────
    session_vow_title: string;
    session_vow_operator_label: string;
    session_vow_directive_label: string;
    session_vow_define_directive: string;
    session_vow_placeholder: string;
    session_vow_confirm: string;
    session_vow_edit: string;
    session_vow_initializing: string;
    session_vow_hold: string;

    resurrection_alert: string;
    resurrection_inactive_label: string;
    resurrection_message: string;
    resurrection_placeholder: string;
    resurrection_reactivating: string;
    resurrection_initiate: string;
    resurrection_protocol_active: string;

    flow_optimal: string;
    flow_caution: string;
    flow_breach: string;
    flow_offline: string;

    decay_cooling: string;
    decay_stale: string;
    decay_decaying: string;
    decay_plan_status: string;
    decay_last_activity: string;

    // ── Installation Button Tooltips ─────────────────
    tip_download_pdf: string;
    tip_export_calendar: string;
    tip_save: string;
    tip_finalize: string;
    tip_finalize_locked: string;
    tip_fork: string;
    tip_copy_md: string;


    // ── Installation Alerts & Market ─────────────────
    alert_critical_gap: string;
    alert_tov_missing: string;
    alert_run_upgrade: string;
    market_status_title: string;
    status_containment: string;
    status_scalable: string;
    market_searching: string;
    market_run_search: string;
    proof_ledger_title: string;
    change_tool: string;
    copy_protocol: string;
    iterate_protocol: string;
    consultation_coming_soon: string;

    // Proof Tier
    tier_label: string;
    tier_seed: string;
    tier_draft: string;
    tier_near_final: string;
    tier_artifact: string;

    // Momiyose
    momiyose_title: string;
    momiyose_subtitle: string;
    momiyose_seal_button: string;
    momiyose_sealed_alert: string;
    momiyose_toggle: string;
    tip_iterate: string;
    tip_consultation: string;
    // Tier 3: Cortex Memory
    cortex_input_placeholder: string;
    cortex_thinking: string;
    cortex_memory_saved: string;

    // Installation → Ritual Dashboard navigation
    proceed_to_dashboard: string;
    ritual_dashboard_title: string;
}

const MYTHIC: VernacularDictionary = {
    phase_armory: 'The Armory',
    phase_scoring: 'The Crucible',
    phase_lock: 'The Verdict',
    phase_synthesis: 'Value Chemistry',
    phase_installation: 'The Installation',
    phase_calibration: 'Neural Calibration',
    phase_archive: 'Dossier Archive',
    ritual_dashboard: 'Ritual Dashboard',

    quadrant_sandbox: 'Sandbox',
    quadrant_mischief: 'Mischief',
    quadrant_craft: 'Craft',
    quadrant_ritual: 'Ritual',

    score_unbidden: 'Unbidden Requests',
    score_frictionless: 'Frictionless Doing',
    score_evidence: 'Result Evidence',
    score_extraction: 'Extraction Risk',

    sublabel_unbidden: 'Do clients request this without you marketing it?',
    sublabel_frictionless: 'Can you deliver this in your sleep?',
    sublabel_evidence: 'Do you have undeniable proof this generates revenue?',
    sublabel_extraction: 'Does this revenue stop if you take a vacation?',

    tool_singular: 'Weapon',
    tool_plural: 'Weapons',
    starting_tool: 'Starting Tool',
    locked_tool: 'Locked Weapon',
    theory_of_value: 'Theory of Value',
    godfather_offer: 'Godfather Offer',
    fatal_wound: 'Fatal Wound',
    sacred_cow: 'Sacred Cow',
    molecular_bond: 'Molecular Bond',
    shadow_beliefs: 'Shadow Beliefs',

    action_forge: 'Forge',
    action_lock: 'Lock',
    action_scan: 'Radar Scan',
    action_challenge: 'Challenge',

    status_pass: 'SOVEREIGN',
    status_fail: 'REJECTED',
    status_risk: 'CONTAINMENT REQ',
    status_asset: 'SCALABLE ASSET',

    // App Shell
    menu_archive: '[ DOSSIER ARCHIVE ]',
    menu_calibrate: '[ RE-CALIBRATE ]',
    menu_logout: '[ TERMINATE LINK ]',
    footer_archive_link: 'Access Existing Dossiers',
    xp_calibration: 'Calibration Complete',
    xp_finalized: 'Dossier Finalized',
    xp_burned: 'Tool Burned — Space Cleared',
    xp_armory_item: 'Armory Item Added',
    xp_compressed: 'Tool Compressed',
    xp_scored: 'Evidence Scored',
    xp_locked: 'Tool Locked',
    xp_theory: 'Theory Synthesized',
    xp_ritual_entry: 'Ritual Logged',
    ceremony_overline: 'RANK ACHIEVED',
    ceremony_level: 'LEVEL',
    ceremony_dismiss: 'ACKNOWLEDGE',

    // Calibration
    calibration_title: 'Neural Calibration System',
    calibration_subtitle: 'Operator Profiling & Identity Ledger',
    label_name: 'Operator Alias',
    label_industry: 'Domain of Operation',
    label_goal: 'Core Strategic Directive',
    label_tone: 'Architectural Tone',
    placeholder_name: 'e.g., ARCHITECT 01',
    placeholder_industry: 'e.g., Enterprise Software / BioTech',
    placeholder_goal: 'e.g., Automate client acquisition pipelines while maintaining high-ticket rarity.',
    calibration_submit: 'Finalize Calibration',
    calibration_footer: 'TetraTool // Profile Ledger Locked After Initialization',

    // Value Chemistry
    synthesis_title: 'Molecular Synthesis',
    synthesis_subtitle: 'Identify the Root Glitch. Manufacture Certainty.',
    synthesis_scan_ready: 'Ready to scan the MVA (Minimum Viable Audience) Radar for',
    synthesis_scan_cta: 'INITIALIZE RADAR SCAN',
    synthesis_scanning: '[ SCANNING NICHE FORUMS... ]',
    synthesis_scanning_detail: 'Extracting Shadow Beliefs & Fatal Wound patterns',
    synthesis_shadow_title: 'Shadow Belief Inventory',
    synthesis_complete: 'Chemistry extracted. Ready for White Paper synthesis.',
    synthesis_build_cta_prefix: 'ARCHITECT',
    synthesis_forging: '[ THE FORGE IS ACTIVE ]',
    synthesis_back: 'RETURN TO PREVIOUS PHASE',

    // Installation
    dossier_badge_sovereign: 'SOVEREIGN DOSSIER',
    dossier_badge_official: 'OFFICIAL DOSSIER',
    tov_summary_label: 'Forensic Theory of Value v.1',
    tov_promise_label: 'The Magick Pill Promise',
    generate_plan: 'Generate 7-Day Pilot Protocol',
    generating_plan: 'Architecting Pilot...',
    plan_title: '7-Day Installation Protocol',
    listen_idle: 'Listen to Protocol',
    listen_playing: 'Broadcasting...',
    download_pdf: 'Download Dossier (PDF)',
    export_calendar: '📅 Export 7-Day Protocol (.ics)',
    save_plan: 'Commit Protocol to System',
    saving_plan: 'Synching with Neural Link...',
    finalize_dossier: '⬡ Finalize Dossier',

    // Archive
    archive_title: 'Dossier Archive',
    archive_subtitle: 'Previously completed protocol sessions',
    archive_new_button: '+ New Session',
    archive_loading: 'Decrypting...',
    archive_empty: 'No sessions found. Begin a new calibration to start.',
    archive_subject_label: 'Subject',
    archive_footer: 'TetraTool // Sovereign Architecture',

    // Ritual Dashboard
    ritual_subtitle: 'Daily execution tracking. The data does not lie.',
    ritual_active_weapon: 'Active Weapon',
    ritual_offer_label: 'Godfather Offer',
    ritual_warning_title: '⚠ FALSE POSITIVE WARNING',
    ritual_warning_detail: 'It has been {days} days since your last entry. Consistency is non-negotiable.',
    ritual_log_button: 'Log Ritual',
    ritual_entry_title: 'Today\'s Entry Logged',
    ritual_mood_label: 'Mood',
    ritual_notes_label: 'Field Notes',
    ritual_commit: 'Commit Entry',
    ritual_history_title: 'Ritual History',

    // Auth
    auth_title: 'NEURAL VAULT / AUTH',
    auth_subtitle: 'Awaiting Verification Handshake',
    auth_footer: 'TetraTool Engine // Enterprise Node',

    // Refinement Terminal
    refine_title: 'Protocol Patch Terminal',
    refine_subtitle: 'Authorized Access: Senior Architect',
    refine_log_label: '// System Log Active',
    refine_log_waiting: '> Awaiting user optimization signals...',
    refine_log_processing: '> RE-CALCULATING PROPORTIONS... [GEM-3-FLASH]',
    refine_input_label: 'Input Optimization Feedback',
    refine_cta: 'EXECUTE RE-SYNTHESIS',
    refine_cta_processing: 'PROCESSING PATCH...',
    refine_footer: 'TetraTool Engine // Live Refinement Node',

    // ── Tone Warden ──────────────────────────────────
    warden_title: 'THE TONE WARDEN',
    warden_subtitle: 'Guard the Sovereign Frequency.',
    warden_input_label: 'DRAFT TRANSMISSION',
    warden_input_placeholder: 'Paste your outbound signal here for fidelity analysis...',
    warden_analyze_cta: 'SCAN FOR DRIFT',
    warden_analyzing: 'SCANNING FREQUENCY...',
    warden_score_label: 'SIGNAL FIDELITY',
    warden_rewrite_label: 'SOVEREIGN REWRITE',
    warden_copy_cta: 'COPY TRANSMISSION',
    warden_drift_label: 'DRIFT DETECTED',

    // Pyre
    pyre_title: 'The Pyre',
    pyre_subtitle: 'Tool Retirement Ceremony',
    pyre_target_label: 'Weapon to Burn',
    pyre_description: 'This tool no longer serves the mission. Burning it clears space for a new Starting Tool. This action archives the tool permanently.',
    pyre_cancel: 'Stand Down',
    pyre_confirm_prompt: 'TYPE THE OATH BELOW TO CONFIRM CREMATION',
    pyre_confirm_mismatch: 'DESIGNATION MISMATCH — TYPE AGAIN',
    pyre_confirm_oath: 'I acknowledge this asset is now ash',
    pyre_ignite: '🔥 Ignite the Pyre',
    pyre_progress_label: 'Burning',
    pyre_complete: 'Archived. Space cleared for evolution.',

    // Axis labels
    axis_top: 'INSTRUMENT (DISCIPLINE)',
    axis_bottom: 'TOY (DISCOVERY)',
    axis_left: 'TOOL (CONSTRUCTION)',
    axis_right: 'WEAPON (DISRUPTION)',

    // Quadrant hover info
    quadrant_craft_title: 'The Builder',
    quadrant_craft_desc: 'You use discipline to construct lasting systems.',
    quadrant_craft_examples: 'Engineering, Writing Code, Architecture',
    quadrant_ritual_title: 'The Critic',
    quadrant_ritual_desc: 'You use discipline to audit or disrupt systems.',
    quadrant_ritual_examples: 'Code Review, QA, Security Research',
    quadrant_sandbox_title: 'The Explorer',
    quadrant_sandbox_desc: 'You play to discover new patterns or ideas.',
    quadrant_sandbox_examples: 'Prototyping, Brainstorming, Sketching',
    quadrant_mischief_title: 'The Hacker',
    quadrant_mischief_desc: 'You play to break or exploit existing patterns.',
    quadrant_mischief_examples: 'Pentesting, Pranks, guerrilla marketing',

    // Intro Phase
    intro_headline_1: 'Tetra',
    intro_headline_2: 'Tool',
    intro_headline_3: 'Engine',
    intro_subtitle: 'POST-NEON DIAGNOSTIC ENGINE v2.0\n————————————————\nIdentify, validate, and install your unextractable Starting Tool.\nThis is not a quiz. It is an architecture protocol.',
    intro_input_label: 'Subject Identification [Entity Name]',
    intro_placeholder: 'Enter Client/Entity Name',
    intro_button: 'Initialize System',
    intro_mode_label: 'Interface Mode',

    // Tool Lock
    lock_phase_prefix: 'Phase 4:',
    lock_confirm: 'Confirm',

    // Global
    unknown_subject: 'Unknown Subject',
    label_pts: 'PTS',
    phase_label: 'Phase',

    // Armory Audit
    armory_subtitle: 'List every recurring activity. Verbs only. No metaphors.',
    armory_view_spatial: 'Spatial Forge',
    armory_view_terminal: 'Terminal Audit',
    armory_list_title: 'My Armory',
    armory_empty_spatial: 'Armory empty. Add at least 3 items to map your arsenal.',
    armory_empty_terminal: 'Armory empty. Start adding items above.',
    armory_status_label: 'items',
    armory_proceed: 'Proceed to Compression →',
    armory_cap_locked: '[ CAPACITY BREACH ] — ARMORY SEALED',
    armory_cap_locked_detail: 'Maximum {cap} weapons deployed. Burn assets in the Pyre before adding new ordnance.',
    armory_cap_input_blocked: 'ARMORY SEALED — BURN TO MAKE SPACE',
    warden_intercept_blocked: 'SIGNAL DRIFT DETECTED — TRANSMISSION BLOCKED',
    warden_intercept_warning: 'Commodity syntax intercepted. Recalibrate or burn the draft.',
    cremate_toggle: 'DOSSIER CREMATION',
    cremate_title: '⚰ CREMATE DOSSIER — PERMADEATH',
    cremate_warning: 'This action is irreversible. Your profile, armory, tools, scores, and all session data will be permanently destroyed. You will be reborn at Phase 1 as a new operator.',
    cremate_confirm_prompt: 'Type {word} to confirm destruction',
    cremate_button: 'IGNITE THE DOSSIER',
    xp_phoenix_reborn: 'PHOENIX REBORN — Identity destroyed and rebuilt',
    degraded_banner: '[ SIGNAL DEGRADED ] — RE-CALIBRATION REQUIRED',
    degraded_detail: 'Inactivity detected. Your access has been revoked until recalibration.',
    interrogation_title: 'ACTIVE INTERROGATION',
    interrogation_placeholder: 'Prove it. Names, numbers, outcomes — no abstractions.',
    interrogation_xp: '40',
    xp_interrogation: 'INTERROGATION SURVIVED — knowledge transferred',
    scaffold_title: 'BRIEFING',
    scaffold_success_signal: 'VICTORY CONDITION',
    scaffold_proceed: 'Acknowledged. Begin.',
    simulation_title: 'COMBAT SIMULATION',
    simulation_placeholder: 'Deploy your tactical response — this is a war room, not a classroom.',
    simulation_exit: 'Disengage',
    simulation_complete: 'Simulation Survived',
    simulation_fail_msg: 'SIMULATION FAILED — TACTICS INEFFECTIVE',
    simulation_score_label: 'COMBAT SCORE',
    simulation_archetype_label: 'ADVERSARY ARCHETYPE',
    simulation_start_btn: 'ENGAGE SIMULATION',
    simulation_pass_msg: 'VICTORY — TACTICS VALIDATED',

    // Evidence Scoring
    scoring_subtitle: 'Evidence Gates. High claims require high proof.',
    scoring_challenging: '⚡ Adversarial Auditor scanning your claim...',
    scoring_proof_unbidden: 'Evidence Required — Paste DMs, Emails, or Requests',
    scoring_proof_result: 'Evidence Required — Paste Testimonial or Metric',
    scoring_risk_explanation: 'HIGH = You ARE the product (job). LOW = The product works without you (asset).',
    scoring_proceed: 'Audit Complete → Lock Tool',

    // Tool Compression
    compression_sovereign_badge: 'SOVEREIGN AUTHORITY',
    compression_sovereign_synthesizing: 'Synthesizing Authority...',
    compression_sovereign_button: 'Refine into One Sovereign Authority',
    compression_compress_button: 'Compress into Market Function',
    compression_result_subtitle: 'The Engine has compressed your skills into commercially viable functions.',
    compression_result_title: 'Market Synthesis',
    compression_proceed: 'Proceed to Evidence →',
    compression_select_subtitle: 'You are dropped into a divergent reality. These 4 skills are your only survival tools. Select them.',
    compression_cap_warning: '⚠ ARMORY OVERLOADED',
    compression_cap_explainer: 'The 80/20 rule: your top 20% of skills generate 80% of value. Compress or delete until ≤ {cap}.',
    compression_analyzing_hint: 'Running Chimera Protocol... fusing survival skills into sovereign function...',
    compression_select_title: 'Chimera Protocol',
    compression_merge_header: 'Compression Recommendations',
    chimera_bond_label: 'MOLECULAR BOND',
    chimera_result_subtitle: 'Chimera Protocol Complete — Alien Logic Synthesized',
    chimera_fused_from: 'FORGED FROM',
    chimera_count: '{n} / 4 Survival Skills Armed',

    // Ritual Dashboard
    ritual_reaudit_button: 'Re-Run Audit →',
    ritual_streak: 'Oath Streak',
    ritual_signal_fidelity: 'Signal Fidelity',
    ritual_multiplier: 'Commitment Multiplier',
    cortex_status: 'SOVEREIGN CORTEX PROCESSING',

    // ── Signal Triangulation ─────────────────────────
    triangulation_title: 'PLAN CALIBRATION',
    triangulation_subtitle: 'Signal Triangulation Protocol',
    triangulation_q1: 'Identify the Signal. What part of this plan feels inevitable?',
    triangulation_q2: 'Identify the Static. What part of this plan feels like a job, not a tool?',
    triangulation_q3: 'Name the Block. Why haven\'t you executed this already?',
    triangulation_label_1: 'SIGNAL 1 — RESONANCE',
    triangulation_label_2: 'SIGNAL 2 — DISTORTION',
    triangulation_label_3: 'SIGNAL 3 — FRICTION',
    triangulation_next: 'NEXT SIGNAL →',
    triangulation_cta: 'COLLAPSE WAVEFORM',
    triangulation_synthesizing: 'COLLAPSING WAVEFORM',
    triangulation_footer: '3 SIGNALS • 1 SOVEREIGN TRAJECTORY',
    triangulation_placeholder: 'Speak your truth...',
    triangulation_button: 'CALIBRATE PROTOCOL',

    // Candidate Card Labels
    primitives_menu: 'Sovereign Primitives (Quick Add)',
    deck_of_sparks: 'Deck of Sparks',
    candidate_function: 'Function',
    candidate_promise: 'The Promise',
    candidate_antipitch: "ANTIPITCH",

    // ── Tier 1: Citadel Hardening ────────────────────
    session_vow_title: "SOVEREIGN COMMAND CENTER — SESSION INITIALIZATION",
    session_vow_operator_label: "OPERATOR",
    session_vow_directive_label: "SESSION DIRECTIVE",
    session_vow_define_directive: "DEFINE SESSION DIRECTIVE",
    session_vow_placeholder: "State your strategic intent for this session...",
    session_vow_confirm: "✓ CONFIRM DIRECTIVE",
    session_vow_edit: "[ EDIT ]",
    session_vow_initializing: "INITIALIZING...",
    session_vow_hold: "INITIATE SEQUENCE",

    resurrection_alert: "⚠ SYSTEM ALERT",
    resurrection_inactive_label: "CITADEL INACTIVE FOR {days} DAYS",
    resurrection_message: "All systems entered deep freeze. Your data is intact.\nState your intent to reactivate the command center.",
    resurrection_placeholder: "I am returning to...",
    resurrection_reactivating: "REACTIVATING...",
    resurrection_initiate: "INITIATE RESURRECTION",
    resurrection_protocol_active: "DEEP FREEZE PROTOCOL ACTIVE",

    flow_optimal: "OPTIMAL",
    flow_caution: "CAUTION",
    flow_breach: "BREACH",
    flow_offline: "OFFLINE",

    decay_cooling: "COOLING",
    decay_stale: "STALE",
    decay_decaying: "DECAYING",
    decay_plan_status: "⚠ PLAN STATUS",
    decay_last_activity: "Last activity",

    tip_download_pdf: 'Export your complete Sovereign Dossier as a formatted PDF',
    tip_export_calendar: 'Downloads a .ICS calendar file with your 7-day ritual protocol',
    tip_save: 'Saves your dossier state so you can return and refine later',
    tip_finalize: 'Locks this version permanently as your official dossier',
    tip_finalize_locked: 'Available in {days} days — refine your protocol first',
    tip_fork: 'Creates a new editable version from your finalized dossier',
    tip_copy_md: 'Copies the full protocol to your clipboard in Markdown format',
    tip_iterate: 'Open the AI Refinement Terminal — your most powerful tool. Tell the AI exactly how to personalize, restructure, or sharpen your protocol.',
    tip_consultation: 'Coming soon — live consultation session with a strategist',
    
    // Installation Alerts & Market
    alert_critical_gap: 'CRITICAL GAP',
    alert_tov_missing: 'THEORY OF VALUE NOT DETECTED',
    alert_run_upgrade: 'RUN FORENSIC UPGRADE',
    market_status_title: 'MARKET STATUS',
    status_containment: 'CONTAINMENT REQ',
    status_scalable: 'SCALABLE ASSET',
    market_searching: 'SEARCHING GROUNDING...',
    market_run_search: 'RUN MARKET SEARCH CHECK',
    proof_ledger_title: 'PROOF LEDGER',
    change_tool: '← CHANGE TOOL',
    copy_protocol: '[ COPY PROTOCOL MD ]',
    iterate_protocol: '★ ITERATE PROTOCOL [ AI REFINEMENT ]',
    consultation_coming_soon: 'Initialize Live Consultation (Coming Feature)',
    proceed_to_dashboard: 'Enter the Arena',
    ritual_dashboard_title: 'Ritual Dashboard',

    // Proof Tier
    tier_label: 'PROOF TIER',
    tier_seed: 'SEED',
    tier_draft: 'FORGING',
    tier_near_final: 'TEMPERING',
    tier_artifact: 'ARTIFACT',

    // Momiyose
    momiyose_title: 'MOMIYOSE — WEEKLY SYNTHESIS',
    momiyose_subtitle: 'The cycle closes. Assess your impact.',
    momiyose_seal_button: 'SEAL THE WEEK',
    momiyose_sealed_alert: 'WEEK SEALED. ENTROPY ARRESTED.',
    momiyose_toggle: 'WEEKLY REVIEW',
    // Cortex
    cortex_input_placeholder: "TRANSMIT QUERY TO CORTEX...",
    cortex_thinking: "ACCESSING AKASHIC RECORD...",
    cortex_memory_saved: "THOUGHT SIGNATURE CRYSTALLIZED.",
};

const INDUSTRIAL: VernacularDictionary = {
    // ── Phases ──────────────────────────────────────
    phase_armory: 'Asset Inventory',
    phase_scoring: 'Performance Audit',
    phase_lock: 'Selection Report',
    phase_synthesis: 'Market Analysis',
    phase_installation: 'Launch Protocol',
    phase_calibration: 'Operator Setup',
    phase_archive: 'Report Archive',
    ritual_dashboard: 'Operations Dashboard',

    quadrant_sandbox: 'R&D',
    quadrant_mischief: 'Disruptor',
    quadrant_craft: 'Core Process',
    quadrant_ritual: 'SOP',

    score_unbidden: 'Inbound Demand',
    score_frictionless: 'Execution Speed',
    score_evidence: 'ROI Evidence',
    score_extraction: 'Dependency Risk',

    sublabel_unbidden: 'How often do clients request this service unprompted?',
    sublabel_frictionless: 'Can you execute this deliverable in under 30 minutes?',
    sublabel_evidence: 'Do you have documented case studies or revenue metrics?',
    sublabel_extraction: 'Is this revenue tied to your personal availability?',

    tool_singular: 'Asset',
    tool_plural: 'Assets',
    starting_tool: 'Primary Asset',
    locked_tool: 'Selected Asset',
    theory_of_value: 'Value Proposition',
    godfather_offer: 'Premium Offer',
    fatal_wound: 'Core Problem',
    sacred_cow: 'Market Assumption',
    molecular_bond: 'Competitive Edge',
    shadow_beliefs: 'Market Friction Points',

    action_forge: 'Analyze',
    action_lock: 'Select',
    action_scan: 'Market Scan',
    action_challenge: 'Audit',

    status_pass: 'VALIDATED',
    status_fail: 'INSUFFICIENT DATA',
    status_risk: 'HIGH DEPENDENCY',
    status_asset: 'SCALABLE REVENUE',

    // App Shell
    menu_archive: '[ REPORT ARCHIVE ]',
    menu_calibrate: '[ UPDATE PROFILE ]',
    menu_logout: '[ SIGN OUT ]',
    footer_archive_link: 'View Past Reports',
    xp_calibration: 'Profile Updated',
    xp_finalized: 'Report Finalized',
    xp_burned: 'Asset Retired',
    xp_armory_item: 'Asset Catalogued',
    xp_compressed: 'Asset Distilled',
    xp_scored: 'Evidence Filed',
    xp_locked: 'Disruptor Locked',
    xp_theory: 'Value Engine Forged',
    xp_ritual_entry: 'Daily Report Filed',
    ceremony_overline: 'RANK UNLOCKED',
    ceremony_level: 'TIER',
    ceremony_dismiss: 'PROCEED',

    // Calibration
    calibration_title: 'Operator Setup',
    calibration_subtitle: 'Analyst Profiling & Domain Registry',
    label_name: 'Analyst Name',
    label_industry: 'Market Domain',
    label_goal: 'Primary Business Objective',
    label_tone: 'Communication Style',
    placeholder_name: 'e.g., J. Smith',
    placeholder_industry: 'e.g., SaaS / Consulting / E-Commerce',
    placeholder_goal: 'e.g., Scale revenue to $50k/month while reducing operational overhead.',
    calibration_submit: 'Save Configuration',
    calibration_footer: 'TetraTool // Operator profile saved securely',

    // Value Chemistry
    synthesis_title: 'Market Synthesis',
    synthesis_subtitle: 'Identify the core market gap. Build the value proposition.',
    synthesis_scan_ready: 'Ready to conduct market scan for',
    synthesis_scan_cta: 'START MARKET SCAN',
    synthesis_scanning: '[ ANALYZING MARKET DATA... ]',
    synthesis_scanning_detail: 'Extracting market friction & core problem patterns',
    synthesis_shadow_title: 'Market Friction Inventory',
    synthesis_complete: 'Analysis complete. Ready for value proposition synthesis.',
    synthesis_build_cta_prefix: 'BUILD',
    synthesis_forging: '[ BUILDING VALUE PROPOSITION... ]',
    synthesis_back: 'BACK TO PREVIOUS STEP',
    
    // Candidate Card Labels
    primitives_menu: 'Sovereign Primitives (Quick Add)',
    deck_of_sparks: 'Deck of Sparks',
    candidate_function: 'Function',
    candidate_promise: 'The Promise',
    candidate_antipitch: "RISK FACTOR",

    // ── Tier 1: Citadel Hardening ────────────────────
    session_vow_title: "SYSTEM INITIALIZATION",
    session_vow_operator_label: "USER",
    session_vow_directive_label: "SESSION OBJECTIVE",
    session_vow_define_directive: "DEFINE OBJECTIVE",
    session_vow_placeholder: "Define your goal for this session...",
    session_vow_confirm: "✓ CONFIRM GOAL",
    session_vow_edit: "[ EDIT ]",
    session_vow_initializing: "LOADING...",
    session_vow_hold: "START SESSION",

    resurrection_alert: "⚠ INACTIVITY ALERT",
    resurrection_inactive_label: "SYSTEM INACTIVE FOR {days} DAYS",
    resurrection_message: "Session expired due to inactivity. Data archiving active.\nConfirm intent to restore session.",
    resurrection_placeholder: "Reason for return...",
    resurrection_reactivating: "RESTORING...",
    resurrection_initiate: "RESTORE SESSION",
    resurrection_protocol_active: "ARCHIVE PROTOCOL ACTIVE",

    flow_optimal: "FLOW",
    flow_caution: "HIGH LOAD",
    flow_breach: "OVERLOAD",
    flow_offline: "IDLE",

    decay_cooling: "RECENT",
    decay_stale: "OLD",
    decay_decaying: "EXPIRED",
    decay_plan_status: "⚠ PLAN AGE",
    decay_last_activity: "Modified",

    tip_download_pdf: 'Export your complete Sovereign Dossier as a formatted PDF',
    tip_export_calendar: 'Downloads a .ICS calendar file with your 7-day ritual protocol',
    tip_save: 'Saves your dossier state so you can return and refine later',
    tip_finalize: 'Locks this version permanently as your official dossier',
    tip_finalize_locked: 'Available in {days} days — refine your protocol first',
    tip_fork: 'Creates a new editable version from your finalized dossier',
    tip_copy_md: 'Copies the full protocol to your clipboard in Markdown format',
    tip_iterate: 'Open the AI Refinement Terminal — your most powerful tool. Tell the AI exactly how to personalize, restructure, or sharpen your protocol.',
    tip_consultation: 'Coming soon — live consultation session with a strategist',

    // Installation
    dossier_badge_sovereign: 'PRIMARY ASSET REPORT',

    simulation_title: 'PRACTICE SIMULATION',
    simulation_placeholder: 'Write your response using specific details from your experience.',
    simulation_exit: 'Exit',
    simulation_complete: 'Simulation Complete',
    simulation_fail_msg: 'SIMULATION FAILED — CRITERIA NOT MET',
    simulation_score_label: 'PERFORMANCE SCORE',
    simulation_archetype_label: 'SCENARIO ARCHETYPE',
    simulation_start_btn: 'START SIMULATION',
    simulation_pass_msg: 'PASSED — CRITERIA MET',

    // Evidence Scoring
    scoring_subtitle: 'Score each asset against performance benchmarks.',
    scoring_challenging: '⚡ Validating claim against benchmark...',
    scoring_proof_unbidden: 'Evidence Required — Paste Inbound Communications',
    scoring_proof_result: 'Evidence Required — Paste Case Study or Metric',
    scoring_risk_explanation: 'HIGH = Revenue requires your presence. LOW = Revenue persists without you.',
    scoring_proceed: 'Audit Complete → Select Asset',

    // Tool Compression
    compression_sovereign_badge: 'PRIMARY ASSET',
    compression_sovereign_synthesizing: 'Consolidating Assets...',
    compression_sovereign_button: 'Consolidate into Primary Asset',
    compression_compress_button: 'Analyze Market Position',
    compression_result_subtitle: 'Your skills have been mapped to commercially viable professional functions.',
    compression_result_title: 'Market Analysis',
    compression_proceed: 'Proceed to Validation →',
    compression_select_subtitle: 'Select 4 key competencies. The system will synthesize them into a compound market function.',
    compression_cap_warning: '⚠ INVENTORY OVERLOADED',
    compression_cap_explainer: 'The Pareto principle: 20% of your competencies generate 80% of value. Consolidate until ≤ {cap}.',
    compression_analyzing_hint: 'Synthesizing compound function from core competencies...',
    compression_select_title: 'Compound Function Synthesis',
    compression_merge_header: 'Consolidation Recommendations',
    chimera_bond_label: 'COMPOUND LOGIC',
    chimera_result_subtitle: 'Compound Function Synthesized',
    chimera_fused_from: 'COMPOSED OF',
    chimera_count: '{n} / 4 Competencies Selected',

    // Ritual Dashboard
    ritual_reaudit_button: 'Re-Run Assessment →',
    ritual_streak: 'Active Streak',
    ritual_signal_fidelity: 'Signal Fidelity',
    ritual_multiplier: 'Streak Multiplier',
    cortex_status: 'ENGINE PROCESSING',

    // ── Signal Triangulation ─────────────────────────
    triangulation_title: 'PLAN CALIBRATION',
    triangulation_subtitle: 'Signal Triangulation Sequence',
    triangulation_q1: 'Confirm alignment. What part of this plan resonates?',
    triangulation_q2: 'Flag resistance. What part doesn\'t fit your operation?',
    triangulation_q3: 'Locate friction. What\'s the barrier to immediate execution?',
    triangulation_label_1: 'INPUT 1 — ALIGNMENT',
    triangulation_label_2: 'INPUT 2 — RESISTANCE',
    triangulation_label_3: 'INPUT 3 — BARRIER',
    triangulation_next: 'NEXT INPUT →',
    triangulation_cta: 'SYNTHESIZE PROTOCOL',
    triangulation_synthesizing: 'SYNTHESIZING PROTOCOL',
    triangulation_footer: '3 INPUTS • 1 REFINED PROTOCOL',
    triangulation_placeholder: 'Enter your feedback...',
    triangulation_button: 'CALIBRATE PLAN',

    // Installation
    dossier_badge_official: 'ASSET REPORT',
    tov_summary_label: 'Value Proposition Summary',
    tov_promise_label: 'Core Transformation Promise',
    generate_plan: 'Generate 7-Day Launch Protocol',
    generating_plan: 'Building Launch Plan...',
    plan_title: '7-Day Launch Protocol',
    listen_idle: 'Listen',
    listen_playing: 'Playing...',
    download_pdf: 'Download Report (PDF)',
    export_calendar: '📅 Export Launch Calendar (.ics)',
    save_plan: 'Save Report',
    saving_plan: 'Saving...',
    finalize_dossier: '⬡ Finalize Report',

    // Archive
    archive_title: 'Report Archive',
    archive_subtitle: 'Previously completed analysis sessions',
    archive_new_button: '+ New Analysis',
    archive_loading: 'Loading...',
    archive_empty: 'No reports found. Start a new analysis to begin.',
    archive_subject_label: 'Analyst',
    archive_footer: 'TetraTool // Strategic Operations',

    // Ritual Dashboard (Remainder)
    ritual_subtitle: 'Daily KPI tracking. Numbers don\'t lie.',
    ritual_active_weapon: 'Primary Asset',
    ritual_offer_label: 'Premium Offer',
    ritual_warning_title: '⚠ ENGAGEMENT ALERT',
    ritual_warning_detail: 'It has been {days} days since your last entry. Consistency drives results.',
    ritual_log_button: 'Log Activity',
    ritual_entry_title: 'Entry Logged',
    ritual_mood_label: 'Status',
    ritual_notes_label: 'Notes',
    ritual_commit: 'Submit Entry',
    ritual_history_title: 'Activity History',

    // Auth
    auth_title: 'SECURE LOGIN',
    auth_subtitle: 'Authenticate to proceed',
    auth_footer: 'TetraTool Engine // Secure Portal',

    // Refinement Terminal
    refine_title: 'Report Editor',
    refine_subtitle: 'Modify your launch protocol',
    refine_log_label: '// Processing',
    refine_log_waiting: '> Awaiting your feedback...',
    refine_log_processing: '> UPDATING REPORT...',
    refine_input_label: 'Your Feedback',
    refine_cta: 'UPDATE REPORT',
    refine_cta_processing: 'UPDATING...',
    refine_footer: 'TetraTool Engine // Report Editor',

    // ── Tone Warden ──────────────────────────────────
    warden_title: 'SIGNAL FIDELITY ENGINE',
    warden_subtitle: 'Validate outbound signal integrity.',
    warden_input_label: 'OUTBOUND CONTENT',
    warden_input_placeholder: 'Paste outbound content for signal analysis...',
    warden_analyze_cta: 'ANALYZE SIGNAL',
    warden_analyzing: 'ANALYZING...',
    warden_score_label: 'FIDELITY SCORE',
    warden_rewrite_label: 'OPTIMIZED VERSION',
    warden_copy_cta: 'COPY TO CLIPBOARD',
    warden_drift_label: 'SIGNAL DRIFT ITEMS',

    // Pyre
    pyre_title: 'Asset Retirement',
    pyre_subtitle: 'Asset Decommission',
    pyre_target_label: 'Asset to Retire',
    pyre_description: 'This asset no longer aligns with your strategy. Retiring it clears space for a new primary asset.',
    pyre_cancel: 'Cancel',
    pyre_confirm_prompt: 'TYPE THE PHRASE BELOW TO CONFIRM DECOMMISSION',
    pyre_confirm_mismatch: 'INPUT MISMATCH — RETYPE',
    pyre_confirm_oath: 'I confirm this tool is decommissioned',
    pyre_ignite: '🔥 Retire Asset',
    pyre_progress_label: 'Retiring',
    pyre_complete: 'Retired. Capacity freed for new assets.',

    // Axis labels
    axis_top: 'STRUCTURED (DISCIPLINE)',
    axis_bottom: 'EXPLORATORY (INNOVATION)',
    axis_left: 'DELIVERY (PRODUCTION)',
    axis_right: 'DISRUPTION (MARKET IMPACT)',

    // Quadrant hover info
    quadrant_craft_title: 'The Producer',
    quadrant_craft_desc: 'Disciplined execution of repeatable systems.',
    quadrant_craft_examples: 'Operations, SOPs, Process Design',
    quadrant_ritual_title: 'The Optimizer',
    quadrant_ritual_desc: 'Systematic improvement of existing processes.',
    quadrant_ritual_examples: 'QA, Compliance, Performance Reviews',
    quadrant_sandbox_title: 'The Innovator',
    quadrant_sandbox_desc: 'Exploratory work to discover new opportunities.',
    quadrant_sandbox_examples: 'R&D, Prototyping, Market Research',
    quadrant_mischief_title: 'The Disruptor',
    quadrant_mischief_desc: 'Challenging established norms for competitive advantage.',
    quadrant_mischief_examples: 'Growth Hacking, Competitive Analysis, Pivots',

    // Intro Phase
    intro_headline_1: 'Asset',
    intro_headline_2: 'Discovery',
    intro_headline_3: 'Engine',
    intro_subtitle: 'STRATEGIC ASSET IDENTIFICATION SUITE v2.0\n————————————————\nInventory, validate, and deploy your highest-leverage professional asset.',
    intro_input_label: 'Client / Organization Name',
    intro_placeholder: 'Enter client name',
    intro_button: 'Begin Assessment',
    intro_mode_label: 'Interface Mode',

    // Tool Lock
    lock_phase_prefix: 'Phase 4:',
    lock_confirm: 'Select',

    // Global
    unknown_subject: 'Unknown Organization',
    label_pts: 'PTS',
    phase_label: 'Phase',

    // Armory Audit
    armory_subtitle: 'Log every recurring professional activity. Action verbs only.',
    armory_view_spatial: 'Grid View',
    armory_view_terminal: 'Table View',
    armory_list_title: 'My Assets',
    armory_empty_spatial: 'No assets logged. Add at least 3 to generate your map.',
    armory_empty_terminal: 'No assets yet. Start adding above.',
    armory_status_label: 'assets',
    armory_proceed: 'Proceed to Performance Audit →',
    armory_cap_locked: '[ CAPACITY REACHED ] — ASSET LIBRARY FULL',
    armory_cap_locked_detail: 'Maximum {cap} assets allowed. Retire assets before adding new ones.',
    armory_cap_input_blocked: 'Library full — retire assets first',
    warden_intercept_blocked: 'QUALITY CHECK FAILED — SUBMISSION BLOCKED',
    warden_intercept_warning: 'Generic language detected. Revise before submitting.',
    cremate_toggle: 'RESET PROFILE',
    cremate_title: 'FULL PROFILE RESET',
    cremate_warning: 'This will permanently delete your profile, assets, and all session data. You will restart from the beginning.',
    cremate_confirm_prompt: 'Type {word} to confirm reset',
    cremate_button: 'RESET EVERYTHING',
    xp_phoenix_reborn: 'Profile reset complete — fresh start bonus',
    degraded_banner: 'RE-EVALUATION NEEDED',
    degraded_detail: 'Extended inactivity detected. Please re-complete your assessment.',
    interrogation_title: 'KNOWLEDGE CHECK',
    interrogation_placeholder: 'Be specific — use real examples from your work.',
    interrogation_xp: '40',
    xp_interrogation: 'Knowledge check passed — application verified',
    scaffold_title: 'PHASE OVERVIEW',
    scaffold_success_signal: 'SUCCESS CRITERIA',
    scaffold_proceed: 'Got it.',



    // Installation Alerts & Market
    alert_critical_gap: 'CRITICAL GAP',
    alert_tov_missing: 'THEORY OF VALUE NOT DETECTED',
    alert_run_upgrade: 'RUN FORENSIC UPGRADE',
    market_status_title: 'MARKET STATUS',
    status_containment: 'CONTAINMENT REQ',
    status_scalable: 'SCALABLE ASSET',
    market_searching: 'SEARCHING GROUNDING...',
    market_run_search: 'RUN MARKET SEARCH CHECK',
    proof_ledger_title: 'PROOF LEDGER',
    change_tool: '← CHANGE TOOL',
    copy_protocol: '[ COPY PROTOCOL MD ]',
    iterate_protocol: '★ ITERATE PROTOCOL [ AI REFINEMENT ]',
    consultation_coming_soon: 'Initialize Live Consultation (Coming Feature)',
    proceed_to_dashboard: 'Open Operations Dashboard',
    ritual_dashboard_title: 'Operations Dashboard',

    // Proof Tier
    tier_label: 'PROOF LEVEL',
    tier_seed: 'INITIATION',
    tier_draft: 'DEVELOPMENT',
    tier_near_final: 'VALIDATION',
    tier_artifact: 'DEPLOYED',

    // Momiyose
    momiyose_title: 'WEEKLY PERFORMANCE REVIEW',
    momiyose_subtitle: 'Aggregate data analysis.',
    momiyose_seal_button: 'FINALIZE REPORT',
    momiyose_sealed_alert: 'REPORT FILED.',
    momiyose_toggle: 'WEEKLY REPORT',
    // Cortex
    cortex_input_placeholder: "Enter query for System Core...",
    cortex_thinking: "PROCESSING REQUEST...",
    cortex_memory_saved: "DATA COMMITTED TO LOG.",
};

const PLAIN: VernacularDictionary = {
    phase_armory: 'Your Skills',
    phase_scoring: 'Skill Scorecard',
    phase_lock: 'Your Best Skill',
    phase_synthesis: 'Your Offer',
    phase_installation: 'Your Game Plan',
    phase_calibration: 'About You',
    phase_archive: 'Saved Plans',
    ritual_dashboard: 'Daily Tracker',

    quadrant_sandbox: 'For Fun',
    quadrant_mischief: 'Side Hustle',
    quadrant_craft: 'Day Job',
    quadrant_ritual: 'Daily Habit',

    score_unbidden: 'People Ask You',
    score_frictionless: 'Easy for You',
    score_evidence: 'Proof It Works',
    score_extraction: 'Depends on You',

    sublabel_unbidden: 'Do people come to you for this without you asking?',
    sublabel_frictionless: 'Could you do this in 30 minutes without thinking?',
    sublabel_evidence: 'Do you have examples or results to show?',
    sublabel_extraction: 'Does it stop working when you stop doing it?',

    tool_singular: 'Skill',
    tool_plural: 'Skills',
    starting_tool: 'Best Skill',
    locked_tool: 'Chosen Skill',
    theory_of_value: 'Your Value',
    godfather_offer: 'Your Offer',
    fatal_wound: 'The Problem You Solve',
    sacred_cow: 'Common Myth',
    molecular_bond: 'What Makes You Different',
    shadow_beliefs: 'Hidden Doubts',

    action_forge: 'Add',
    action_lock: 'Pick',
    action_scan: 'Search',
    action_challenge: 'Test',

    status_pass: 'READY TO GO',
    status_fail: 'NEEDS WORK',
    status_risk: 'TOO DEPENDENT ON YOU',
    status_asset: 'CAN SCALE',

    // App Shell
    menu_archive: '[ SAVED PLANS ]',
    menu_calibrate: '[ EDIT PROFILE ]',
    menu_logout: '[ LOG OUT ]',
    footer_archive_link: 'View Saved Plans',
    xp_calibration: 'Profile Saved',
    xp_finalized: 'Plan Finalized',
    xp_burned: 'Skill Removed',
    xp_armory_item: 'Skill Added',
    xp_compressed: 'Skill Refined',
    xp_scored: 'Skill Verified',
    xp_locked: 'Skill Selected',
    xp_theory: 'Strategy Created',
    xp_ritual_entry: 'Entry Logged',
    ceremony_overline: 'NEW RANK',
    ceremony_level: 'LEVEL',
    ceremony_dismiss: 'CONTINUE',

    // Calibration
    calibration_title: 'About You',
    calibration_subtitle: 'Tell us about your work',
    label_name: 'Your Name',
    label_industry: 'Your Industry',
    label_goal: 'Your Main Goal',
    label_tone: 'Communication Style',
    placeholder_name: 'e.g., Sarah Johnson',
    placeholder_industry: 'e.g., Fitness Coaching / Real Estate',
    placeholder_goal: 'e.g., Get more clients online without spending all day on social media.',
    calibration_submit: 'Save & Continue',
    calibration_footer: 'TetraTool // Your profile is saved automatically',

    // Value Chemistry
    synthesis_title: 'Build Your Offer',
    synthesis_subtitle: 'Find the real problem your audience has. Show why you solve it.',
    synthesis_scan_ready: 'Ready to research the audience for',
    synthesis_scan_cta: 'START RESEARCH',
    synthesis_scanning: '[ RESEARCHING YOUR AUDIENCE... ]',
    synthesis_scanning_detail: 'Finding hidden doubts & problem patterns',
    synthesis_shadow_title: 'Hidden Doubts Your Audience Has',
    synthesis_complete: 'Research complete. Ready to build your offer.',
    synthesis_build_cta_prefix: 'BUILD',
    synthesis_forging: '[ BUILDING YOUR OFFER... ]',
    synthesis_back: 'GO BACK',

    // Installation
    dossier_badge_sovereign: 'YOUR REPORT',
    dossier_badge_official: 'YOUR REPORT',
    tov_summary_label: 'Your Value Summary',
    tov_promise_label: 'The Promise',
    generate_plan: 'Create 7-Day Action Plan',
    generating_plan: 'Creating your plan...',
    plan_title: '7-Day Action Plan',
    listen_idle: 'Listen',
    listen_playing: 'Playing...',
    download_pdf: 'Download Report (PDF)',
    export_calendar: '📅 Export 7-Day Plan (.ics)',
    save_plan: 'Save My Plan',
    saving_plan: 'Saving...',
    finalize_dossier: '⬡ Lock It In',

    // Archive
    archive_title: 'Your Saved Plans',
    archive_subtitle: 'Plans you\'ve created before',
    archive_new_button: '+ Start New Plan',
    archive_loading: 'Loading your plans...',
    archive_empty: 'No plans yet. Start a new one to begin.',
    archive_subject_label: 'Name',
    archive_footer: 'TetraTool // Your Plans',

    // Ritual Dashboard
    ritual_subtitle: 'Track your daily progress. Numbers tell the truth.',
    ritual_active_weapon: 'Your Current Skill',
    ritual_offer_label: 'Your Offer',
    ritual_warning_title: '⚠ HEADS UP',
    ritual_warning_detail: 'It has been {days} days since your last entry. Try to stay consistent!',
    ritual_log_button: 'Log Today',
    ritual_entry_title: 'Today\'s Entry Saved',
    ritual_mood_label: 'How Are You Feeling?',
    ritual_notes_label: 'Notes',
    ritual_commit: 'Save Entry',
    ritual_history_title: 'History',

    // Auth
    auth_title: 'SIGN IN',
    auth_subtitle: 'Log in to continue',
    auth_footer: 'TetraTool Engine // Welcome',

    // Refinement Terminal
    refine_title: 'Edit Your Plan',
    refine_subtitle: 'Make changes to your action plan',
    refine_log_label: '// Ready',
    refine_log_waiting: '> Waiting for your feedback...',
    refine_log_processing: '> UPDATING YOUR PLAN...',
    refine_input_label: 'What would you change?',
    refine_cta: 'UPDATE PLAN',
    refine_cta_processing: 'UPDATING...',
    refine_footer: 'TetraTool Engine // Plan Editor',

    // ── Tone Warden ──────────────────────────────────
    warden_title: 'BRAND VOICE CHECK',
    warden_subtitle: 'Check your writing voice.',
    warden_input_label: 'YOUR DRAFT',
    warden_input_placeholder: 'Paste what you wrote to check your voice...',
    warden_analyze_cta: 'CHECK VOICE',
    warden_analyzing: 'CHECKING...',
    warden_score_label: 'VOICE SCORE',
    warden_rewrite_label: 'SUGGESTED REWRITE',
    warden_copy_cta: 'COPY TEXT',
    warden_drift_label: 'ISSUES FOUND',

    // Pyre
    pyre_title: 'Remove Skill',
    pyre_subtitle: 'Skill Removal',
    pyre_target_label: 'Skill to Remove',
    pyre_description: 'This skill no longer fits your goals. Removing it clears space for something better. This action is permanent.',
    pyre_cancel: 'Cancel',
    pyre_confirm_prompt: 'Type the phrase below to confirm removal',
    pyre_confirm_mismatch: 'That doesn\'t match — try again',
    pyre_confirm_oath: 'I confirm this skill is removed',
    pyre_ignite: '🔥 Remove Skill',
    pyre_progress_label: 'Removing',
    pyre_complete: 'Removed. Space cleared for new skills.',

    // Axis labels
    axis_top: 'STRUCTURED',
    axis_bottom: 'EXPLORATORY',
    axis_left: 'BUILDING',
    axis_right: 'DISRUPTING',

    // Quadrant hover info
    quadrant_craft_title: 'The Builder',
    quadrant_craft_desc: 'You use discipline to build lasting systems.',
    quadrant_craft_examples: 'Engineering, Writing, Project Management',
    quadrant_ritual_title: 'The Analyst',
    quadrant_ritual_desc: 'You use discipline to evaluate and improve systems.',
    quadrant_ritual_examples: 'Quality Checks, Reviews, Research',
    quadrant_sandbox_title: 'The Explorer',
    quadrant_sandbox_desc: 'You play to discover new patterns or ideas.',
    quadrant_sandbox_examples: 'Brainstorming, Prototyping, Experimenting',
    quadrant_mischief_title: 'The Disruptor',
    quadrant_mischief_desc: 'You play to challenge or change existing patterns.',
    quadrant_mischief_examples: 'Growth Hacking, Testing Limits, Marketing',

    // Intro Phase
    intro_headline_1: 'Figure out',
    intro_headline_2: 'what you\'re',
    intro_headline_3: 'best at.',
    intro_subtitle: 'Answer some questions about your skills.\nWe\'ll show you which one is worth money — and how to sell it.',
    intro_input_label: 'What\'s your name?',
    intro_placeholder: 'Your name',
    intro_button: 'Let\'s Go →',
    intro_mode_label: 'How do you think about your work?',

    // Tool Lock
    lock_phase_prefix: 'Step 4:',
    lock_confirm: 'Pick This',

    // Global
    unknown_subject: 'Unknown Person',
    label_pts: 'POINTS',
    phase_label: 'Step',

    // Armory Audit
    armory_subtitle: 'List everything you do regularly. Use action words.',
    armory_view_spatial: 'Visual Map',
    armory_view_terminal: 'List View',
    armory_list_title: 'My Skills',
    armory_empty_spatial: 'No skills added yet. Add at least 3 to see your map.',
    armory_empty_terminal: 'No skills yet. Start adding above.',
    armory_status_label: 'skills',
    armory_proceed: 'Next Step →',
    armory_cap_locked: 'Skill limit reached',
    armory_cap_locked_detail: 'You can have up to {cap} skills. Remove some before adding new ones.',
    armory_cap_input_blocked: 'Limit reached — remove skills first',
    warden_intercept_blocked: 'Content needs revision',
    warden_intercept_warning: 'Some phrases could be more specific. Please revise.',
    cremate_toggle: 'Start over',
    cremate_title: 'Start Fresh',
    cremate_warning: 'This will delete all your data and start from scratch. You cannot undo this.',
    cremate_confirm_prompt: 'Type {word} to confirm',
    cremate_button: 'DELETE AND START OVER',
    xp_phoenix_reborn: 'Fresh start bonus!',
    degraded_banner: 'Time to check in again',
    degraded_detail: "It's been a while! Let's redo your setup to make sure everything is up to date.",
    interrogation_title: 'Quick Challenge',
    interrogation_placeholder: 'Share a real example and explain your thinking...',
    interrogation_xp: '40',
    xp_interrogation: 'Challenge completed — great job!',
    scaffold_title: "What's Coming Up",
    scaffold_success_signal: 'What Success Looks Like',
    scaffold_proceed: 'Ready!',
    simulation_title: 'Practice Round',
    simulation_placeholder: 'Share your response here...',
    simulation_exit: 'Exit',
    simulation_complete: 'Nice work!',
    simulation_fail_msg: 'Try Again',
    simulation_score_label: 'Score',
    simulation_archetype_label: 'Situation',
    simulation_start_btn: 'Start Practice',
    simulation_pass_msg: 'You Did It!',

    // Evidence Scoring
    scoring_subtitle: 'Rate how strong each skill really is. Be honest.',
    scoring_challenging: '⚡ Checking your claim...',
    scoring_proof_unbidden: 'Show proof — paste messages, emails, or requests',
    scoring_proof_result: 'Show proof — paste a testimonial or result',
    scoring_risk_explanation: 'HIGH = You have to do it yourself (a job). LOW = It works without you (an asset).',
    scoring_proceed: 'Done → Pick Your Best Skill',

    // Tool Compression
    compression_sovereign_badge: 'YOUR TOP SKILL',
    compression_sovereign_synthesizing: 'Combining...',
    compression_sovereign_button: 'Combine Into One Top Skill',
    compression_compress_button: 'Analyze My Top Skills',
    compression_result_subtitle: 'We turned your skills into roles you can sell.',
    compression_result_title: 'Your Skills',
    compression_proceed: 'Next Step →',
    compression_select_subtitle: 'Choose 4 things you do best. We will figure out how they combine into one unique skill.',
    compression_cap_warning: '⚠ TOO MANY SKILLS',
    compression_cap_explainer: 'Focus on the 20% of skills that create 80% of your value. Remove or merge until you have {cap} or fewer.',
    compression_analyzing_hint: 'Finding the best way to combine your skills...',
    compression_select_title: 'Combine Your Skills',
    compression_merge_header: 'Suggested Combinations',
    chimera_bond_label: 'WHY THEY WORK TOGETHER',
    chimera_result_subtitle: 'Your Combined Skill — Ready to Sell',
    chimera_fused_from: 'MADE FROM',
    chimera_count: '{n} / 4 Skills Selected',

    // Ritual Dashboard
    ritual_reaudit_button: 'Re-Run Audit →',
    ritual_streak: 'Day Streak',
    ritual_signal_fidelity: 'Progress Score',
    ritual_multiplier: 'Bonus Multiplier',
    cortex_status: 'PROCESSING',

    // ── Signal Triangulation ─────────────────────────
    triangulation_title: 'REFINE YOUR PLAN',
    triangulation_subtitle: '3 Quick Questions',
    triangulation_q1: 'What do you like about this plan?',
    triangulation_q2: 'What would you change?',
    triangulation_q3: 'What\'s stopping you from starting right now?',
    triangulation_label_1: 'QUESTION 1',
    triangulation_label_2: 'QUESTION 2',
    triangulation_label_3: 'QUESTION 3',
    triangulation_next: 'NEXT →',
    triangulation_cta: 'REFINE MY PLAN',
    triangulation_synthesizing: 'UPDATING YOUR PLAN',
    triangulation_footer: '3 ANSWERS • 1 BETTER PLAN',
    triangulation_placeholder: 'Type your answer...',
    triangulation_button: 'REFINE PLAN',

    // Candidate Card Labels
    primitives_menu: 'Suggested Skills (Quick Add)',
    deck_of_sparks: 'AI Suggestions',
    candidate_function: 'What You Do',
    candidate_promise: 'The Outcome',
    candidate_antipitch: "What This Isn\'t",

    // ── Tier 1: Citadel Hardening ────────────────────
    session_vow_title: "START NEW SESSION",
    session_vow_operator_label: "YOUR NAME",
    session_vow_directive_label: "WHAT'S YOUR GOAL?",
    session_vow_define_directive: "SET YOUR GOAL",
    session_vow_placeholder: "What do you want to achieve in this session?",
    session_vow_confirm: "✓ CONFIRM GOAL",
    session_vow_edit: "[ EDIT ]",
    session_vow_initializing: "STARTING...",
    session_vow_hold: "START",

    resurrection_alert: "⚠ HEY THERE!",
    resurrection_inactive_label: "YOU'VE BEEN AWAY FOR {days} DAYS",
    resurrection_message: "Your last session ended. All your data is safe.\nTell us what you're working on to get back in.",
    resurrection_placeholder: "I'm back to work on...",
    resurrection_reactivating: "GETTING READY...",
    resurrection_initiate: "GET STARTED",
    resurrection_protocol_active: "SESSION PAUSED",

    flow_optimal: "GOOD FLOW",
    flow_caution: "BUSY",
    flow_breach: "TOO MUCH",
    flow_offline: "OFF",

    decay_cooling: "NEW",
    decay_stale: "OLD",
    decay_decaying: "VERY OLD",
    decay_plan_status: "⚠ PLAN AGE",
    decay_last_activity: "Last changed",

    tip_download_pdf: 'Save your plan as a PDF you can print or share',
    tip_export_calendar: 'Add your 7-day plan to Google Calendar, Outlook, or Apple Calendar',
    tip_save: 'Save your progress so you can come back and edit later',
    tip_finalize: 'Lock this version — marks your plan as complete',
    tip_finalize_locked: 'Available in {days} days — keep working on your plan.',
    tip_fork: 'Make a new copy of your plan that you can edit freely',
    tip_copy_md: 'Copy your plan text to the clipboard',
    tip_iterate: 'Open the AI editor — tell the AI exactly what to change, add, or remove from your plan. This is the best way to make it yours.',
    tip_consultation: 'Coming soon — talk to an expert for hands-on help',

    // Installation Alerts & Market
    alert_critical_gap: 'Missing Info',
    alert_tov_missing: 'Value Strategy Missing',
    alert_run_upgrade: 'Fix It',
    market_status_title: 'Is It Good?',
    status_containment: 'Too Risky',
    status_scalable: 'Good to Go',
    market_searching: 'Checking...',
    market_run_search: 'Check Market',
    proof_ledger_title: 'Evidence',
    change_tool: '← Back',
    copy_protocol: 'Copy Plan',
    iterate_protocol: 'Improve with AI',
    consultation_coming_soon: 'Talk to an Expert (Soon)',
    proceed_to_dashboard: 'Go to Your Dashboard',
    ritual_dashboard_title: 'Your Dashboard',

    // Proof Tier
    tier_label: 'Status',
    tier_seed: 'Just Started',
    tier_draft: 'Drafting',
    tier_near_final: 'Polishing',
    tier_artifact: 'Complete',

    // Momiyose
    momiyose_title: 'Weekly Review',
    momiyose_subtitle: 'Check your progress.',
    momiyose_seal_button: 'Finish Week',
    momiyose_sealed_alert: 'Week saved.',
    momiyose_toggle: 'Review Week',

    // Cortex
    cortex_input_placeholder: "Ask the AI...",
    cortex_thinking: "Thinking...",
    cortex_memory_saved: "Memory saved.",
};

const DICTIONARIES: Record<VernacularMode, VernacularDictionary> = {
    mythic: MYTHIC,
    industrial: INDUSTRIAL,
    plain: PLAIN,
};

// ── React Context ──────────────────────────────────────────

interface VernacularContextType {
    mode: VernacularMode;
    setMode: (mode: VernacularMode) => void;
    v: VernacularDictionary;
}

const VernacularContext = createContext<VernacularContextType>({
    mode: 'plain',
    setMode: () => { },
    v: PLAIN,
});

export const VernacularProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<VernacularMode>(() => {
        try {
            const saved = localStorage.getItem('tte_vernacular_mode');
            if (saved === 'mythic' || saved === 'industrial' || saved === 'plain') return saved;
        } catch { /* no localStorage */ }
        return 'plain';
    });

    const setMode = (m: VernacularMode) => {
        setModeState(m);
        try { localStorage.setItem('tte_vernacular_mode', m); } catch { /* */ }
    };

    const contextValue = React.useMemo(() => ({
        mode, setMode, v: DICTIONARIES[mode]
    }), [mode]);

    return (
        <VernacularContext.Provider value={contextValue}>
            {children}
        </VernacularContext.Provider>
    );
};

export const useVernacular = () => useContext(VernacularContext);

// ── Quadrant Label Helper ─────────────────────────────────
// Maps raw Quadrant enum values ('Ritual', 'Craft', etc.)
// to mode-aware display labels via the active dictionary.
export function quadrantLabel(q: string, v: VernacularDictionary): string {
    const map: Record<string, string> = {
        Sandbox: v.quadrant_sandbox,
        Mischief: v.quadrant_mischief,
        Craft: v.quadrant_craft,
        Ritual: v.quadrant_ritual,
    };
    return map[q] || q;
}

// ── Convenience Toggle Component ──────────────────────────

export const VernacularToggle: React.FC<{ xp?: number }> = ({ xp }) => {
    const { mode, setMode } = useVernacular();

    const modes: { key: VernacularMode; icon: string; label: string; threshold: number }[] = [
        { key: 'plain', icon: '🛠', label: 'Builder', threshold: 0 },
        { key: 'industrial', icon: '⚙', label: 'Strategist', threshold: 500 },
        { key: 'mythic', icon: '⚔', label: 'Architect', threshold: 2000 },
    ];

    return (
        <div className="flex items-center gap-2 text-xs font-mono">
            {modes.map(m => {
                const isLocked = xp !== undefined && xp < m.threshold;
                return (
                    <button
                        key={m.key}
                        onClick={() => !isLocked && setMode(m.key)}
                        disabled={isLocked}
                        title={isLocked ? `Unlocks at ${m.threshold} XP` : m.label}
                        className={`px-3 py-1.5 border transition-all ${
                            isLocked
                                ? 'border-zinc-900 text-zinc-700 cursor-not-allowed opacity-40'
                                : mode === m.key
                                    ? 'border-white text-bone bg-white/10'
                                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                        }`}
                    >
                        {isLocked ? '🔒' : m.icon} {m.label}
                        {isLocked && <span className="ml-1 text-[8px] text-zinc-600">{m.threshold}XP</span>}
                    </button>
                );
            })}
        </div>
    );
};

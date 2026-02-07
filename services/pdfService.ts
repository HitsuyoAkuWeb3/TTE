import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SystemState, getVerificationLevel, VERIFICATION_LABELS } from '../types';

type PdfMode = 'mythic' | 'industrial' | 'plain';

// Mode-aware label maps for PDF content
const PDF_LABELS: Record<PdfMode, {
    topBar: string;
    title: string;
    operatorLabel: string;
    identitySection: string;
    tovSection: string;
    fatalWound: string;
    sacredCow: string;
    molecularBond: string;
    godfatherOffer: string;
    armorySection: string;
    sovereignLabel: string;
    toolLabel: string;
    scoringSection: string;
    evidenceSection: string;
    protocolSection: string;
    footer: string;
    proofLabel: string;
    filePrefix: string;
}> = {
    mythic: {
        topBar: 'CONFIDENTIAL // SOVEREIGN ARCHITECTURE // FOR OPERATOR USE ONLY',
        title: 'THE SOVEREIGN DOSSIER',
        operatorLabel: 'OPERATOR',
        identitySection: 'IDENTITY MATRIX',
        tovSection: 'THEORY OF VALUE',
        fatalWound: 'Fatal Wound',
        sacredCow: 'Sacred Cow',
        molecularBond: 'Molecular Bond',
        godfatherOffer: 'THE GODFATHER OFFER',
        armorySection: 'THE ARMORY — LOCKED TOOLS',
        sovereignLabel: 'SOVEREIGN',
        toolLabel: 'TOOL',
        scoringSection: 'EVIDENCE SCORING MATRIX',
        evidenceSection: 'EVIDENCE LOG',
        protocolSection: 'PILOT PROTOCOL — 7-DAY EXECUTION',
        footer: 'TETRATOOL ENGINE // SOVEREIGN DOSSIER',
        proofLabel: 'PROOF OF WORK // VERIFIED HUMAN',
        filePrefix: 'Sovereign_Dossier',
    },
    industrial: {
        topBar: 'CONFIDENTIAL // STRATEGIC REPORT // INTERNAL USE',
        title: 'STRATEGIC ASSET REPORT',
        operatorLabel: 'ANALYST',
        identitySection: 'OPERATOR PROFILE',
        tovSection: 'VALUE PROPOSITION',
        fatalWound: 'Core Problem',
        sacredCow: 'Market Assumption',
        molecularBond: 'Competitive Edge',
        godfatherOffer: 'PREMIUM OFFER',
        armorySection: 'ASSET INVENTORY — SELECTED',
        sovereignLabel: 'PRIMARY',
        toolLabel: 'ASSET',
        scoringSection: 'PERFORMANCE AUDIT MATRIX',
        evidenceSection: 'EVIDENCE LOG',
        protocolSection: 'LAUNCH PROTOCOL — 7-DAY EXECUTION',
        footer: 'TETRATOOL ENGINE // STRATEGIC REPORT',
        proofLabel: 'PROOF OF WORK // VERIFIED',
        filePrefix: 'Strategic_Report',
    },
    plain: {
        topBar: 'YOUR PERSONAL ACTION PLAN',
        title: 'YOUR ACTION PLAN',
        operatorLabel: 'NAME',
        identitySection: 'ABOUT YOU',
        tovSection: 'YOUR VALUE',
        fatalWound: 'Problem You Solve',
        sacredCow: 'Common Myth',
        molecularBond: 'What Makes You Different',
        godfatherOffer: 'YOUR OFFER',
        armorySection: 'YOUR SKILLS',
        sovereignLabel: 'TOP SKILL',
        toolLabel: 'SKILL',
        scoringSection: 'SKILL SCORECARD',
        evidenceSection: 'PROOF & EVIDENCE',
        protocolSection: '7-DAY ACTION PLAN',
        footer: 'TETRATOOL ENGINE // ACTION PLAN',
        proofLabel: 'VERIFIED DOCUMENT',
        filePrefix: 'Action_Plan',
    },
};

export const pdfService = {
    generateDossierPDF: async (state: SystemState, mode: PdfMode = 'mythic') => {
        const L = PDF_LABELS[mode];
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;

        // --- HELPER: CENTER TEXT ---
        const centerText = (text: string, y: number, size: number = 12, style: string = 'normal') => {
            doc.setFontSize(size);
            doc.setFont("courier", style);
            const textWidth = doc.getTextWidth(text);
            doc.text(text, (pageWidth - textWidth) / 2, y);
        };

        // --- HELPER: ADD SECTION TITLE ---
        let currentY = 20;
        const addSectionTitle = (title: string) => {
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }
            doc.setDrawColor(40);
            doc.setLineWidth(0.3);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 8;
            doc.setFontSize(12);
            doc.setFont("courier", "bold");
            doc.setTextColor(0);
            doc.text(`[ ${title} ]`, margin, currentY);
            currentY += 8;
        };

        const addKeyValue = (key: string, value: string, maxWidth?: number) => {
            if (currentY > 270) { doc.addPage(); currentY = 20; }
            doc.setFont("courier", "bold");
            doc.setFontSize(9);
            doc.setTextColor(80);
            doc.text(key.toUpperCase(), margin, currentY);
            doc.setFont("courier", "normal");
            doc.setTextColor(0);
            const w = maxWidth || pageWidth - margin * 2 - 45;
            const lines: string[] = doc.splitTextToSize(value, w);
            doc.text(lines, margin + 45, currentY);
            currentY += Math.max(6, lines.length * 4.5) + 4;
        };

        // ── COVER PAGE ──────────────────────────────────────

        // Top bar
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 8, 'F');
        doc.setFont("courier", "bold");
        doc.setFontSize(7);
        doc.setTextColor(255);
        doc.text(L.topBar, margin, 5);
        doc.setTextColor(0);

        centerText(L.title, 35, 22, "bold");
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(margin + 20, 40, pageWidth - margin - 20, 40);

        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        centerText(`${L.operatorLabel}: ${state.profile?.name || 'UNREGISTERED'}`, 50);
        centerText(`DOMAIN: ${state.profile?.industry || 'UNDEFINED'}`, 56);
        centerText(`DATE: ${new Date().toISOString().split('T')[0]}`, 62);
        centerText(`SESSION: ${state.id || 'UNREGISTERED'}`, 68);
        if (state.version) {
            centerText(`VERSION: v${state.version}${state.finalized ? ' — FINALIZED' : ' — DRAFT'}`, 74);
        }

        currentY = 85;

        // ── 1. IDENTITY MATRIX ──────────────────────────────

        addSectionTitle(L.identitySection);
        if (state.profile) {
            const profileData = [
                [L.operatorLabel, state.profile.name],
                ["DOMAIN", state.profile.industry],
                ["DIRECTIVE", state.profile.strategicGoal],
                ["TONE", state.profile.preferredTone.toUpperCase()],
            ];

            autoTable(doc, {
                startY: currentY,
                head: [],
                body: profileData,
                theme: 'plain',
                styles: { font: 'courier', fontSize: 9, cellPadding: 3, textColor: [0, 0, 0] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] },
                    1: { cellWidth: pageWidth - margin * 2 - 40 }
                },
                margin: { left: margin }
            });
            currentY = (doc as any).lastAutoTable.finalY + 12;
        }

        // ── 2. THEORY OF VALUE ──────────────────────────────

        if (state.theoryOfValue) {
            addSectionTitle(L.tovSection);
            const tov = state.theoryOfValue;

            addKeyValue(L.fatalWound, tov.fatalWound);
            addKeyValue(L.sacredCow, tov.sacredCow);
            addKeyValue(L.molecularBond, tov.molecularBond || 'Not synthesized');

            if (tov.godfatherOffer) {
                currentY += 4;
                doc.setFont("courier", "bold");
                doc.setFontSize(10);
                doc.text(L.godfatherOffer, margin, currentY);
                currentY += 8;

                addKeyValue("Name", tov.godfatherOffer.name);
                addKeyValue("Transformation", tov.godfatherOffer.transformation);
                addKeyValue("Price", tov.godfatherOffer.price);
            }
        }

        // ── 3. THE ARMORY — LOCKED TOOLS ────────────────────

        if (state.candidates && state.candidates.length > 0) {
            doc.addPage();
            currentY = 20;
            addSectionTitle(L.armorySection);

            const toolsData = state.candidates.map(c => {
                const level = getVerificationLevel(c);
                return [
                    c.plainName,
                    c.isSovereign ? L.sovereignLabel : L.toolLabel,
                    c.functionStatement,
                    VERIFICATION_LABELS[level]
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['NAME', 'TYPE', 'FUNCTION', 'VERIFICATION']],
                body: toolsData,
                theme: 'grid',
                styles: { font: 'courier', fontSize: 8, cellPadding: 4 },
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 1: { cellWidth: 22 }, 3: { cellWidth: 40 } },
                margin: { left: margin },
                didParseCell: (data: any) => {
                    // Color-code verification column
                    if (data.section === 'body' && data.column.index === 3) {
                        const text = data.cell.text[0] || '';
                        if (text.includes('VERIFIED')) data.cell.styles.textColor = [34, 197, 94];
                        else if (text.includes('PARTIAL')) data.cell.styles.textColor = [202, 138, 4];
                        else data.cell.styles.textColor = [120, 120, 120];
                    }
                }
            });
            currentY = (doc as any).lastAutoTable.finalY + 12;

            // ── SCORE BREAKDOWN ─────────────────────────────

            addSectionTitle(L.scoringSection);

            const scoreLabels = ['Unbidden Requests', 'Frictionless Doing', 'Result Evidence', 'Extraction Risk'];
            const scoreData = state.candidates.map(c => [
                c.plainName,
                String(c.scores.unbiddenRequests),
                String(c.scores.frictionlessDoing),
                String(c.scores.resultEvidence),
                String(c.scores.extractionRisk),
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['TOOL', ...scoreLabels.map(l => l.toUpperCase())]],
                body: scoreData,
                theme: 'grid',
                styles: { font: 'courier', fontSize: 7, cellPadding: 3, halign: 'center' },
                headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
                columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 } },
                margin: { left: margin },
                didParseCell: (data: any) => {
                    if (data.section === 'body' && data.column.index > 0) {
                        const val = parseInt(data.cell.text[0]);
                        if (data.column.index === 4) {
                            // Extraction risk: high = bad
                            if (val >= 4) data.cell.styles.textColor = [220, 38, 38];
                            else if (val <= 1) data.cell.styles.textColor = [34, 197, 94];
                        } else {
                            // Other scores: high = good
                            if (val >= 4) data.cell.styles.textColor = [34, 197, 94];
                            else if (val <= 1) data.cell.styles.textColor = [220, 38, 38];
                        }
                    }
                }
            });
            currentY = (doc as any).lastAutoTable.finalY + 12;

            // ── EVIDENCE SUMMARIES ──────────────────────────

            const hasAnyProof = state.candidates.some(c =>
                Object.values(c.proofs || {}).some(v => v && v.length > 0)
            );

            if (hasAnyProof) {
                addSectionTitle(L.evidenceSection);

                state.candidates.forEach(c => {
                    if (currentY > 250) { doc.addPage(); currentY = 20; }

                    doc.setFont("courier", "bold");
                    doc.setFontSize(9);
                    doc.text(c.plainName.toUpperCase(), margin, currentY);
                    currentY += 6;

                    const proofs = c.proofs || {};
                    const proofEntries = [
                        ['Unbidden', proofs.unbidden],
                        ['Result', proofs.result],
                    ];

                    proofEntries.forEach(([label, value]) => {
                        if (value && (value as string).length > 0) {
                            addKeyValue(label as string, value as string);
                        }
                    });

                    currentY += 4;
                });
            }
        }

        // ── 4. PILOT PROTOCOL ───────────────────────────────

        if (state.pilotPlan) {
            doc.addPage();
            currentY = 20;
            addSectionTitle(L.protocolSection);

            doc.setFontSize(8);
            doc.setFont("courier", "normal");
            doc.setTextColor(0);

            const splitPlan = doc.splitTextToSize(state.pilotPlan, pageWidth - margin * 2);
            doc.text(splitPlan, margin, currentY);
            currentY += splitPlan.length * 3.5 + 10;
        }

        // ── FOOTER — ALL PAGES ──────────────────────────────

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(200);
            doc.setLineWidth(0.2);
            doc.line(margin, 285, pageWidth - margin, 285);
            doc.setFont("courier", "normal");
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(L.footer, margin, 290);
            doc.text(`${i} / ${pageCount}`, pageWidth - margin - 10, 290);
        }

        // ── PROOF OF WORK — SHA-256 HASH ─────────────────

        const stateString = JSON.stringify({
            profile: state.profile,
            candidates: state.candidates,
            selectedToolId: state.selectedToolId,
            theoryOfValue: state.theoryOfValue,
            pilotPlan: state.pilotPlan,
            version: state.version,
            finalizedAt: state.finalizedAt,
        });
        const encoder = new TextEncoder();
        const data = encoder.encode(stateString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Add hash to last page
        const lastPage = doc.getNumberOfPages();
        doc.setPage(lastPage);
        doc.setFont('courier', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(120);
        doc.text(L.proofLabel, margin, 275);
        doc.setFontSize(5);
        doc.setTextColor(150);
        doc.text(`SHA-256: ${hashHex}`, margin, 279);
        doc.text(`Timestamp: ${new Date().toISOString()}`, margin, 282);

        // ── SAVE ────────────────────────────────────────────

        const name = state.profile?.name?.replace(/\s+/g, '_') || 'User';
        doc.save(`${L.filePrefix}_${name}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};

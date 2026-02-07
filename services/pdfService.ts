import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SystemState, getVerificationLevel, VERIFICATION_LABELS } from '../types';

export const pdfService = {
    generateDossierPDF: (state: SystemState) => {
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
        doc.text("CONFIDENTIAL // SOVEREIGN ARCHITECTURE // FOR OPERATOR USE ONLY", margin, 5);
        doc.setTextColor(0);

        centerText("THE SOVEREIGN DOSSIER", 35, 22, "bold");
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(margin + 20, 40, pageWidth - margin - 20, 40);

        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        centerText(`OPERATOR: ${state.profile?.name || 'UNREGISTERED'}`, 50);
        centerText(`DOMAIN: ${state.profile?.industry || 'UNDEFINED'}`, 56);
        centerText(`DATE: ${new Date().toISOString().split('T')[0]}`, 62);
        centerText(`SESSION: ${state.id || 'UNREGISTERED'}`, 68);
        if (state.version) {
            centerText(`VERSION: v${state.version}${state.finalized ? ' — FINALIZED' : ' — DRAFT'}`, 74);
        }

        currentY = 85;

        // ── 1. IDENTITY MATRIX ──────────────────────────────

        addSectionTitle("IDENTITY MATRIX");
        if (state.profile) {
            const profileData = [
                ["OPERATOR", state.profile.name],
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
            addSectionTitle("THEORY OF VALUE");
            const tov = state.theoryOfValue;

            addKeyValue("Fatal Wound", tov.fatalWound);
            addKeyValue("Sacred Cow", tov.sacredCow);
            addKeyValue("Molecular Bond", tov.molecularBond || 'Not synthesized');

            if (tov.godfatherOffer) {
                currentY += 4;
                doc.setFont("courier", "bold");
                doc.setFontSize(10);
                doc.text("THE GODFATHER OFFER", margin, currentY);
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
            addSectionTitle("THE ARMORY — LOCKED TOOLS");

            const toolsData = state.candidates.map(c => {
                const level = getVerificationLevel(c);
                return [
                    c.plainName,
                    c.isSovereign ? "SOVEREIGN" : "TOOL",
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

            addSectionTitle("EVIDENCE SCORING MATRIX");

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
                addSectionTitle("EVIDENCE LOG");

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
            addSectionTitle("PILOT PROTOCOL — 7-DAY EXECUTION");

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
            doc.text("TETRATOOL ENGINE // SOVEREIGN DOSSIER", margin, 290);
            doc.text(`${i} / ${pageCount}`, pageWidth - margin - 10, 290);
        }

        // ── SAVE ────────────────────────────────────────────

        const name = state.profile?.name?.replace(/\s+/g, '_') || 'User';
        doc.save(`Sovereign_Dossier_${name}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};

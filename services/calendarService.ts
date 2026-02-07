// ============================================================
// CALENDAR SERVICE — .ics Ritual Protocol Generator
// ============================================================

interface RitualBlock {
    day: number;
    title: string;
    description: string;
    durationMinutes: number;
}

const SEVEN_DAY_PROTOCOL: RitualBlock[] = [
    {
        day: 1,
        title: 'RECON — Market Contact',
        description: 'Reach out to 3 potential clients. Log responses. Note: Who responded? Who ghosted? What signal does that send?',
        durationMinutes: 45,
    },
    {
        day: 2,
        title: 'REFINE — Offer Sharpening',
        description: 'Review your Godfather Offer. Rewrite the transformation promise in 10 words or fewer. Test it on one person.',
        durationMinutes: 30,
    },
    {
        day: 3,
        title: 'DEPLOY — Content Strike',
        description: 'Publish one piece of content (post, video, email) using your Fatal Wound insight. Measure engagement.',
        durationMinutes: 60,
    },
    {
        day: 4,
        title: 'AUDIT — Pipeline Review',
        description: 'How many conversations are active? How many are stalled? Kill stalled leads. Double down on warm ones.',
        durationMinutes: 30,
    },
    {
        day: 5,
        title: 'FORGE — Asset Creation',
        description: 'Build one reusable asset: a template, a script, a framework. Something that compounds your effort.',
        durationMinutes: 60,
    },
    {
        day: 6,
        title: 'CALIBRATE — Somatic Check',
        description: 'Rate your energy 1-10. If below 5, identify the drain source. Adjust next week accordingly. Energy IS leverage.',
        durationMinutes: 20,
    },
    {
        day: 7,
        title: 'REPORT — Weekly Proof',
        description: 'Log total revenue, clients reached, offers sent. Compare to last week. This is your Proof of Work.',
        durationMinutes: 30,
    },
];

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

function formatICSDate(date: Date): string {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@tetratool`;
}

/**
 * Generate a 7-day ritual protocol .ics calendar file and trigger download
 */
export function downloadRitualCalendar(toolName: string, startDate?: Date): void {
    const start = startDate || new Date();
    // Start tomorrow at 9 AM
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);

    const events = SEVEN_DAY_PROTOCOL.map((ritual, i) => {
        const eventStart = new Date(start);
        eventStart.setDate(eventStart.getDate() + i);

        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + ritual.durationMinutes);

        return [
            'BEGIN:VEVENT',
            `UID:${generateUID()}`,
            `DTSTART:${formatICSDate(eventStart)}`,
            `DTEND:${formatICSDate(eventEnd)}`,
            `SUMMARY:[TTE] Day ${ritual.day}: ${ritual.title}`,
            `DESCRIPTION:${ritual.description.replace(/\n/g, '\\n')}\\n\\nSovereign Tool: ${toolName}`,
            `CATEGORIES:TetraTool,Ritual Protocol`,
            'STATUS:CONFIRMED',
            `TRANSP:OPAQUE`,
            'BEGIN:VALARM',
            'TRIGGER:-PT15M',
            'ACTION:DISPLAY',
            `DESCRIPTION:Ritual Protocol — ${ritual.title}`,
            'END:VALARM',
            'END:VEVENT',
        ].join('\r\n');
    });

    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TetraTool Engine//Ritual Protocol//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:TTE 7-Day Protocol — ${toolName}`,
        ...events,
        'END:VCALENDAR',
    ].join('\r\n');

    // Trigger download
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TTE_Ritual_Protocol_${toolName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

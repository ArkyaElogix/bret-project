export function getScoreLabel(score: number): string {
    if (score >= 5) return 'Very Strong';
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Moderate';
    if (score >= 2) return 'Mild';
    if (score >= 1) return 'Weak';
    return 'Absence';
}

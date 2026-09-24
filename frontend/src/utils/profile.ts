export const calculateProfileCompletion = (profile: any) => {
    if (!profile) return 0;
    
    const fields = [
        'careerTitle',
        'bio',
        'experience',
        'education',
        'location',
        'resumeUrl',
        'linkedInUrl',
        'portfolioUrl'
    ];
    
    const filledFields = fields.filter(field => {
        const val = profile[field];
        return val !== null && val !== undefined && val.toString().trim() !== '';
    }).length;

    return Math.round((filledFields / fields.length) * 100);
};

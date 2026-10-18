export const calculateProfileCompletion = (profile: any) => {
    if (!profile) return 0;
    
    let score = 0;

    // 1. Basic Information (40%)
    if (profile.careerTitle?.trim()) score += 10;
    if (profile.location?.trim()) score += 10;
    if (profile.bio?.trim()) score += 10;
    if (profile.linkedInUrl?.trim() || profile.portfolioUrl?.trim()) score += 10;

    // 2. Resume Uploaded (20%)
    if (profile.resumeUrl || (profile.resumes && profile.resumes.length > 0)) score += 20;

    // 3. Work Experience (15%)
    if (profile.experience?.trim() || (profile.workHistories && profile.workHistories.length > 0)) score += 15;

    // 4. Education (10%)
    if (profile.education?.trim() || (profile.educations && profile.educations.length > 0)) score += 10;

    // 5. Skills Added (10%)
    if (profile.skills && profile.skills.length > 0) score += 10;

    // 6. Languages / Certifications (5%)
    if ((profile.languages && profile.languages.length > 0) || (profile.certifications && profile.certifications.length > 0)) score += 5;

    return Math.min(100, score);
};

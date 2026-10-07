import type {
  FutureLeader,
  Endorsement,
  Nomination,
  CredibilityBreakdown,
  PathwayStage,
  ReadinessThreshold,
  PathwayToRealPoliticsContent,
} from '@/types/leaders'

// ─── Credibility formula ──────────────────────────────────────────────────────
// Score 0–100 built from 5 sub-scores. Deterministic from mock data fields.
// Thresholds (consistent with CivicScorecard): >= 65 green | >= 45 amber | < 45 red

export function computeCredibility(
  nom: Nomination,
  endorsements: Endorsement[],
  concerns: Endorsement[],
): CredibilityBreakdown {
  const exp = nom.evidence.filter(e => e.category === 'experience')
  const ach = nom.evidence.filter(e => e.category === 'achievement')
  const com = nom.evidence.filter(e => e.category === 'community')

  const experienceScore  = Math.min(25, exp.length * 8 + exp.filter(e => e.verifiable).length * 3)
  const achievementScore = Math.min(25, ach.length * 8 + ach.filter(e => e.verifiable).length * 3)
  const communityScore   = Math.min(20, com.length * 6 + com.filter(e => e.verifiable).length * 2)
  const endorsementScore = Math.min(20, Math.max(0, endorsements.length * 2 - concerns.length))
  const reasoningScore   = Math.min(10, Math.floor(nom.justification.length / 50))
  const total = experienceScore + achievementScore + communityScore + endorsementScore + reasoningScore

  return { experienceScore, achievementScore, communityScore, endorsementScore, reasoningScore, total }
}

// ─── Mock leaders ─────────────────────────────────────────────────────────────

export const LEADERS: FutureLeader[] = [
  // 1. Sara Patel — NSW | Housing | Ready | State Level | Rising
  {
    id: 'leader-sara-patel',
    name: 'Sara Patel',
    location: 'Inner West, Sydney NSW',
    state: 'NSW',
    field: 'Housing',
    shortBio: 'Housing policy advocate who led a successful community land trust campaign, securing 200 affordable homes in western Sydney.',
    fullBio: 'Sara Patel has spent eight years working at the intersection of community organising and housing policy in Western Sydney. She served three terms on Inner West Council, where she championed inclusionary zoning reforms that became a model for other NSW councils. Her community land trust campaign — the first of its kind at scale in Australia — secured 200 permanently affordable homes and drew national attention. Sara holds a Masters in Urban Planning from UNSW and is a regular contributor to national housing policy debates. She has been endorsed by the Community Housing Industry Association as a credible voice for reform.',
    avatarInitials: 'SP',
    readiness: 'Ready',
    currentPathwayStage: 'State Level',
    pathwayHistory: ['Community Contributor', 'Local Council'],
    isRising: true,
    isTrending: true,
    isControversial: false,
    nominatedAt: '2025-11-15',
    tags: ['housing', 'community', 'NSW', 'urban planning'],
    linkedIssueAreas: ['Housing', 'Social Services'],
    linkedDecisions: [
      { decisionId: 'd-housing-fund', relevance: 'Vocal advocate for the federal housing fund; testified before the Senate committee in support.' },
    ],
    nomination: {
      id: 'nom-sara-patel',
      nominatorHandle: '@civic_user_81',
      justification: 'Sara Patel has demonstrated exactly the kind of evidence-based, community-first leadership that Australian politics desperately needs. Her track record on Inner West Council is verifiable and impressive — she turned housing advocacy into concrete outcomes, not just rhetoric. Her community land trust model is being studied by three state governments. She brings policy rigour and genuine community trust in equal measure.',
      evidence: [
        {
          category: 'experience',
          description: 'Served three consecutive terms (9 years) on Inner West Council, chairing the Planning and Development Committee for the final term.',
          verifiable: true,
          sourceUrl: 'https://www.innerwest.nsw.gov.au',
        },
        {
          category: 'achievement',
          description: 'Led the Western Sydney Community Land Trust campaign, resulting in 200 permanently affordable homes — the largest CLT development in Australian history at the time.',
          verifiable: true,
        },
        {
          category: 'community',
          description: 'Runs a weekly free housing rights clinic in Marrickville, assisting over 300 renters per year with advocacy and legal referrals.',
          verifiable: false,
        },
      ],
      nominatedAt: '2025-11-15',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-sp-1', leaderId: 'leader-sara-patel', type: 'endorse', reason: 'I worked alongside Sara on the Inner West Planning Committee. Her ability to translate community needs into policy language — and get it passed — is exceptional. She is the most effective local councillor I have encountered in 20 years of planning practice.', authorHandle: '@planning_prof_UTS', authorCredential: 'Urban Planning Academic', createdAt: '2025-11-20', weight: 2 },
      { id: 'end-sp-2', leaderId: 'leader-sara-patel', type: 'endorse', reason: 'Sara helped my family navigate an eviction dispute pro bono. She knew the law, knew the process, and genuinely cared about the outcome. That kind of servant leadership is rare in anyone, let alone someone with real policy influence.', authorHandle: '@marrickville_renter', createdAt: '2025-11-22', weight: 1 },
      { id: 'end-sp-3', leaderId: 'leader-sara-patel', type: 'endorse', reason: 'The Community Land Trust framework Sara developed has been cited in submissions to the Senate Select Committee on Housing Affordability. Her work is already shaping national policy from the outside — imagine what she could do from the inside.', authorHandle: '@housing_researcher_42', authorCredential: 'Housing Policy Researcher', createdAt: '2025-12-01', weight: 2 },
      { id: 'end-sp-4', leaderId: 'leader-sara-patel', type: 'endorse', reason: 'Attended her public housing forum in Marrickville. She handled hostile questions from developers and frustrated tenants with equal composure and intelligence. That is genuine leadership under pressure.', authorHandle: '@civic_user_204', createdAt: '2025-12-05', weight: 1 },
      { id: 'end-sp-5', leaderId: 'leader-sara-patel', type: 'endorse', reason: 'As a small business owner in Newtown, I was initially sceptical of her approach to zoning. But Sara came to speak with us directly, listened to our concerns, and incorporated a local business protection clause into the final proposal. That is what good governance looks like.', authorHandle: '@newtown_merchant', createdAt: '2025-12-10', weight: 1 },
      { id: 'end-sp-6', leaderId: 'leader-sara-patel', type: 'endorse', reason: 'Sara Patel is the most prepared future politician I have seen since entering community advocacy work 15 years ago. She understands systems, she understands people, and she has the patience to work within imperfect institutions while pushing them toward better outcomes.', authorHandle: '@tenants_union_nsw', authorCredential: 'Tenants Union Representative', createdAt: '2025-12-12', weight: 2 },
    ],
    concerns: [
      { id: 'con-sp-1', leaderId: 'leader-sara-patel', type: 'concern', reason: 'Supportive of Sara generally but want to flag that her 2023 position on height limits in Sydenham was inconsistent with her stated affordability goals. This contradiction should be addressed before she seeks higher office — voters will scrutinise it.', authorHandle: '@sydenham_resident', createdAt: '2025-12-08', weight: 1 },
    ],
    credibility: { experienceScore: 22, achievementScore: 22, communityScore: 14, endorsementScore: 11, reasoningScore: 7, total: 76 },
    supportSummary: {
      totalSupporters: 312,
      volunteerCount: 67,
      skilledContributorCount: 22,
      localBreakdown: [
        { city: 'Inner West', state: 'NSW', count: 148 },
        { city: 'Greater Sydney', state: 'NSW', count: 89 },
        { city: 'Parramatta', state: 'NSW', count: 31 },
      ],
      skillBreakdown: { Legal: 5, Marketing: 4, Policy: 6, Communications: 4, Technology: 3 },
    },
  },

  // 2. Marcus Webb — VIC | Environment | Ready | Local Council | Rising
  {
    id: 'leader-marcus-webb',
    name: 'Marcus Webb',
    location: 'Brunswick, Melbourne VIC',
    state: 'VIC',
    field: 'Environment',
    shortBio: 'Former marine biologist turned climate policy advocate. Helped establish Victoria\'s first coastal resilience framework and leads a grassroots renewable energy co-op.',
    fullBio: 'Marcus Webb spent twelve years as a marine biologist with CSIRO before pivoting to climate policy advocacy. He co-founded the Bays and Coasts Alliance, a coalition of 40 community groups that successfully lobbied for the Victorian Coastal Resilience Framework — now a national template. He leads the Brunswick Renewable Energy Co-op, which has installed solar on over 400 low-income homes across Melbourne\'s inner north. Marcus holds a PhD in marine ecology and has testified before multiple state and federal parliamentary committees. He was elected to Moreland City Council in 2024 on a climate action platform.',
    avatarInitials: 'MW',
    readiness: 'Ready',
    currentPathwayStage: 'Local Council',
    pathwayHistory: ['Community Contributor'],
    isRising: true,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2025-10-03',
    tags: ['environment', 'climate', 'VIC', 'renewable energy'],
    linkedIssueAreas: ['Environment', 'Economy'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-marcus-webb',
      nominatorHandle: '@climate_council_vic',
      justification: 'Marcus Webb is the rare combination of scientific rigour and political effectiveness. He does not just understand the problem — he has spent a decade building the coalitions needed to solve it. His track record of translating complex environmental science into actionable policy is exactly what Australian politics needs as it navigates the energy transition. His community co-op work demonstrates that he can deliver tangible outcomes, not just advocacy.',
      evidence: [
        {
          category: 'experience',
          description: 'Twelve years as Senior Research Scientist at CSIRO Marine and Atmospheric Research, specialising in coastal ecosystem response to climate change.',
          verifiable: true,
          sourceUrl: 'https://www.csiro.au',
        },
        {
          category: 'achievement',
          description: 'Co-founded the Bays and Coasts Alliance and led the campaign that produced the Victorian Coastal Resilience Framework — adopted by the state government in 2023 and cited as a model by the federal Climate Change Authority.',
          verifiable: true,
        },
        {
          category: 'community',
          description: 'Established and leads the Brunswick Renewable Energy Co-op; 400+ low-income homes with solar installed, reducing household energy bills by average $900/year.',
          verifiable: true,
        },
      ],
      nominatedAt: '2025-10-03',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-mw-1', leaderId: 'leader-marcus-webb', type: 'endorse', reason: 'I have worked with Marcus through the Bays and Coasts Alliance for four years. He combines scientific credibility with genuine political skill — he knows when to push hard and when to find common ground. His work on the Coastal Framework proves he can deliver systemic change.', authorHandle: '@env_law_centre_vic', authorCredential: 'Environmental Law Practitioner', createdAt: '2025-10-15', weight: 2 },
      { id: 'end-mw-2', leaderId: 'leader-marcus-webb', type: 'endorse', reason: 'Marcus installed solar on my housing commission flat 18 months ago through his co-op. My bills dropped from $280 to $60 a month. He did not just organise this — he showed up himself to explain how it worked. A politician who does the work.', authorHandle: '@public_housing_resident_melb', createdAt: '2025-10-20', weight: 1 },
      { id: 'end-mw-3', leaderId: 'leader-marcus-webb', type: 'endorse', reason: 'As a farmer in the Gippsland region, I was sceptical of urban environmentalists. Marcus came out to our region three times before making any policy statements about agricultural land use. He listened first. That earns respect.', authorHandle: '@gippsland_grazier', createdAt: '2025-11-01', weight: 1 },
      { id: 'end-mw-4', leaderId: 'leader-marcus-webb', type: 'endorse', reason: 'Marcus testified before our committee on coastal erosion risk. His evidence was the most technically rigorous and practically grounded we received across the entire inquiry. He has a rare ability to make complex science accessible without dumbing it down.', authorHandle: '@vic_parl_committee_member', authorCredential: 'Parliamentary Adviser', createdAt: '2025-11-10', weight: 2 },
    ],
    concerns: [],
    credibility: { experienceScore: 25, achievementScore: 22, communityScore: 18, endorsementScore: 8, reasoningScore: 8, total: 81 },
    supportSummary: {
      totalSupporters: 94,
      volunteerCount: 18,
      skilledContributorCount: 7,
      localBreakdown: [
        { city: 'Brunswick', state: 'VIC', count: 52 },
        { city: 'Fitzroy', state: 'VIC', count: 24 },
        { city: 'Northcote', state: 'VIC', count: 11 },
      ],
      skillBreakdown: { Technology: 3, Policy: 2, Data: 2 },
    },
  },

  // 3. Anika Johansson — QLD | Healthcare | Developing | Local Council
  {
    id: 'leader-anika-johansson',
    name: 'Anika Johansson',
    location: 'Fortitude Valley, Brisbane QLD',
    state: 'QLD',
    field: 'Healthcare',
    shortBio: 'Emergency nurse and mental health advocate pushing for systemic reform in Queensland\'s hospital system, with a focus on rural health equity.',
    fullBio: 'Anika Johansson has worked as an emergency nurse at the Royal Brisbane and Women\'s Hospital for eleven years. She co-founded the Queensland Rural Health Equity Network after witnessing the stark disparity in care outcomes between metropolitan and regional patients. Her advocacy led to a Senate inquiry into rural emergency services, and she has since developed a workforce distribution proposal adopted in modified form by Queensland Health. Anika sits on the Brisbane City Council\'s Health Advisory Panel and holds a Graduate Certificate in Health Policy from UQ. She is building toward a state-level run in 2028.',
    avatarInitials: 'AJ',
    readiness: 'Developing',
    currentPathwayStage: 'Local Council',
    pathwayHistory: ['Community Contributor'],
    isRising: false,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2025-12-01',
    tags: ['healthcare', 'rural health', 'QLD', 'mental health'],
    linkedIssueAreas: ['Healthcare', 'Social Services'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-anika-johansson',
      nominatorHandle: '@qld_nurses_union',
      justification: 'Anika Johansson is one of the most credible voices on healthcare equity in Queensland. She has eleven years of frontline experience, a strong policy track record through the Rural Health Equity Network, and the respect of both clinical and administrative stakeholders. She is not yet ready for federal parliament but is developing rapidly and should be supported at state level.',
      evidence: [
        {
          category: 'experience',
          description: 'Senior Emergency Nurse at Royal Brisbane and Women\'s Hospital for 11 years, including 3 years as Clinical Nurse Educator.',
          verifiable: true,
        },
        {
          category: 'achievement',
          description: 'Co-founded Queensland Rural Health Equity Network; her advocacy directly triggered a Senate inquiry into rural emergency service disparities, and her workforce distribution model was adopted in modified form by Queensland Health in 2024.',
          verifiable: true,
          sourceUrl: 'https://www.health.qld.gov.au',
        },
        {
          category: 'community',
          description: 'Volunteers monthly with the Street Medicine Brisbane program, providing primary care to people experiencing homelessness.',
          verifiable: false,
        },
      ],
      nominatedAt: '2025-12-01',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-aj-1', leaderId: 'leader-anika-johansson', type: 'endorse', reason: 'Anika\'s Rural Health Equity Network has been a vital voice in our policy work. Her submissions are evidence-based, practical, and she consistently follows up — a rarity among advocates. She would bring genuine frontline expertise into a political system that badly needs it.', authorHandle: '@ama_queensland', authorCredential: 'Medical Association Representative', createdAt: '2025-12-10', weight: 2 },
      { id: 'end-aj-2', leaderId: 'leader-anika-johansson', type: 'endorse', reason: 'As someone from rural Queensland who nearly lost a family member due to inadequate emergency response times, Anika\'s work on rural health equity is deeply personal to me. She understands this issue from every angle — clinical, systemic, and human.', authorHandle: '@rural_qld_voice', createdAt: '2025-12-15', weight: 1 },
      { id: 'end-aj-3', leaderId: 'leader-anika-johansson', type: 'endorse', reason: 'Attended her presentation to the Health Advisory Panel last month. Anika communicates complex health system dynamics with clarity and confidence. She also listens well — changed her own proposal based on feedback from GPs in the room. That is political maturity.', authorHandle: '@brisbane_gp_network', authorCredential: 'GP Practice Network Coordinator', createdAt: '2025-12-18', weight: 2 },
    ],
    concerns: [],
    credibility: { experienceScore: 19, achievementScore: 22, communityScore: 12, endorsementScore: 6, reasoningScore: 6, total: 65 },
    supportSummary: {
      totalSupporters: 78,
      volunteerCount: 14,
      skilledContributorCount: 5,
      localBreakdown: [
        { city: 'Fortitude Valley', state: 'QLD', count: 38 },
        { city: 'South Brisbane', state: 'QLD', count: 27 },
        { city: 'Ipswich', state: 'QLD', count: 9 },
      ],
      skillBreakdown: { Communications: 2, Policy: 2, Operations: 1 },
    },
  },

  // 4. Dion Murray — WA | Indigenous Affairs | Developing | Community Contributor | Rising
  {
    id: 'leader-dion-murray',
    name: 'Dion Murray',
    location: 'Fremantle, Perth WA',
    state: 'WA',
    field: 'Indigenous Affairs',
    shortBio: 'Noongar cultural leader and law graduate working on treaty frameworks and land rights in Western Australia. Founding director of a First Nations legal centre.',
    fullBio: 'Dion Murray is a Noongar man from the south-west of Western Australia. After completing a law degree at UWA, he returned to community to establish the Wadjuk First Nations Legal Centre — the only community-controlled legal service covering land rights and cultural heritage in the Perth metropolitan area. He has been central to the WA treaty consultation process, contributing a framework document that shaped the state government\'s First Nations Treaty Pathway. Dion is an emerging voice nationally on constitutional recognition and sits on the National Indigenous Australians Agency advisory panel. He is at an early stage of a pathway that could lead to state or federal representation.',
    avatarInitials: 'DM',
    readiness: 'Developing',
    currentPathwayStage: 'Community Contributor',
    pathwayHistory: [],
    isRising: true,
    isTrending: true,
    isControversial: false,
    nominatedAt: '2026-01-10',
    tags: ['indigenous affairs', 'treaty', 'WA', 'legal', 'Noongar'],
    linkedIssueAreas: ['Social Services', 'Economy'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-dion-murray',
      nominatorHandle: '@first_nations_wa',
      justification: 'Dion Murray represents a generation of First Nations leaders who combine deep cultural knowledge with professional expertise and genuine political skill. His treaty framework work is substantive and has already influenced state government policy. He is not a spokesperson — he is a thinker and strategist. Australia needs more Indigenous leaders in parliament who can engage on the full breadth of policy, not just issues labelled as Indigenous affairs.',
      evidence: [
        {
          category: 'experience',
          description: 'Bachelor of Laws (Hons) from UWA; founding director of Wadjuk First Nations Legal Centre; member of the National Indigenous Australians Agency advisory panel.',
          verifiable: true,
        },
        {
          category: 'achievement',
          description: 'Authored the community framework document on treaty negotiation principles that was formally cited in the WA Government\'s First Nations Treaty Pathway consultation paper (2025).',
          verifiable: true,
          sourceUrl: 'https://www.dpc.wa.gov.au',
        },
        {
          category: 'community',
          description: 'Leads cultural heritage protection workshops for Noongar community members and provides pro bono legal advice on cultural heritage site disputes.',
          verifiable: false,
        },
      ],
      nominatedAt: '2026-01-10',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-dm-1', leaderId: 'leader-dion-murray', type: 'endorse', reason: 'Dion\'s treaty framework document is the most thoughtful and practically grounded community submission I have reviewed in 15 years of working on land rights. He understands the legal system, the political system, and his community\'s needs — that combination is genuinely rare.', authorHandle: '@land_rights_lawyer_wa', authorCredential: 'Land Rights Legal Practitioner', createdAt: '2026-01-20', weight: 2 },
      { id: 'end-dm-2', leaderId: 'leader-dion-murray', type: 'endorse', reason: 'Dion helped my family challenge an illegal heritage site clearance. He won the case, but more importantly, he documented everything and used it to push for a systemic change in heritage approval processes. He thinks beyond the immediate problem.', authorHandle: '@noongar_community_member', createdAt: '2026-01-25', weight: 1 },
      { id: 'end-dm-3', leaderId: 'leader-dion-murray', type: 'endorse', reason: 'I have attended Dion\'s cultural heritage workshops. He communicates across cultural and professional divides with exceptional skill. He brings non-Indigenous stakeholders into understanding without compromising the integrity of First Nations knowledge systems. That is leadership.', authorHandle: '@heritage_consultant_perth', authorCredential: 'Cultural Heritage Consultant', createdAt: '2026-02-01', weight: 2 },
    ],
    concerns: [],
    credibility: { experienceScore: 14, achievementScore: 19, communityScore: 12, endorsementScore: 6, reasoningScore: 8, total: 59 },
    supportSummary: {
      totalSupporters: 28,
      volunteerCount: 4,
      skilledContributorCount: 1,
      localBreakdown: [
        { city: 'Fremantle', state: 'WA', count: 14 },
        { city: 'Perth', state: 'WA', count: 9 },
        { city: 'Rockingham', state: 'WA', count: 4 },
      ],
      skillBreakdown: { Legal: 1 },
    },
  },

  // 5. Priya Krishnan — SA | Education | Ready | Federal Level
  {
    id: 'leader-priya-krishnan',
    name: 'Priya Krishnan',
    location: 'Norwood, Adelaide SA',
    state: 'SA',
    field: 'Education',
    shortBio: 'Former school principal and education policy researcher who overhauled STEM curriculum outcomes in South Australia and now advises the federal Education Department.',
    fullBio: 'Priya Krishnan served as principal of Norwood Morialta High School for nine years, during which time the school achieved the highest NAPLAN improvement trajectory in South Australia for three consecutive years. She developed a cross-school STEM partnership model now adopted by 28 schools across SA. Following her school leadership, Priya completed a PhD in Education Policy at Adelaide University and was appointed to the federal Education Advisory Council. She has advised on two national curriculum reviews and is a regular voice in public debates on educational equity and teacher workforce issues. She is considering a run for the Senate.',
    avatarInitials: 'PK',
    readiness: 'Ready',
    currentPathwayStage: 'Federal Level',
    pathwayHistory: ['Community Contributor', 'Local Council', 'State Level'],
    isRising: false,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2025-09-20',
    tags: ['education', 'STEM', 'SA', 'curriculum'],
    linkedIssueAreas: ['Education', 'Economy'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-priya-krishnan',
      nominatorHandle: '@aust_education_union_sa',
      justification: 'Priya Krishnan is one of the most accomplished education leaders in Australia. Her record at Norwood Morialta is measurable and significant — three years of leading NAPLAN improvement does not happen by accident. Her policy work at the federal level demonstrates she can operate in complex bureaucratic environments without losing her focus on outcomes for students and teachers. She is ready for the Senate and would be an asset to any parliament.',
      evidence: [
        {
          category: 'experience',
          description: 'Nine years as school principal; PhD in Education Policy (Adelaide); member of the Federal Education Advisory Council; adviser to two national curriculum reviews.',
          verifiable: true,
        },
        {
          category: 'achievement',
          description: 'Led Norwood Morialta High School to three consecutive years of highest NAPLAN improvement trajectory in SA; STEM partnership model adopted by 28 SA schools.',
          verifiable: true,
          sourceUrl: 'https://www.education.sa.gov.au',
        },
        {
          category: 'community',
          description: 'Mentors early-career teachers from low-SES backgrounds through the South Australian Teacher Pathways program, with 12 active mentees currently.',
          verifiable: false,
        },
      ],
      nominatedAt: '2025-09-20',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-pk-1', leaderId: 'leader-priya-krishnan', type: 'endorse', reason: 'I worked with Priya on the national curriculum review. She is one of the few voices in education policy who bridges the gap between classroom reality and system design. Her contributions shaped chapters 3 and 7 of the final report in ways that will benefit students for a generation.', authorHandle: '@curriculum_review_member', authorCredential: 'Federal Education Policy Adviser', createdAt: '2025-10-01', weight: 2 },
      { id: 'end-pk-2', leaderId: 'leader-priya-krishnan', type: 'endorse', reason: 'Priya was my principal for four years. She was the reason I stayed in teaching. She protected teachers from administrative overload while holding us to high standards. Any parliament that gets her is getting someone who actually understands what educators need.', authorHandle: '@SA_teacher_2019', createdAt: '2025-10-08', weight: 1 },
      { id: 'end-pk-3', leaderId: 'leader-priya-krishnan', type: 'endorse', reason: 'As a parent at Norwood Morialta during Priya\'s tenure, I watched the school transform in practical, visible ways — better relationships between staff and students, clearer communication with parents, and measurable academic improvement. She delivers outcomes, not just ideas.', authorHandle: '@nm_high_parent_2022', createdAt: '2025-10-15', weight: 1 },
      { id: 'end-pk-4', leaderId: 'leader-priya-krishnan', type: 'endorse', reason: 'Priya\'s evidence to the Senate Select Committee on Teacher Workforce was the most cited submission across all committee hearings. Her proposal for differential pay in high-need schools has since been adopted as a policy pilot. That is real-world policy impact.', authorHandle: '@senate_education_committee_staff', authorCredential: 'Parliamentary Staff', createdAt: '2025-11-01', weight: 2 },
    ],
    concerns: [],
    credibility: { experienceScore: 25, achievementScore: 25, communityScore: 14, endorsementScore: 8, reasoningScore: 8, total: 80 },
    supportSummary: {
      totalSupporters: 487,
      volunteerCount: 96,
      skilledContributorCount: 29,
      localBreakdown: [
        { city: 'Norwood', state: 'SA', count: 214 },
        { city: 'Adelaide CBD', state: 'SA', count: 163 },
        { city: 'Prospect', state: 'SA', count: 68 },
      ],
      skillBreakdown: { Policy: 8, Communications: 6, Legal: 5, Marketing: 4, Data: 3, Technology: 3 },
    },
  },

  // 6. James O'Brien — TAS | Economy | Not Ready | Community Contributor | PENDING
  {
    id: 'leader-james-obrien',
    name: "James O'Brien",
    location: 'Launceston, TAS',
    state: 'TAS',
    field: 'Economy',
    shortBio: 'Small business owner and regional economic advocate with strong views on Tasmania\'s economic future but limited policy development experience to date.',
    fullBio: "James O'Brien has operated a small manufacturing business in Launceston for fourteen years. He is active in the Launceston Chamber of Commerce and has spoken at several local government meetings on economic development. He runs a popular regional economics blog with a small but engaged readership. James is passionate about Tasmania's economic future but is at an early stage in developing the policy expertise and institutional relationships needed for effective political leadership.",
    avatarInitials: 'JO',
    readiness: 'Not Ready',
    currentPathwayStage: 'Community Contributor',
    pathwayHistory: [],
    isRising: false,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2026-02-05',
    tags: ['economy', 'TAS', 'small business', 'regional'],
    linkedIssueAreas: ['Economy'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-james-obrien',
      nominatorHandle: '@launceston_chamber',
      justification: 'James is a respected local business leader with genuine passion for Tasmania\'s economic future. He brings a practical private-sector perspective that is underrepresented in Tasmanian politics. He needs more time to develop his policy platform and broader stakeholder relationships before seeking office, but the foundation is there.',
      evidence: [
        {
          category: 'experience',
          description: 'Owner-operator of a 14-person manufacturing business in Launceston for 14 years; active member of Launceston Chamber of Commerce.',
          verifiable: true,
        },
        {
          category: 'community',
          description: 'Publishes a regional economics blog and speaks at local government meetings on economic development topics.',
          verifiable: false,
        },
      ],
      nominatedAt: '2026-02-05',
      consentGiven: false,  // Profile pending consent — will not appear publicly
      moderationStatus: 'pending',
    },
    endorsements: [
      { id: 'end-jo-1', leaderId: 'leader-james-obrien', type: 'endorse', reason: 'James understands the practical realities of running a business in regional Tasmania better than any politician I have encountered. His ideas on procurement reform could genuinely benefit local industry if he developed them into proper policy proposals.', authorHandle: '@tas_business_council', createdAt: '2026-02-10', weight: 1 },
    ],
    concerns: [],
    credibility: { experienceScore: 8, achievementScore: 0, communityScore: 8, endorsementScore: 2, reasoningScore: 5, total: 23 },
    supportSummary: {
      totalSupporters: 14,
      volunteerCount: 3,
      skilledContributorCount: 0,
      localBreakdown: [
        { city: 'Launceston', state: 'TAS', count: 9 },
        { city: 'Hobart', state: 'TAS', count: 4 },
        { city: 'Devonport', state: 'TAS', count: 1 },
      ],
      skillBreakdown: {},
    },
  },

  // 7. Leila Hassan — ACT | Technology | Developing | State Level | Rising
  {
    id: 'leader-leila-hassan',
    name: 'Leila Hassan',
    location: 'Braddon, Canberra ACT',
    state: 'ACT',
    field: 'Technology',
    shortBio: 'Tech policy researcher and former software engineer who built Australia\'s first public AI ethics framework and advises government agencies on digital rights.',
    fullBio: 'Leila Hassan spent seven years as a software engineer before completing a Masters in Technology Policy at ANU. She led the team that developed Australia\'s first public AI Ethics Framework, now formally adopted by the Digital Transformation Agency. She has since co-founded the Australian Centre for Digital Rights, which provides policy research and public education on surveillance, algorithmic decision-making, and data governance. Leila currently serves on the ACT Legislative Assembly\'s Technology Advisory Committee and is widely tipped as a future candidate for the ACT Assembly or Senate. She has appeared before four Senate committees.',
    avatarInitials: 'LH',
    readiness: 'Developing',
    currentPathwayStage: 'State Level',
    pathwayHistory: ['Community Contributor'],
    isRising: true,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2025-11-28',
    tags: ['technology', 'AI', 'digital rights', 'ACT', 'policy'],
    linkedIssueAreas: ['Economy', 'Education'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-leila-hassan',
      nominatorHandle: '@digital_rights_watch',
      justification: 'Leila Hassan is the most credible technology policy voice of her generation in Australia. She has the technical background to understand what she is regulating and the policy skills to translate that understanding into actionable legislation. Her AI Ethics Framework is already shaping government practice. Australia needs legislators who can govern technology from a position of genuine expertise — Leila is that person.',
      evidence: [
        {
          category: 'experience',
          description: 'Seven years as software engineer; Masters in Technology Policy (ANU); member of ACT Legislative Assembly Technology Advisory Committee; appearances before four Senate committees.',
          verifiable: true,
        },
        {
          category: 'achievement',
          description: 'Led development of Australia\'s first public AI Ethics Framework, formally adopted by the Digital Transformation Agency in 2024.',
          verifiable: true,
          sourceUrl: 'https://www.dta.gov.au',
        },
        {
          category: 'community',
          description: 'Co-founded Australian Centre for Digital Rights; runs free public education workshops on digital privacy attended by 800+ people annually.',
          verifiable: false,
        },
      ],
      nominatedAt: '2025-11-28',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-lh-1', leaderId: 'leader-leila-hassan', type: 'endorse', reason: 'I commissioned Leila\'s team to develop the AI Ethics Framework for the DTA. She managed a complex multi-stakeholder process with exceptional skill — keeping industry, civil society, and government in productive tension rather than letting any one group dominate. The result is a framework that has real credibility across the spectrum.', authorHandle: '@dta_policy_lead', authorCredential: 'Digital Transformation Agency', createdAt: '2025-12-05', weight: 2 },
      { id: 'end-lh-2', leaderId: 'leader-leila-hassan', type: 'endorse', reason: 'Leila has testified before our committee twice on AI regulation. Her evidence is technically precise and policy-practically sound — a combination we rarely see. She can speak to a room of engineers or a room of senators and be equally effective in both.', authorHandle: '@senate_tech_committee', authorCredential: 'Parliamentary Committee Staff', createdAt: '2025-12-10', weight: 2 },
      { id: 'end-lh-3', leaderId: 'leader-leila-hassan', type: 'endorse', reason: 'Attended one of Leila\'s digital privacy workshops in Canberra. As someone with no tech background, I came out actually understanding what my data rights are and why they matter. That ability to make complex issues accessible is essential in a democratic leader.', authorHandle: '@canberra_retiree_civic', createdAt: '2025-12-15', weight: 1 },
      { id: 'end-lh-4', leaderId: 'leader-leila-hassan', type: 'endorse', reason: 'Leila\'s work on algorithmic accountability has directly informed our union\'s approach to AI-assisted HR systems. She provided pro bono advice that helped us negotiate meaningful protections into enterprise agreements. She walks the talk.', authorHandle: '@act_workers_union', authorCredential: 'Union Representative', createdAt: '2026-01-05', weight: 2 },
    ],
    concerns: [],
    credibility: { experienceScore: 16, achievementScore: 19, communityScore: 12, endorsementScore: 8, reasoningScore: 8, total: 63 },
    supportSummary: {
      totalSupporters: 194,
      volunteerCount: 42,
      skilledContributorCount: 16,
      localBreakdown: [
        { city: 'Braddon', state: 'ACT', count: 98 },
        { city: 'Canberra CBD', state: 'ACT', count: 62 },
        { city: 'Gungahlin', state: 'ACT', count: 21 },
      ],
      skillBreakdown: { Technology: 6, Policy: 4, Data: 3, Legal: 2, Operations: 1 },
    },
  },

  // 8. Tomas Rivera — NSW | Infrastructure | Not Ready | Community Contributor | PENDING
  {
    id: 'leader-tomas-rivera',
    name: 'Tomas Rivera',
    location: 'Penrith, Western Sydney NSW',
    state: 'NSW',
    field: 'Infrastructure',
    shortBio: 'Civil engineer and local transport campaigner pushing for improved rail and road infrastructure in Western Sydney.',
    fullBio: 'Tomas Rivera is a civil engineer with ten years of experience in transport infrastructure projects across New South Wales. He has been a vocal critic of the Western Sydney transport funding allocation and runs a community campaign called ConnectWest advocating for equitable infrastructure investment. Tomas is at an early stage politically and needs to build his policy development and coalition-building skills before seeking public office.',
    avatarInitials: 'TR',
    readiness: 'Not Ready',
    currentPathwayStage: 'Community Contributor',
    pathwayHistory: [],
    isRising: false,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2026-02-20',
    tags: ['infrastructure', 'transport', 'NSW', 'western sydney'],
    linkedIssueAreas: ['Infrastructure', 'Transport'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-tomas-rivera',
      nominatorHandle: '@connectwest_campaign',
      justification: 'Tomas has genuine technical expertise in infrastructure and a clear passion for Western Sydney equity. He needs more experience in policy development and stakeholder engagement before seeking public office, but his foundation is solid and he is committed to the pathway.',
      evidence: [
        {
          category: 'experience',
          description: 'Ten years as civil engineer on NSW transport infrastructure projects; founder of ConnectWest community campaign.',
          verifiable: true,
        },
        {
          category: 'community',
          description: 'Runs ConnectWest, a Western Sydney transport advocacy group with 1,200 members.',
          verifiable: false,
        },
      ],
      nominatedAt: '2026-02-20',
      consentGiven: false,  // Pending consent
      moderationStatus: 'pending',
    },
    endorsements: [],
    concerns: [],
    credibility: { experienceScore: 8, achievementScore: 0, communityScore: 8, endorsementScore: 0, reasoningScore: 5, total: 21 },
    supportSummary: {
      totalSupporters: 19,
      volunteerCount: 3,
      skilledContributorCount: 0,
      localBreakdown: [
        { city: 'Penrith', state: 'NSW', count: 11 },
        { city: 'Blacktown', state: 'NSW', count: 6 },
        { city: 'Parramatta', state: 'NSW', count: 2 },
      ],
      skillBreakdown: {},
    },
  },

  // 9. Ngaire Thompson — VIC | Social Services | Developing | Local Council
  {
    id: 'leader-ngaire-thompson',
    name: 'Ngaire Thompson',
    location: 'Footscray, Melbourne VIC',
    state: 'VIC',
    field: 'Social Services',
    shortBio: 'Social worker and family violence sector leader who successfully campaigned for reform of Victoria\'s family violence response framework.',
    fullBio: 'Ngaire Thompson has worked in the family violence sector for sixteen years, most recently as CEO of the Western Domestic Violence Network. Under her leadership, the network secured a major state government funding increase and developed an integrated response model now operating across 12 councils in Melbourne\'s west. She was a key community voice during the Royal Commission into Family Violence and her recommendations formed the basis of three reforms in the final report. Ngaire was elected to Maribyrnong City Council in 2023. She is a New Zealand-born Australian citizen and holds a Bachelor of Social Work from La Trobe.',
    avatarInitials: 'NT',
    readiness: 'Developing',
    currentPathwayStage: 'Local Council',
    pathwayHistory: ['Community Contributor'],
    isRising: false,
    isTrending: false,
    isControversial: true,  // Some controversy around her criticism of state government response timelines
    nominatedAt: '2025-10-15',
    tags: ['social services', 'family violence', 'VIC', 'women'],
    linkedIssueAreas: ['Social Services', 'Healthcare'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-ngaire-thompson',
      nominatorHandle: '@safe_steps_vic',
      justification: 'Ngaire Thompson has spent sixteen years building the expertise and the relationships needed to drive genuine reform in Australia\'s family violence response system. Her work is evidence-based, outcomes-focused, and — critically — she has already changed policy through the Royal Commission process. She is ready for state parliament and the sector strongly supports her progression.',
      evidence: [
        {
          category: 'experience',
          description: 'CEO of Western Domestic Violence Network for 6 years; 16 years in the family violence sector; elected Maribyrnong City Councillor (2023).',
          verifiable: true,
        },
        {
          category: 'achievement',
          description: 'Secured major state government funding increase for the network; three of her Royal Commission recommendations became enacted reforms.',
          verifiable: true,
          sourceUrl: 'https://www.vic.gov.au/family-violence-reforms',
        },
        {
          category: 'community',
          description: 'Mentors emerging workers in the family violence sector through a structured 12-month program with 8 current participants.',
          verifiable: false,
        },
      ],
      nominatedAt: '2025-10-15',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-nt-1', leaderId: 'leader-ngaire-thompson', type: 'endorse', reason: 'Ngaire\'s testimony to the Royal Commission was the most impactful survivor-sector evidence we received. She translated sixteen years of frontline knowledge into specific, implementable recommendations. Three of them became law. That is not advocacy — that is governance.', authorHandle: '@fv_royal_commission_staff', authorCredential: 'Royal Commission Staff', createdAt: '2025-11-01', weight: 2 },
      { id: 'end-nt-2', leaderId: 'leader-ngaire-thompson', type: 'endorse', reason: 'Ngaire led the crisis response coordination during the COVID-19 period for our network. She made decisions quickly, communicated clearly, and kept vulnerable families from falling through the cracks during an extremely difficult period. Crisis leadership under real pressure.', authorHandle: '@cohealth_melb', authorCredential: 'Community Health Organisation', createdAt: '2025-11-10', weight: 2 },
      { id: 'end-nt-3', leaderId: 'leader-ngaire-thompson', type: 'endorse', reason: 'As a survivor who engaged with Ngaire\'s network, I want to say that she has built an organisation where I felt safe, heard, and supported. That human quality — real empathy combined with practical help — is exactly what leadership should look like.', authorHandle: '@anonymous_survivor_001', createdAt: '2025-11-20', weight: 1 },
    ],
    concerns: [
      { id: 'con-nt-1', leaderId: 'leader-ngaire-thompson', type: 'concern', reason: 'Ngaire\'s public criticism of the state government\'s reform implementation timeline, while justified, was unnecessarily combative in tone and created friction that delayed cooperation on two funding applications. Effective leaders need to choose when to apply pressure and when to maintain relationships. This is a gap she should address before seeking higher office.', authorHandle: '@vic_social_sector_observer', authorCredential: 'Social Policy Analyst', createdAt: '2025-12-01', weight: 1 },
      { id: 'con-nt-2', leaderId: 'leader-ngaire-thompson', type: 'concern', reason: 'I respect Ngaire\'s work deeply, but I am concerned that her focus has been primarily on the Melbourne metropolitan area. Before seeking state or federal office, she should demonstrate sustained engagement with regional and rural family violence services, where the challenges and solutions are quite different.', authorHandle: '@rural_womens_resource', createdAt: '2025-12-10', weight: 1 },
    ],
    credibility: { experienceScore: 22, achievementScore: 22, communityScore: 14, endorsementScore: 4, reasoningScore: 8, total: 70 },
    supportSummary: {
      totalSupporters: 103,
      volunteerCount: 21,
      skilledContributorCount: 6,
      localBreakdown: [
        { city: 'Footscray', state: 'VIC', count: 48 },
        { city: 'Fitzroy', state: 'VIC', count: 34 },
        { city: 'Richmond', state: 'VIC', count: 14 },
      ],
      skillBreakdown: { Communications: 2, Policy: 2, Operations: 1 },
    },
  },

  // 10. Ben Cartwright — QLD | Foreign Policy | Ready | State Level | Rising
  {
    id: 'leader-ben-cartwright',
    name: 'Ben Cartwright',
    location: 'New Farm, Brisbane QLD',
    state: 'QLD',
    field: 'Foreign Policy',
    shortBio: 'Former diplomat and international trade lawyer who negotiated three bilateral trade agreements and now leads a think tank on Indo-Pacific security and economic policy.',
    fullBio: 'Ben Cartwright spent fourteen years in the Department of Foreign Affairs and Trade, including postings to Jakarta, Tokyo, and Geneva. He was part of the negotiating team for three bilateral trade agreements and led the Australian delegation to two APEC working groups. After leaving DFAT, he co-founded the Brisbane Institute for Indo-Pacific Studies, a non-partisan think tank whose research is cited by government and opposition foreign policy teams alike. Ben holds a Bachelor of Economics and Law (Hons) from UQ and a Masters in International Relations from Oxford. He is a member of the Queensland ALP and is being actively recruited for a Senate candidacy.',
    avatarInitials: 'BC',
    readiness: 'Ready',
    currentPathwayStage: 'State Level',
    pathwayHistory: ['Community Contributor', 'Local Council'],
    isRising: true,
    isTrending: false,
    isControversial: false,
    nominatedAt: '2025-08-12',
    tags: ['foreign policy', 'trade', 'QLD', 'Indo-Pacific', 'diplomacy'],
    linkedIssueAreas: ['Economy', 'Security'],
    linkedDecisions: [],
    nomination: {
      id: 'nom-ben-cartwright',
      nominatorHandle: '@indo_pacific_studies',
      justification: 'Ben Cartwright brings fourteen years of professional diplomatic experience to a political system that desperately needs it. He has negotiated real agreements, managed real relationships, and navigated real geopolitical complexity. His think tank has produced the most consistently cited Indo-Pacific research of any Australian institution over the past three years. He is not a theorist — he is a practitioner who has learned to translate practice into policy for public consumption.',
      evidence: [
        {
          category: 'experience',
          description: '14 years at DFAT including postings to Jakarta, Tokyo, and Geneva; led Australian delegation at two APEC working groups; co-founder and Director of Brisbane Institute for Indo-Pacific Studies.',
          verifiable: true,
          sourceUrl: 'https://www.dfat.gov.au',
        },
        {
          category: 'achievement',
          description: 'Part of the negotiating team for three bilateral trade agreements; Brisbane Institute research cited in government and opposition foreign policy policy statements.',
          verifiable: true,
        },
        {
          category: 'community',
          description: 'Hosts a free public lecture series on Indo-Pacific affairs attended by 200+ people per session; mentors early-career diplomats through the DFAT graduate program.',
          verifiable: false,
        },
      ],
      nominatedAt: '2025-08-12',
      consentGiven: true,
      moderationStatus: 'approved',
    },
    endorsements: [
      { id: 'end-bc-1', leaderId: 'leader-ben-cartwright', type: 'endorse', reason: 'I worked with Ben at DFAT during the Tokyo posting. His ability to manage complex multi-party negotiations — keeping all parties at the table without compromising Australia\'s core interests — is exceptional. Parliament would benefit enormously from that kind of professional experience.', authorHandle: '@former_dfat_diplomat', authorCredential: 'Former Senior Diplomat', createdAt: '2025-09-01', weight: 2 },
      { id: 'end-bc-2', leaderId: 'leader-ben-cartwright', type: 'endorse', reason: 'The Brisbane Institute\'s work on Indo-Pacific economic architecture has directly informed our industry association\'s export strategy. Ben\'s team produces research that is simultaneously rigorous and actionable — a rare combination. His public lectures are standing-room only.', authorHandle: '@qld_exporters_council', authorCredential: 'Industry Association', createdAt: '2025-09-15', weight: 2 },
      { id: 'end-bc-3', leaderId: 'leader-ben-cartwright', type: 'endorse', reason: 'Attended one of Ben\'s public lectures on Australia-China trade dynamics. He presented a complex issue with intellectual honesty — acknowledging genuine risks and trade-offs rather than delivering a predetermined conclusion. That intellectual integrity is exactly what we need in foreign policy decision-making.', authorHandle: '@brisbane_business_reader', createdAt: '2025-10-01', weight: 1 },
      { id: 'end-bc-4', leaderId: 'leader-ben-cartwright', type: 'endorse', reason: 'Ben mentored me through the DFAT graduate program. He was direct, demanding, and generous with his expertise. He also pushed me to develop my own views rather than simply adopt his. That kind of mentorship reflects a leader who is confident and secure — not threatened by capable people around them.', authorHandle: '@dfat_graduate_2023', createdAt: '2025-10-10', weight: 1 },
      { id: 'end-bc-5', leaderId: 'leader-ben-cartwright', type: 'endorse', reason: 'Ben\'s research on supply chain resilience in the Indo-Pacific was the most useful input we received in developing our national critical minerals strategy. He understands the intersection of economic policy and strategic competition at a level that most Australian politicians simply do not.', authorHandle: '@resources_policy_adviser', authorCredential: 'Federal Policy Adviser', createdAt: '2025-11-01', weight: 2 },
    ],
    concerns: [],
    credibility: { experienceScore: 25, achievementScore: 22, communityScore: 12, endorsementScore: 10, reasoningScore: 8, total: 77 },
    supportSummary: {
      totalSupporters: 267,
      volunteerCount: 58,
      skilledContributorCount: 18,
      localBreakdown: [
        { city: 'Brisbane CBD', state: 'QLD', count: 122 },
        { city: 'New Farm', state: 'QLD', count: 87 },
        { city: 'Toowong', state: 'QLD', count: 43 },
      ],
      skillBreakdown: { Policy: 5, Communications: 4, Legal: 3, Marketing: 3, Data: 2, Operations: 1 },
    },
  },
]

// ─── Derived exports ──────────────────────────────────────────────────────────

export const LEADER_INDEX: Record<string, FutureLeader> =
  Object.fromEntries(LEADERS.map(l => [l.id, l]))

export const RISING_LEADERS = LEADERS
  .filter(l => l.isRising && l.nomination.moderationStatus === 'approved')
  .slice(0, 3)

// ─── Support system ────────────────────────────────────────────────────────────

export const READINESS_THRESHOLDS: Record<PathwayStage, ReadinessThreshold> = {
  'Community Contributor': { stage: 'Community Contributor', localSupporters: 0,   volunteers: 0,   skilledContributors: 0,  credibilityScore: 0  },
  'Local Council':         { stage: 'Local Council',         localSupporters: 50,  volunteers: 10,  skilledContributors: 0,  credibilityScore: 60 },
  'State Level':           { stage: 'State Level',           localSupporters: 200, volunteers: 40,  skilledContributors: 10, credibilityScore: 70 },
  'Federal Level':         { stage: 'Federal Level',         localSupporters: 500, volunteers: 100, skilledContributors: 25, credibilityScore: 80 },
}

export const PATHWAY_CONTENT: Record<string, PathwayToRealPoliticsContent> = {
  'leader-sara-patel': {
    howToGetInvolvedLocally: 'Sara is active in the Inner West community. Attend her monthly housing forum at Marrickville Town Hall, join the Western Sydney Community Land Trust volunteer roster, or follow her policy work via the Community Housing Industry Association.',
    nextStepsToRun: [
      'Register as an NSW Labor, Greens, or independent candidate for the 2027 NSW State Election via the NSW Electoral Commission candidate handbook.',
      'Contact your local party branch secretary to discuss preselection timelines — Inner West branches meet monthly.',
      'Engage with the NSW Electoral Commission: electoralcommission.nsw.gov.au for full candidate requirements and timelines.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-sp-1', title: 'NSW Labor State Pre-selection Opens', body: 'Inner West electorate pre-selection for the 2027 NSW State Election opens for nominations. Party membership required for 12 months prior.', state: 'NSW', closingDate: '2026-09-01' },
      { id: 'opp-sp-2', title: 'Greens NSW Candidate Expression of Interest', body: 'The Greens NSW are seeking candidates for inner-Sydney electorates ahead of the 2027 state election cycle.', state: 'NSW', closingDate: '2026-07-15' },
    ],
  },
  'leader-marcus-webb': {
    howToGetInvolvedLocally: 'Marcus holds regular community sessions through the Brunswick Renewable Energy Co-op and is active on Moreland City Council. Attend a council meeting, join a co-op volunteer shift, or engage with the Bays and Coasts Alliance to support his environmental policy work.',
    nextStepsToRun: [
      'To advance from Local Council to state parliament, connect with the Victorian Greens or Labor party for preselection timelines in the Northern Metropolitan region.',
      'Engage with the Victorian Electoral Commission for candidate requirements: vec.vic.gov.au.',
      'Build deeper regional support beyond inner Melbourne — consider outreach to Gippsland and Ballarat communities on climate transition issues.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-mw-1', title: 'Victorian Greens Upper House Pre-selection', body: 'Greens Victoria are conducting pre-selection for Northern Metropolitan Region candidates for the 2026 state cycle.', state: 'VIC', closingDate: '2026-10-01' },
      { id: 'opp-mw-2', title: 'Moreland Council Leadership Roles', body: 'Opportunities for committee chair and Deputy Mayor roles opening in the current Moreland council term — strengthening local government track record.', state: 'VIC', closingDate: '2026-08-30' },
    ],
  },
  'leader-anika-johansson': {
    howToGetInvolvedLocally: 'Anika runs the Queensland Rural Health Equity Network and participates in Brisbane City Council\'s Health Advisory Panel. Attend public health forums, volunteer with Street Medicine Brisbane, or contribute to her rural health equity submissions to Queensland Health.',
    nextStepsToRun: [
      'Build state-level profile through additional Queensland Health advisory committee appointments and media engagement on rural health equity.',
      'Contact Queensland Labor, LNP, or Greens branches about preselection pathways for the 2028 Queensland State Election.',
      'Engage with the Electoral Commission of Queensland: ecq.qld.gov.au for candidate registration requirements.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-aj-1', title: 'QLD Health Community Advisory Vacancies', body: 'Queensland Health is seeking community members for regional health advisory committees — an opportunity to build formal advisory credentials.', state: 'QLD', closingDate: '2026-06-30' },
      { id: 'opp-aj-2', title: 'ALP Queensland State Preselection (2028 cycle)', body: 'Queensland Labor branch preselection for the 2028 state election cycle begins in late 2026 for inner-Brisbane seats.', state: 'QLD', closingDate: '2026-12-01' },
    ],
  },
  'leader-dion-murray': {
    howToGetInvolvedLocally: 'Dion works through the Wadjuk First Nations Legal Centre in Fremantle and is involved in WA\'s treaty consultation process. Attend community consultations on the First Nations Treaty Pathway, support the legal centre, or engage with the National Indigenous Australians Agency consultation process.',
    nextStepsToRun: [
      'Engage with the Western Australian Electoral Commission for information on standing for state parliament: elections.wa.gov.au.',
      'Build profile within the WA treaty consultation process and through national Indigenous policy forums.',
      'Explore pathways through the National Indigenous Australians Agency advisory panel toward federal policy influence.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-dm-1', title: 'WA First Nations Treaty Community Consultation Roles', body: 'The WA Government\'s First Nations Treaty Pathway is seeking additional community representatives for regional consultation panels.', state: 'WA', closingDate: '2026-08-01' },
      { id: 'opp-dm-2', title: 'National Indigenous Australians Agency Advisory Panel', body: 'New advisory panel positions opening for First Nations leaders with legal and policy backgrounds.', state: 'WA', closingDate: '2026-09-15' },
    ],
  },
  'leader-priya-krishnan': {
    howToGetInvolvedLocally: 'Priya advises the federal Education Department and is based in Adelaide. Engage with her work through the Federal Education Advisory Council, support the South Australian Teacher Pathways program she mentors through, or attend public education policy forums in Adelaide.',
    nextStepsToRun: [
      'Formally register interest with SA Labor or the Greens SA for Senate preselection — the next Senate election is expected at the 2025–28 cycle.',
      'Engage with the Australian Electoral Commission for Senate candidate requirements: aec.gov.au.',
      'Develop a public Senate platform drawing on her federal Education Advisory Council work and national curriculum review contributions.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-pk-1', title: 'SA Labor Senate Pre-selection', body: 'South Australian Labor is conducting internal pre-selection consultation for the next federal election Senate ticket. Applications open to party members.', state: 'SA', closingDate: '2026-11-01' },
      { id: 'opp-pk-2', title: 'Greens SA Senate Candidate EOI', body: 'The Greens SA are seeking expressions of interest from candidates for the federal Senate from South Australia.', state: 'SA', closingDate: '2026-08-15' },
    ],
  },
  'leader-james-obrien': {
    howToGetInvolvedLocally: 'James is active in the Launceston business community through the Launceston Chamber of Commerce. Attend Chamber of Commerce events, read his regional economics blog, or engage with local government economic development forums in Launceston.',
    nextStepsToRun: [
      'Develop formal policy credentials beyond the Chamber of Commerce — consider applied economics study or formal engagement with Tasmanian government advisory bodies.',
      'Engage with the Tasmanian Electoral Commission for candidate requirements: tec.tas.gov.au.',
      'Build cross-sector relationships beyond the business community into regional social services and environmental stakeholders.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-jo-1', title: 'Launceston City Council Advisory Committees', body: 'Launceston City Council is accepting nominations for Economic Development Advisory Committee — a pathway to building formal governance credentials.', state: 'TAS', closingDate: '2026-07-01' },
      { id: 'opp-jo-2', title: 'Tasmanian Business Council Policy Working Groups', body: 'The Tasmanian Business Council is forming new working groups on regional economic development and infrastructure policy.', state: 'TAS', closingDate: '2026-06-15' },
    ],
  },
  'leader-leila-hassan': {
    howToGetInvolvedLocally: 'Leila works through the Australian Centre for Digital Rights in Braddon and serves on the ACT Legislative Assembly\'s Technology Advisory Committee. Attend Digital Rights public forums, support the Centre\'s research work, or engage with the ACT Assembly\'s technology consultations.',
    nextStepsToRun: [
      'Register interest with the ACT Greens or Labor for ACT Legislative Assembly preselection — the next ACT election is scheduled for October 2028.',
      'Alternatively, engage with major parties for Senate candidacy from the ACT at the next federal election.',
      'Engage with the Australian Electoral Commission for ACT Senate candidate requirements: aec.gov.au.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-lh-1', title: 'ACT Greens Legislative Assembly Pre-selection', body: 'ACT Greens are conducting candidate pre-selection for the 2028 ACT Legislative Assembly election. Technology and digital rights expertise strongly valued.', state: 'ACT', closingDate: '2027-03-01' },
      { id: 'opp-lh-2', title: 'AEC Digital Rights Advisory Consultation', body: 'The Australian Electoral Commission is seeking submissions on digital rights in the electoral context — an opportunity for public profile building.', state: 'ACT', closingDate: '2026-08-31' },
    ],
  },
  'leader-tomas-rivera': {
    howToGetInvolvedLocally: 'Tomas is active in Penrith community groups focused on Western Sydney infrastructure. Engage with local government infrastructure consultations, attend Western Sydney Infrastructure Alliance forums, or connect with Greater Sydney Commission community engagement sessions.',
    nextStepsToRun: [
      'Build formal policy credentials through engagement with infrastructure advisory bodies at local and state level in NSW.',
      'Engage with the NSW Electoral Commission for council or state candidacy requirements: electoralcommission.nsw.gov.au.',
      'Develop a specific policy platform on Western Sydney transport and housing infrastructure before seeking public office.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-tr-1', title: 'Penrith City Council Community Consultations', body: 'Penrith City Council is conducting community consultations on the 2026–2030 infrastructure investment strategy — an opportunity to contribute formally.', state: 'NSW', closingDate: '2026-05-30' },
      { id: 'opp-tr-2', title: 'Greater Sydney Commission Community Reference Group', body: 'The Greater Sydney Commission is forming a Western Parkland City Community Reference Group focused on transport and infrastructure planning.', state: 'NSW', closingDate: '2026-07-15' },
    ],
  },
  'leader-ngaire-thompson': {
    howToGetInvolvedLocally: 'Ngaire is active through Maribyrnong City Council and the Western Domestic Violence Network in Footscray. Attend council meetings, support the Network\'s integrated response model, or engage with Maribyrnong community forums on social services reform.',
    nextStepsToRun: [
      'Build on Maribyrnong council experience toward a Victorian state parliament run — explore Labor or Greens preselection for the Western Metropolitan Region.',
      'Engage with the Victorian Electoral Commission for state candidate requirements: vec.vic.gov.au.',
      'Leverage Royal Commission into Family Violence connections to build statewide profile on social services reform.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-nt-1', title: 'Victorian Labor Western Metro Preselection', body: 'Victorian Labor is conducting internal preselection for Western Metropolitan Region candidates for the 2026 state election cycle.', state: 'VIC', closingDate: '2026-09-30' },
      { id: 'opp-nt-2', title: 'Maribyrnong Deputy Mayor Nomination', body: 'Maribyrnong City Council Deputy Mayor nomination period opens — strengthening formal local government leadership credentials.', state: 'VIC', closingDate: '2026-06-01' },
    ],
  },
  'leader-ben-cartwright': {
    howToGetInvolvedLocally: 'Ben leads the Brisbane Institute for Indo-Pacific Studies in New Farm and publishes regular foreign policy analysis. Attend institute events, engage with his public policy research, or contribute to submissions on Indo-Pacific foreign policy through the institute.',
    nextStepsToRun: [
      'Engage with Queensland Labor or Liberal-National Party for Senate preselection — Ben\'s foreign policy background fits the Senate\'s treaty and international relations committee work.',
      'Register with the Australian Electoral Commission for Senate candidate requirements: aec.gov.au.',
      'Build a public communications profile translating foreign policy expertise into accessible civic language for a broader Queensland audience.',
    ],
    upcomingNominationOpportunities: [
      { id: 'opp-bc-1', title: 'Queensland LNP Senate Pre-selection', body: 'The LNP Queensland is conducting Senate candidate pre-selection for the next federal election. Foreign policy and trade expertise valued.', state: 'QLD', closingDate: '2026-10-15' },
      { id: 'opp-bc-2', title: 'ALP Queensland Senate Preselection Consultation', body: 'Queensland Labor is beginning internal consultations for Senate candidates with expertise in foreign affairs and trade policy.', state: 'QLD', closingDate: '2026-11-30' },
    ],
  },
}

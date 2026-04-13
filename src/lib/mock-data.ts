import { MP, Issue, Vote } from '@/types'

export const PARTY_COLORS: Record<string, string> = {
  'Labor':                        '#E53935',
  'Coalition':                    '#1565C0',
  'Greens':                       '#2E7D32',
  'Independent':                  '#EC407A',
  'Centre Alliance':              '#F9A825',
  "Katter's Australian Party":   '#4E342E',
  'One Nation':                   '#FF6F00',
}

// ─── 150-seat layout ──────────────────────────────────────────────────────────
// Order: Labor (0–93) | Greens (94) | Independent (95–104) | CA (105) | KAP (106) | One Nation (107) | Coalition (108–149)
export const SEAT_LAYOUT: Array<{ party: string; mpId: string }> = [
  // Labor: 94
  ...Array.from({ length: 94 },  (_, i) => ({ party: 'Labor',                        mpId: `mp-labor-${i + 1}` })),
  // Greens: 1
  { party: 'Greens',              mpId: 'mp-greens-1' },
  // Independents: 10
  ...Array.from({ length: 10 },  (_, i) => ({ party: 'Independent',                  mpId: `mp-ind-${i + 1}` })),
  // Centre Alliance: 1
  { party: 'Centre Alliance',     mpId: 'mp-ca-1' },
  // Katter's: 1
  { party: "Katter's Australian Party", mpId: 'mp-kap-1' },
  // One Nation: 1
  { party: 'One Nation',          mpId: 'mp-onenat-1' },
  // Coalition: 42
  ...Array.from({ length: 42 },  (_, i) => ({ party: 'Coalition',                    mpId: `mp-coalition-${i + 1}` })),
]

// ─── MPs ─────────────────────────────────────────────────────────────────────
// Source: Members of the Australian House of Representatives, 2025–2028 (48th Parliament)
export const MPs: MP[] = [
  // ── Labor (94) ──────────────────────────────────────────────────────────────
  { id: 'mp-labor-1',  name: 'Basem Abdo',           party: 'Labor', electorate: 'Calwell',         seatIndex: 0,  stickeeScore: 0 },
  { id: 'mp-labor-2',  name: 'Anthony Albanese',      party: 'Labor', electorate: 'Grayndler',       seatIndex: 1,  stickeeScore: 0 },
  { id: 'mp-labor-3',  name: 'Anne Aly',              party: 'Labor', electorate: 'Cowan',           seatIndex: 2,  stickeeScore: 0 },
  { id: 'mp-labor-4',  name: 'Ash Ambihaipahar',      party: 'Labor', electorate: 'Barton',          seatIndex: 3,  stickeeScore: 0 },
  { id: 'mp-labor-5',  name: 'Jodie Belyea',          party: 'Labor', electorate: 'Dunkley',         seatIndex: 4,  stickeeScore: 0 },
  { id: 'mp-labor-6',  name: 'Carol Berry',           party: 'Labor', electorate: 'Whitlam',         seatIndex: 5,  stickeeScore: 0 },
  { id: 'mp-labor-7',  name: 'Chris Bowen',           party: 'Labor', electorate: 'McMahon',         seatIndex: 6,  stickeeScore: 0 },
  { id: 'mp-labor-8',  name: 'Jo Briskey',            party: 'Labor', electorate: 'Maribyrnong',     seatIndex: 7,  stickeeScore: 0 },
  { id: 'mp-labor-9',  name: 'Tony Burke',            party: 'Labor', electorate: 'Watson',          seatIndex: 8,  stickeeScore: 0 },
  { id: 'mp-labor-10', name: 'Matt Burnell',          party: 'Labor', electorate: 'Spence',          seatIndex: 9,  stickeeScore: 0 },
  { id: 'mp-labor-11', name: 'Josh Burns',            party: 'Labor', electorate: 'Macnamara',       seatIndex: 10, stickeeScore: 0 },
  { id: 'mp-labor-12', name: 'Mark Butler',           party: 'Labor', electorate: 'Hindmarsh',       seatIndex: 11, stickeeScore: 0 },
  { id: 'mp-labor-13', name: 'Alison Byrnes',         party: 'Labor', electorate: 'Cunningham',      seatIndex: 12, stickeeScore: 0 },
  { id: 'mp-labor-14', name: 'Julie-Ann Campbell',    party: 'Labor', electorate: 'Moreton',         seatIndex: 13, stickeeScore: 0 },
  { id: 'mp-labor-15', name: 'Jim Chalmers',          party: 'Labor', electorate: 'Rankin',          seatIndex: 14, stickeeScore: 0 },
  { id: 'mp-labor-16', name: 'Andrew Charlton',       party: 'Labor', electorate: 'Parramatta',      seatIndex: 15, stickeeScore: 0 },
  { id: 'mp-labor-17', name: 'Lisa Chesters',         party: 'Labor', electorate: 'Bendigo',         seatIndex: 16, stickeeScore: 0 },
  { id: 'mp-labor-18', name: 'Jason Clare',           party: 'Labor', electorate: 'Blaxland',        seatIndex: 17, stickeeScore: 0 },
  { id: 'mp-labor-19', name: 'Sharon Claydon',        party: 'Labor', electorate: 'Newcastle',       seatIndex: 18, stickeeScore: 0 },
  { id: 'mp-labor-20', name: 'Claire Clutterham',     party: 'Labor', electorate: 'Sturt',           seatIndex: 19, stickeeScore: 0 },
  { id: 'mp-labor-21', name: 'Renee Coffey',          party: 'Labor', electorate: 'Griffith',        seatIndex: 20, stickeeScore: 0 },
  { id: 'mp-labor-22', name: 'Libby Coker',           party: 'Labor', electorate: 'Corangamite',     seatIndex: 21, stickeeScore: 0 },
  { id: 'mp-labor-23', name: 'Julie Collins',         party: 'Labor', electorate: 'Franklin',        seatIndex: 22, stickeeScore: 0 },
  { id: 'mp-labor-24', name: 'Emma Comer',            party: 'Labor', electorate: 'Petrie',          seatIndex: 23, stickeeScore: 0 },
  { id: 'mp-labor-25', name: 'Pat Conroy',            party: 'Labor', electorate: 'Shortland',       seatIndex: 24, stickeeScore: 0 },
  { id: 'mp-labor-26', name: 'Kara Cook',             party: 'Labor', electorate: 'Bonner',          seatIndex: 25, stickeeScore: 0 },
  { id: 'mp-labor-27', name: 'Trish Cook',            party: 'Labor', electorate: 'Bullwinkel',      seatIndex: 26, stickeeScore: 0 },
  { id: 'mp-labor-28', name: 'Milton Dick',           party: 'Labor', electorate: 'Oxley',           seatIndex: 27, stickeeScore: 0 },
  { id: 'mp-labor-29', name: 'Mary Doyle',            party: 'Labor', electorate: 'Aston',           seatIndex: 28, stickeeScore: 0 },
  { id: 'mp-labor-30', name: 'Mark Dreyfus',          party: 'Labor', electorate: 'Isaacs',          seatIndex: 29, stickeeScore: 0 },
  { id: 'mp-labor-31', name: 'Justine Elliot',        party: 'Labor', electorate: 'Richmond',        seatIndex: 30, stickeeScore: 0 },
  { id: 'mp-labor-32', name: 'Cassandra Fernando',    party: 'Labor', electorate: 'Holt',            seatIndex: 31, stickeeScore: 0 },
  { id: 'mp-labor-33', name: 'Ali France',            party: 'Labor', electorate: 'Dickson',         seatIndex: 32, stickeeScore: 0 },
  { id: 'mp-labor-34', name: 'Mike Freelander',       party: 'Labor', electorate: 'Macarthur',       seatIndex: 33, stickeeScore: 0 },
  { id: 'mp-labor-35', name: 'Tom French',            party: 'Labor', electorate: 'Moore',           seatIndex: 34, stickeeScore: 0 },
  { id: 'mp-labor-36', name: 'Carina Garland',        party: 'Labor', electorate: 'Chisholm',        seatIndex: 35, stickeeScore: 0 },
  { id: 'mp-labor-37', name: 'Steve Georganas',       party: 'Labor', electorate: 'Adelaide',        seatIndex: 36, stickeeScore: 0 },
  { id: 'mp-labor-38', name: 'Andrew Giles',          party: 'Labor', electorate: 'Scullin',         seatIndex: 37, stickeeScore: 0 },
  { id: 'mp-labor-39', name: 'Patrick Gorman',        party: 'Labor', electorate: 'Perth',           seatIndex: 38, stickeeScore: 0 },
  { id: 'mp-labor-40', name: 'Luke Gosling',          party: 'Labor', electorate: 'Solomon',         seatIndex: 39, stickeeScore: 0 },
  { id: 'mp-labor-41', name: 'Matt Gregg',            party: 'Labor', electorate: 'Deakin',          seatIndex: 40, stickeeScore: 0 },
  { id: 'mp-labor-42', name: 'Julian Hill',           party: 'Labor', electorate: 'Bruce',           seatIndex: 41, stickeeScore: 0 },
  { id: 'mp-labor-43', name: 'Rowan Holzberger',      party: 'Labor', electorate: 'Forde',           seatIndex: 42, stickeeScore: 0 },
  { id: 'mp-labor-44', name: 'Ed Husic',              party: 'Labor', electorate: 'Chifley',         seatIndex: 43, stickeeScore: 0 },
  { id: 'mp-labor-45', name: 'Madonna Jarrett',       party: 'Labor', electorate: 'Brisbane',        seatIndex: 44, stickeeScore: 0 },
  { id: 'mp-labor-46', name: 'Alice Jordan-Baird',    party: 'Labor', electorate: 'Gorton',          seatIndex: 45, stickeeScore: 0 },
  { id: 'mp-labor-47', name: 'Ged Kearney',           party: 'Labor', electorate: 'Cooper',          seatIndex: 46, stickeeScore: 0 },
  { id: 'mp-labor-48', name: 'Matt Keogh',            party: 'Labor', electorate: 'Burt',            seatIndex: 47, stickeeScore: 0 },
  { id: 'mp-labor-49', name: 'Peter Khalil',          party: 'Labor', electorate: 'Wills',           seatIndex: 48, stickeeScore: 0 },
  { id: 'mp-labor-50', name: 'Catherine King',        party: 'Labor', electorate: 'Ballarat',        seatIndex: 49, stickeeScore: 0 },
  { id: 'mp-labor-51', name: 'Madeleine King',        party: 'Labor', electorate: 'Brand',           seatIndex: 50, stickeeScore: 0 },
  { id: 'mp-labor-52', name: 'Tania Lawrence',        party: 'Labor', electorate: 'Hasluck',         seatIndex: 51, stickeeScore: 0 },
  { id: 'mp-labor-53', name: 'Jerome Laxale',         party: 'Labor', electorate: 'Bennelong',       seatIndex: 52, stickeeScore: 0 },
  { id: 'mp-labor-54', name: 'Andrew Leigh',          party: 'Labor', electorate: 'Fenner',          seatIndex: 53, stickeeScore: 0 },
  { id: 'mp-labor-55', name: 'Sam Lim',               party: 'Labor', electorate: 'Tangney',         seatIndex: 54, stickeeScore: 0 },
  { id: 'mp-labor-56', name: 'Richard Marles',        party: 'Labor', electorate: 'Corio',           seatIndex: 55, stickeeScore: 0 },
  { id: 'mp-labor-57', name: 'Zaneta Mascarenhas',    party: 'Labor', electorate: 'Swan',            seatIndex: 56, stickeeScore: 0 },
  { id: 'mp-labor-58', name: 'Kristy McBain',         party: 'Labor', electorate: 'Eden-Monaro',     seatIndex: 57, stickeeScore: 0 },
  { id: 'mp-labor-59', name: 'Emma McBride',          party: 'Labor', electorate: 'Dobell',          seatIndex: 58, stickeeScore: 0 },
  { id: 'mp-labor-60', name: 'Louise Miller-Frost',   party: 'Labor', electorate: 'Boothby',         seatIndex: 59, stickeeScore: 0 },
  { id: 'mp-labor-61', name: 'Rob Mitchell',          party: 'Labor', electorate: 'McEwen',          seatIndex: 60, stickeeScore: 0 },
  { id: 'mp-labor-62', name: 'David Moncrieff',       party: 'Labor', electorate: 'Hughes',          seatIndex: 61, stickeeScore: 0 },
  { id: 'mp-labor-63', name: 'Daniel Mulino',         party: 'Labor', electorate: 'Fraser',          seatIndex: 62, stickeeScore: 0 },
  { id: 'mp-labor-64', name: 'Shayne Neumann',        party: 'Labor', electorate: 'Blair',           seatIndex: 63, stickeeScore: 0 },
  { id: 'mp-labor-65', name: 'Gabriel Ng',            party: 'Labor', electorate: 'Menzies',         seatIndex: 64, stickeeScore: 0 },
  { id: 'mp-labor-66', name: "Clare O'Neil",          party: 'Labor', electorate: 'Hotham',          seatIndex: 65, stickeeScore: 0 },
  { id: 'mp-labor-67', name: 'Alicia Payne',          party: 'Labor', electorate: 'Canberra',        seatIndex: 66, stickeeScore: 0 },
  { id: 'mp-labor-68', name: 'Fiona Phillips',        party: 'Labor', electorate: 'Gilmore',         seatIndex: 67, stickeeScore: 0 },
  { id: 'mp-labor-69', name: 'Tanya Plibersek',       party: 'Labor', electorate: 'Sydney',          seatIndex: 68, stickeeScore: 0 },
  { id: 'mp-labor-70', name: 'Sam Rae',               party: 'Labor', electorate: 'Hawke',           seatIndex: 69, stickeeScore: 0 },
  { id: 'mp-labor-71', name: 'Gordon Reid',           party: 'Labor', electorate: 'Robertson',       seatIndex: 70, stickeeScore: 0 },
  { id: 'mp-labor-72', name: 'Dan Repacholi',         party: 'Labor', electorate: 'Hunter',          seatIndex: 71, stickeeScore: 0 },
  { id: 'mp-labor-73', name: 'Amanda Rishworth',      party: 'Labor', electorate: 'Kingston',        seatIndex: 72, stickeeScore: 0 },
  { id: 'mp-labor-74', name: 'Tracey Roberts',        party: 'Labor', electorate: 'Pearce',          seatIndex: 73, stickeeScore: 0 },
  { id: 'mp-labor-75', name: 'Michelle Rowland',      party: 'Labor', electorate: 'Greenway',        seatIndex: 74, stickeeScore: 0 },
  { id: 'mp-labor-76', name: 'Joanne Ryan',           party: 'Labor', electorate: 'Lalor',           seatIndex: 75, stickeeScore: 0 },
  { id: 'mp-labor-77', name: 'Marion Scrymgour',      party: 'Labor', electorate: 'Lingiari',        seatIndex: 76, stickeeScore: 0 },
  { id: 'mp-labor-78', name: 'Sally Sitou',           party: 'Labor', electorate: 'Reid',            seatIndex: 77, stickeeScore: 0 },
  { id: 'mp-labor-79', name: 'David Smith',           party: 'Labor', electorate: 'Bean',            seatIndex: 78, stickeeScore: 0 },
  { id: 'mp-labor-80', name: 'Matt Smith',            party: 'Labor', electorate: 'Leichhardt',      seatIndex: 79, stickeeScore: 0 },
  { id: 'mp-labor-81', name: 'Zhi Soon',              party: 'Labor', electorate: 'Banks',           seatIndex: 80, stickeeScore: 0 },
  { id: 'mp-labor-82', name: 'Anne Stanley',          party: 'Labor', electorate: 'Werriwa',         seatIndex: 81, stickeeScore: 0 },
  { id: 'mp-labor-83', name: 'Meryl Swanson',         party: 'Labor', electorate: 'Paterson',        seatIndex: 82, stickeeScore: 0 },
  { id: 'mp-labor-84', name: 'Jess Teesdale',         party: 'Labor', electorate: 'Bass',            seatIndex: 83, stickeeScore: 0 },
  { id: 'mp-labor-85', name: 'Susan Templeman',       party: 'Labor', electorate: 'Macquarie',       seatIndex: 84, stickeeScore: 0 },
  { id: 'mp-labor-86', name: 'Matt Thistlethwaite',   party: 'Labor', electorate: 'Kingsford Smith', seatIndex: 85, stickeeScore: 0 },
  { id: 'mp-labor-87', name: 'Kate Thwaites',         party: 'Labor', electorate: 'Jagajaga',        seatIndex: 86, stickeeScore: 0 },
  { id: 'mp-labor-88', name: 'Anne Urquhart',         party: 'Labor', electorate: 'Braddon',         seatIndex: 87, stickeeScore: 0 },
  { id: 'mp-labor-89', name: 'Tim Watts',             party: 'Labor', electorate: 'Gellibrand',      seatIndex: 88, stickeeScore: 0 },
  { id: 'mp-labor-90', name: 'Anika Wells',           party: 'Labor', electorate: 'Lilley',          seatIndex: 89, stickeeScore: 0 },
  { id: 'mp-labor-91', name: 'Rebecca White',         party: 'Labor', electorate: 'Lyons',           seatIndex: 90, stickeeScore: 0 },
  { id: 'mp-labor-92', name: 'Josh Wilson',           party: 'Labor', electorate: 'Fremantle',       seatIndex: 91, stickeeScore: 0 },
  { id: 'mp-labor-93', name: 'Sarah Witty',           party: 'Labor', electorate: 'Melbourne',       seatIndex: 92, stickeeScore: 0 },
  { id: 'mp-labor-94', name: 'Tony Zappia',           party: 'Labor', electorate: 'Makin',           seatIndex: 93, stickeeScore: 0 },

  // ── Greens (1) ──────────────────────────────────────────────────────────────
  { id: 'mp-greens-1', name: 'Elizabeth Watson-Brown', party: 'Greens', electorate: 'Ryan', seatIndex: 94, stickeeScore: 0 },

  // ── Independents (10) ───────────────────────────────────────────────────────
  { id: 'mp-ind-1',  name: 'Nicolette Boele',   party: 'Independent', electorate: 'Bradfield', seatIndex: 95,  stickeeScore: 0 },
  { id: 'mp-ind-2',  name: 'Kate Chaney',        party: 'Independent', electorate: 'Curtin',    seatIndex: 96,  stickeeScore: 0 },
  { id: 'mp-ind-3',  name: 'Andrew Gee',         party: 'Independent', electorate: 'Calare',    seatIndex: 97,  stickeeScore: 0 },
  { id: 'mp-ind-4',  name: 'Helen Haines',       party: 'Independent', electorate: 'Indi',      seatIndex: 98,  stickeeScore: 0 },
  { id: 'mp-ind-5',  name: 'Dai Le',             party: 'Independent', electorate: 'Fowler',    seatIndex: 99,  stickeeScore: 0 },
  { id: 'mp-ind-6',  name: 'Monique Ryan',       party: 'Independent', electorate: 'Kooyong',   seatIndex: 100, stickeeScore: 0 },
  { id: 'mp-ind-7',  name: 'Sophie Scamps',      party: 'Independent', electorate: 'Mackellar', seatIndex: 101, stickeeScore: 0 },
  { id: 'mp-ind-8',  name: 'Allegra Spender',    party: 'Independent', electorate: 'Wentworth', seatIndex: 102, stickeeScore: 0 },
  { id: 'mp-ind-9',  name: 'Zali Steggall',      party: 'Independent', electorate: 'Warringah', seatIndex: 103, stickeeScore: 0 },
  { id: 'mp-ind-10', name: 'Andrew Wilkie',      party: 'Independent', electorate: 'Clark',     seatIndex: 104, stickeeScore: 0 },

  // ── Centre Alliance (1) ─────────────────────────────────────────────────────
  { id: 'mp-ca-1', name: 'Rebekha Sharkie', party: 'Centre Alliance', electorate: 'Mayo', seatIndex: 105, stickeeScore: 0 },

  // ── Katter's Australian Party (1) ───────────────────────────────────────────
  { id: 'mp-kap-1', name: 'Bob Katter', party: "Katter's Australian Party", electorate: 'Kennedy', seatIndex: 106, stickeeScore: 0 },

  // ── One Nation (1) ──────────────────────────────────────────────────────────
  { id: 'mp-onenat-1', name: 'Barnaby Joyce', party: 'One Nation', electorate: 'New England', seatIndex: 107, stickeeScore: 0 },

  // ── Coalition: National (14) + Liberal (28) = 42 ────────────────────────────
  { id: 'mp-coalition-1',  name: 'Mary Aldred',         party: 'Coalition', electorate: 'Monash',      seatIndex: 108, stickeeScore: 0 },
  { id: 'mp-coalition-2',  name: 'David Batt',           party: 'Coalition', electorate: 'Hinkler',     seatIndex: 109, stickeeScore: 0 },
  { id: 'mp-coalition-3',  name: 'Angie Bell',           party: 'Coalition', electorate: 'Moncrieff',   seatIndex: 110, stickeeScore: 0 },
  { id: 'mp-coalition-4',  name: 'Sam Birrell',          party: 'Coalition', electorate: 'Nicholls',    seatIndex: 111, stickeeScore: 0 },
  { id: 'mp-coalition-5',  name: 'Colin Boyce',          party: 'Coalition', electorate: 'Flynn',       seatIndex: 112, stickeeScore: 0 },
  { id: 'mp-coalition-6',  name: 'Scott Buchholz',       party: 'Coalition', electorate: 'Wright',      seatIndex: 113, stickeeScore: 0 },
  { id: 'mp-coalition-7',  name: 'Cameron Caldwell',     party: 'Coalition', electorate: 'Fadden',      seatIndex: 114, stickeeScore: 0 },
  { id: 'mp-coalition-8',  name: 'Jamie Chaffey',        party: 'Coalition', electorate: 'Parkes',      seatIndex: 115, stickeeScore: 0 },
  { id: 'mp-coalition-9',  name: 'Darren Chester',       party: 'Coalition', electorate: 'Gippsland',   seatIndex: 116, stickeeScore: 0 },
  { id: 'mp-coalition-10', name: 'Pat Conaghan',         party: 'Coalition', electorate: 'Cowper',      seatIndex: 117, stickeeScore: 0 },
  { id: 'mp-coalition-11', name: 'Garth Hamilton',       party: 'Coalition', electorate: 'Groom',       seatIndex: 118, stickeeScore: 0 },
  { id: 'mp-coalition-12', name: 'Andrew Hastie',        party: 'Coalition', electorate: 'Canning',     seatIndex: 119, stickeeScore: 0 },
  { id: 'mp-coalition-13', name: 'Alex Hawke',           party: 'Coalition', electorate: 'Mitchell',    seatIndex: 120, stickeeScore: 0 },
  { id: 'mp-coalition-14', name: 'Kevin Hogan',          party: 'Coalition', electorate: 'Page',        seatIndex: 121, stickeeScore: 0 },
  { id: 'mp-coalition-15', name: 'Simon Kennedy',        party: 'Coalition', electorate: 'Cook',        seatIndex: 122, stickeeScore: 0 },
  { id: 'mp-coalition-16', name: 'Michelle Landry',      party: 'Coalition', electorate: 'Capricornia', seatIndex: 123, stickeeScore: 0 },
  { id: 'mp-coalition-17', name: 'Julian Leeser',        party: 'Coalition', electorate: 'Berowra',     seatIndex: 124, stickeeScore: 0 },
  { id: 'mp-coalition-18', name: 'Sussan Ley',           party: 'Coalition', electorate: 'Farrer',      seatIndex: 125, stickeeScore: 0 },
  { id: 'mp-coalition-19', name: 'David Littleproud',    party: 'Coalition', electorate: 'Maranoa',     seatIndex: 126, stickeeScore: 0 },
  { id: 'mp-coalition-20', name: 'Melissa McIntosh',     party: 'Coalition', electorate: 'Lindsay',     seatIndex: 127, stickeeScore: 0 },
  { id: 'mp-coalition-21', name: 'Zoe McKenzie',         party: 'Coalition', electorate: 'Flinders',    seatIndex: 128, stickeeScore: 0 },
  { id: 'mp-coalition-22', name: 'Michael McCormack',    party: 'Coalition', electorate: 'Riverina',    seatIndex: 129, stickeeScore: 0 },
  { id: 'mp-coalition-23', name: "Llew O'Brien",         party: 'Coalition', electorate: 'Wide Bay',    seatIndex: 130, stickeeScore: 0 },
  { id: 'mp-coalition-24', name: "Ted O'Brien",          party: 'Coalition', electorate: 'Fairfax',     seatIndex: 131, stickeeScore: 0 },
  { id: 'mp-coalition-25', name: 'Tony Pasin',           party: 'Coalition', electorate: 'Barker',      seatIndex: 132, stickeeScore: 0 },
  { id: 'mp-coalition-26', name: 'Alison Penfold',       party: 'Coalition', electorate: 'Lyne',        seatIndex: 133, stickeeScore: 0 },
  { id: 'mp-coalition-27', name: 'Henry Pike',           party: 'Coalition', electorate: 'Bowman',      seatIndex: 134, stickeeScore: 0 },
  { id: 'mp-coalition-28', name: 'Melissa Price',        party: 'Coalition', electorate: 'Durack',      seatIndex: 135, stickeeScore: 0 },
  { id: 'mp-coalition-29', name: 'Leon Rebello',         party: 'Coalition', electorate: 'McPherson',   seatIndex: 136, stickeeScore: 0 },
  { id: 'mp-coalition-30', name: 'Ben Small',            party: 'Coalition', electorate: 'Forrest',     seatIndex: 137, stickeeScore: 0 },
  { id: 'mp-coalition-31', name: 'Angus Taylor',         party: 'Coalition', electorate: 'Hume',        seatIndex: 138, stickeeScore: 0 },
  { id: 'mp-coalition-32', name: 'Dan Tehan',            party: 'Coalition', electorate: 'Wannon',      seatIndex: 139, stickeeScore: 0 },
  { id: 'mp-coalition-33', name: 'Phillip Thompson',     party: 'Coalition', electorate: 'Herbert',     seatIndex: 140, stickeeScore: 0 },
  { id: 'mp-coalition-34', name: 'Tom Venning',          party: 'Coalition', electorate: 'Grey',        seatIndex: 141, stickeeScore: 0 },
  { id: 'mp-coalition-35', name: 'Aaron Violi',          party: 'Coalition', electorate: 'Casey',       seatIndex: 142, stickeeScore: 0 },
  { id: 'mp-coalition-36', name: 'Andrew Wallace',       party: 'Coalition', electorate: 'Fisher',      seatIndex: 143, stickeeScore: 0 },
  { id: 'mp-coalition-37', name: 'Anne Webster',         party: 'Coalition', electorate: 'Mallee',      seatIndex: 144, stickeeScore: 0 },
  { id: 'mp-coalition-38', name: 'Andrew Willcox',       party: 'Coalition', electorate: 'Dawson',      seatIndex: 145, stickeeScore: 0 },
  { id: 'mp-coalition-39', name: 'Rick Wilson',          party: 'Coalition', electorate: "O'Connor",    seatIndex: 146, stickeeScore: 0 },
  { id: 'mp-coalition-40', name: 'Tim Wilson',           party: 'Coalition', electorate: 'Goldstein',   seatIndex: 147, stickeeScore: 0 },
  { id: 'mp-coalition-41', name: 'Jason Wood',           party: 'Coalition', electorate: 'La Trobe',    seatIndex: 148, stickeeScore: 0 },
  { id: 'mp-coalition-42', name: 'Terry Young',          party: 'Coalition', electorate: 'Longman',     seatIndex: 149, stickeeScore: 0 },
]

export const MPIndex: Record<string, MP> = Object.fromEntries(MPs.map(mp => [mp.id, mp]))

export const issues: Issue[] = [
  {
    id: 'housing-affordability',
    title: 'Housing Affordability Crisis',
    summary: 'The government is debating new measures to make homes more affordable for first-time buyers.',
    content: 'Australia is facing a significant housing affordability crisis, with median home prices far exceeding what most working Australians can afford.',
    whatIsHappening: 'Parliament is considering a Help to Buy scheme where the government co-purchases up to 40% of a home with eligible buyers, reducing the deposit needed. It also includes tax incentives for investors who build new homes.',
    whoSupports: 'Labor and the Greens support the scheme, though the Greens want stronger renter protections added. Several Teal independents are supportive with conditions.',
    whoOpposes: 'The Coalition argues the scheme will push prices up further by increasing demand without addressing supply. They advocate for different tax reforms instead.',
    status: 'active',
  },
  {
    id: 'climate-safeguard',
    title: 'Climate Safeguard Mechanism',
    summary: "New rules would force Australia's biggest polluters to cut their emissions every year.",
    content: 'The Safeguard Mechanism sets limits on how much carbon big industrial facilities can emit. Under proposed reforms, these limits would tighten annually.',
    whatIsHappening: "The government wants to update the rules so that Australia's 215 biggest industrial polluters — like mines and gas plants — must reduce their emissions by 4.9% each year, or buy credits to offset their pollution.",
    whoSupports: 'Labor introduced the reforms. The Greens backed it after securing amendments to prevent new coal and gas projects from receiving too many free credits.',
    whoOpposes: "The Coalition and some resources industry groups say it will increase energy costs and damage mining jobs. Some economists also question whether it's cost-effective.",
    status: 'passed',
  },
  {
    id: 'ndis-reform',
    title: 'NDIS Reform',
    summary: 'Changes to the National Disability Insurance Scheme aim to control costs and improve support quality.',
    content: 'The NDIS provides funding to Australians with significant disabilities. With costs projected to triple, the government is proposing structural reforms.',
    whatIsHappening: 'The government wants to tighten eligibility, cap some funding categories, and shift some services to a new "foundational supports" system. This would affect hundreds of thousands of participants.',
    whoSupports: 'Labor says the changes are necessary to keep the scheme sustainable. They have support from the Greens on some aspects, particularly around improving independent assessments.',
    whoOpposes: 'Disability advocacy groups and some Coalition members argue cuts will leave vulnerable people without vital support. There is concern about rushed implementation.',
    status: 'active',
  },
  {
    id: 'tax-cuts',
    title: 'Stage 3 Tax Cuts (Modified)',
    summary: 'The government redesigned planned tax cuts to give more relief to lower and middle income earners.',
    content: 'Originally legislated to give the biggest cuts to high earners, Labor redesigned Stage 3 to spread benefits more evenly.',
    whatIsHappening: 'Instead of cutting the 37% tax rate and lifting the top threshold, the revised cuts reduce the 19% rate to 16% and the 32.5% rate to 30%, giving more back to workers earning under $120,000.',
    whoSupports: 'Labor argues this is fairer and provides more stimulus during the cost-of-living crisis. Most economists agree lower earners benefit more under the revision.',
    whoOpposes: 'The Coalition accused Labor of breaking an election promise by changing the original design. High-income earners receive less under the revised scheme.',
    status: 'passed',
  },
  {
    id: 'misinformation-bill',
    title: 'Misinformation & Disinformation Bill',
    summary: 'A proposed law would give a regulator power to fine social media platforms for hosting harmful misinformation.',
    content: 'The Australian Communications and Media Authority (ACMA) would gain new powers to combat online misinformation under proposed legislation.',
    whatIsHappening: 'The bill would require social media platforms to have systems to combat serious misinformation and disinformation. ACMA could fine platforms up to 5% of global revenue for non-compliance. The bill excludes satire and professional news.',
    whoSupports: 'Labor says unchecked misinformation is a genuine threat to democracy and public health. Some academic and civil society groups support better accountability for platforms.',
    whoOpposes: 'The Coalition, Greens, and many media groups argue the bill is a threat to free speech and could give government too much power over public debate. The Greens are concerned about vague definitions.',
    status: 'active',
  },
]

export const issueIndex: Record<string, Issue> = Object.fromEntries(issues.map(i => [i.id, i]))

const PARTY_VOTE_MAP: Record<string, Record<string, Vote['vote']>> = {
  'housing-affordability': {
    'Labor': 'yes', 'Greens': 'yes', 'Independent': 'yes',
    'Centre Alliance': 'yes', "Katter's Australian Party": 'no', 'Coalition': 'no', 'One Nation': 'no',
  },
  'climate-safeguard': {
    'Labor': 'yes', 'Greens': 'yes', 'Independent': 'yes',
    'Centre Alliance': 'yes', "Katter's Australian Party": 'no', 'Coalition': 'no', 'One Nation': 'no',
  },
  'ndis-reform': {
    'Labor': 'yes', 'Greens': 'abstain', 'Independent': 'yes',
    'Centre Alliance': 'yes', "Katter's Australian Party": 'no', 'Coalition': 'no', 'One Nation': 'no',
  },
  'tax-cuts': {
    'Labor': 'yes', 'Greens': 'yes', 'Independent': 'yes',
    'Centre Alliance': 'yes', "Katter's Australian Party": 'no', 'Coalition': 'no', 'One Nation': 'no',
  },
  'misinformation-bill': {
    'Labor': 'yes', 'Greens': 'no', 'Independent': 'no',
    'Centre Alliance': 'abstain', "Katter's Australian Party": 'no', 'Coalition': 'no', 'One Nation': 'no',
  },
}

export const votes: Vote[] = MPs.flatMap(mp =>
  issues.map(issue => ({
    mpId: mp.id,
    issueId: issue.id,
    vote: PARTY_VOTE_MAP[issue.id]?.[mp.party] ?? 'abstain',
  }))
)

export function getVotesForIssue(issueId: string) {
  return votes.filter(v => v.issueId === issueId)
}

export function getVotesForMP(mpId: string) {
  return votes.filter(v => v.mpId === mpId)
}

export function getVoteSummary(issueId: string) {
  const issueVotes = getVotesForIssue(issueId)
  return {
    yes:     issueVotes.filter(v => v.vote === 'yes').length,
    no:      issueVotes.filter(v => v.vote === 'no').length,
    abstain: issueVotes.filter(v => v.vote === 'abstain').length,
  }
}

export function calculateStickeeScore(mpId: string): number {
  const mpVotes = getVotesForMP(mpId).filter(v => v.vote !== 'abstain')
  if (mpVotes.length === 0) return 50

  let withMajority = 0
  for (const v of mpVotes) {
    const summary = getVoteSummary(v.issueId)
    const majority = summary.yes > summary.no ? 'yes' : summary.no > summary.yes ? 'no' : null
    if (majority && v.vote === majority) withMajority++
  }

  return Math.round((withMajority / mpVotes.length) * 100)
}

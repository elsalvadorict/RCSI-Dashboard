/**
 * El Salvador Division — Official School List
 * --------------------------------------------
 * 24 schools (elementary, integrated, and national high school)
 * with their official DepEd School ID numbers.
 *
 * Sourced from the Division's official master list.
 * Used to populate the school dropdown in the Research Metadata form,
 * the Quarterly Survey form, and as a reference throughout the app.
 */

export interface ElSalvadorSchool {
  id: number;       // Official DepEd School ID (e.g., 127667)
  name: string;     // Full official school name (e.g., "Amoros Elementary School")
  level: 'Elementary' | 'Integrated' | 'National High School';
}

export const EL_SALVADOR_SCHOOLS: ElSalvadorSchool[] = [
  // ── Elementary Schools ──
  { id: 127667, name: 'Amoros Elementary School', level: 'Elementary' },
  { id: 137220, name: 'Badiangon Elementary School', level: 'Elementary' },
  { id: 127668, name: 'Bolisong Elementary School', level: 'Elementary' },
  { id: 127670, name: 'Cogon Elementary School', level: 'Elementary' },
  { id: 127671, name: 'El Salvador City Central School', level: 'Elementary' },
  { id: 127672, name: 'Himaya Elementary School', level: 'Elementary' },
  { id: 127673, name: 'Hinigdaan Elementary School', level: 'Elementary' },
  { id: 127675, name: 'Kibonbon Elementary School', level: 'Elementary' },
  { id: 127676, name: 'Molugan Central School', level: 'Elementary' },
  { id: 127677, name: 'Pedro Sa Baculio Elementary School', level: 'Elementary' },
  { id: 127678, name: 'Sambulawan Elementary School', level: 'Elementary' },
  { id: 127669, name: 'San Francisco de Asis Elementary School', level: 'Elementary' },
  { id: 127679, name: 'Sinaloc Elementary School', level: 'Elementary' },
  { id: 127680, name: 'Taytay Elementary School', level: 'Elementary' },
  { id: 127681, name: 'Ulaliman Elementary School', level: 'Elementary' },

  // ── National High Schools ──
  { id: 304065, name: 'Cogon National High School', level: 'National High School' },
  { id: 304787, name: 'El Salvador City National High School', level: 'National High School' },
  { id: 304768, name: 'Himaya National High School', level: 'National High School' },
  { id: 315318, name: 'Hinigdaan National High School', level: 'National High School' },
  { id: 315305, name: 'Molugan National High School', level: 'National High School' },
  { id: 305683, name: 'Sambulawan National High School', level: 'National High School' },
  { id: 325701, name: 'San Francisco de Asis National High School', level: 'National High School' },
  { id: 304797, name: 'Sinaloc National High School', level: 'National High School' },

  // ── Integrated Schools ──
  { id: 501927, name: 'Kalabaylabay Integrated School', level: 'Integrated' },
];

/**
 * Look up a school by its official ID.
 */
export function findSchoolById(id: number): ElSalvadorSchool | undefined {
  return EL_SALVADOR_SCHOOLS.find(s => s.id === id);
}

/**
 * Look up a school by name (case-insensitive, partial match).
 */
export function findSchoolByName(name: string): ElSalvadorSchool | undefined {
  const lower = name.toLowerCase().trim();
  if (!lower) return undefined;
  return EL_SALVADOR_SCHOOLS.find(s => s.name.toLowerCase() === lower)
    ?? EL_SALVADOR_SCHOOLS.find(s => s.name.toLowerCase().includes(lower))
    ?? EL_SALVADOR_SCHOOLS.find(s => lower.includes(s.name.toLowerCase()));
}

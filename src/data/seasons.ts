/**
 * Season content for /seasons-and-conditions/.
 *
 * Fact policy: no numeric temperatures, visibility ranges or fixed
 * season dates are published without a confirmed source. Everything
 * below is deliberately qualitative ("typical pattern") until Meregrupp
 * confirms figures — see docs/content-and-facts.md. When confirmed data
 * is added, extend entries with { source, lastReviewed, status } fields.
 */

export interface Season {
  id: string;
  name: string;
  months: string;
  summary: string;
  typicalPattern: string[];
  planning: string;
}

export const SEASONS: Season[] = [
  {
    id: 'spring',
    name: 'Spring',
    months: 'March – May',
    summary: 'The water is still cold from winter while daylight returns fast. A season for well-prepared divers and for planning the year ahead.',
    typicalPattern: [
      'Cold water early in the season, warming slowly as weeks pass.',
      'Ice may still limit access to some open-water sites early on.',
      'Daylight grows quickly — late spring evenings are long and bright.',
      'Thicker exposure protection is normally needed than in summer.',
    ],
    planning: 'A good season to train fundamentals and to plan a summer or autumn trip. Confirm site access and conditions close to your dates.',
  },
  {
    id: 'summer',
    name: 'Summer',
    months: 'June – August',
    summary: 'The most forgiving season for visiting freedivers: the mildest water of the year and very long days.',
    typicalPattern: [
      'The warmest open water of the year, though it remains a northern, cool-water environment.',
      'Very long daylight around midsummer — flexible session times.',
      'The busiest period for guided dives, so dates fill earlier.',
      'Weather can still change quickly; wind affects open-water plans.',
    ],
    planning: 'The easiest first visit. If Rummu is your goal, this is when most guided slots run — plan ahead and confirm suitability early.',
  },
  {
    id: 'autumn',
    name: 'Autumn',
    months: 'September – November',
    summary: 'Water cools while conditions stay diveable for prepared divers. Quieter sites, shorter days, more variable weather.',
    typicalPattern: [
      'Water cools steadily from late summer onward.',
      'Fewer visitors — a calmer experience at popular sites.',
      'Daylight shortens noticeably; sessions move earlier in the day.',
      'Wind and rain fronts pass through more often.',
    ],
    planning: 'Good for experienced cold-water divers and for pool-focused training blocks. Keep travel plans flexible around weather.',
  },
  {
    id: 'winter',
    name: 'Winter',
    months: 'December – February',
    summary: 'Estonia keeps training through winter — the team trains in open water year-round. Winter open water is serious cold-water diving with the right gear, the right people and honest go/no-go decisions.',
    typicalPattern: [
      'Cold water and air; ice can form and change site access.',
      'Short daylight — sessions sit in a narrow midday window.',
      'Pool training carries more of the weekly rhythm.',
      'Open-water sessions run only when conditions allow.',
    ],
    planning: 'Not the season for a first freediving trip. For experienced divers curious about real cold-water practice, contact the team well in advance.',
  },
];

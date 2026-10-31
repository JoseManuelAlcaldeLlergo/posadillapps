import { categoryForRoute, groupByCategory, type Category } from '../ui/categories';

const item = (id: string, category: Category) => ({ id, category });

describe('groupByCategory', () => {
  it('orders groups by category with settings last, regardless of input order', () => {
    const groups = groupByCategory([
      item('backup', 'settings'),
      item('cleaning', 'hygiene'),
      item('feed', 'feed'),
      item('vehicles', 'biosecurity'),
    ]);
    expect(groups.map((group) => group.title)).toEqual([
      'Alimentación',
      'Bioseguridad',
      'Higiene',
      'Configuración',
    ]);
  });

  it('keeps the original order inside each group', () => {
    const groups = groupByCategory([
      item('vehicle-entries', 'biosecurity'),
      item('hygiene', 'hygiene'),
      item('vehicle-cleaning', 'biosecurity'),
    ]);
    expect(groups[0].data.map((entry) => entry.id)).toEqual(['vehicle-entries', 'vehicle-cleaning']);
  });

  it('leaves out empty categories', () => {
    const groups = groupByCategory([item('backup', 'settings')]);
    expect(groups.map((group) => group.category)).toEqual(['settings']);
  });
});

describe('categoryForRoute', () => {
  const entries = [
    { route: '/feed-entries', category: 'feed' },
    { route: '/vehicle-entries', category: 'biosecurity' },
    { route: '/backup', category: 'settings' },
  ] as const;

  it('finds the category of a module main screen', () => {
    expect(categoryForRoute('feed-entries/index', entries)).toBe('feed');
  });

  it('finds the category of nested screens', () => {
    expect(categoryForRoute('feed-entries/[id]', entries)).toBe('feed');
    expect(categoryForRoute('feed-entries/suppliers/index', entries)).toBe('feed');
    expect(categoryForRoute('vehicle-entries/visits/new', entries)).toBe('biosecurity');
  });

  it('finds single-file screens such as the backup', () => {
    expect(categoryForRoute('backup', entries)).toBe('settings');
  });

  it('returns null for the home screen and unknown routes', () => {
    expect(categoryForRoute('index', entries)).toBeNull();
    expect(categoryForRoute('+not-found', entries)).toBeNull();
  });

  it('matches whole segments, not prefixes', () => {
    expect(categoryForRoute('feed-entries-old/index', entries)).toBeNull();
  });

  it('accepts routes given as objects', () => {
    expect(categoryForRoute('backup', [{ route: { pathname: '/backup' }, category: 'settings' }])).toBe(
      'settings',
    );
  });
});

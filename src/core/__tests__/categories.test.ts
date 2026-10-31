import { groupByCategory, type Category } from '../ui/categories';

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

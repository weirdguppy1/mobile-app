import { countWords } from '@/shared/utils/count-words';

describe('countWords', () => {
  it('is 0 for an empty or whitespace-only string', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('\n\t  ')).toBe(0);
  });

  it('counts a single word', () => {
    expect(countWords('hi')).toBe(1);
  });

  it('collapses runs of whitespace and ignores leading/trailing spaces', () => {
    expect(countWords(' a  b   c ')).toBe(3);
    expect(countWords('one\ntwo\tthree')).toBe(3);
  });
});

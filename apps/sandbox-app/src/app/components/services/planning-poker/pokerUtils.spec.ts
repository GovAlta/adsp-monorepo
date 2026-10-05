import {
  buildParticipantRows,
  buildSessionPath,
  countVotesByCard,
  describeRoundResult,
  extractSessionId,
  formatCard,
  isSafeStoryUrl,
  loadSavedNickname,
  saveNickname,
} from './pokerUtils';

const SESSION_ID = '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43';
const ALICE_ID = 'a1111111-1111-1111-1111-111111111111';
const BOB_ID = 'b2222222-2222-2222-2222-222222222222';
const revealedRound = { roundId: 'r1', storyTitle: 'ADSP-123 Login page', status: 'revealed' as const };

describe('pokerUtils', () => {
  test('shows the coffee card as a coffee cup', () => {
    // Arrange
    const card = 'coffee';

    // Act
    const label = formatCard(card);

    // Assert
    expect(label).toBe('☕');
  });

  test('shows point cards as their number', () => {
    // Arrange
    const card = '13';

    // Act
    const label = formatCard(card);

    // Assert
    expect(label).toBe('13');
  });

  test('builds the board path for a session', () => {
    // Arrange
    const tenantName = 'autotest';

    // Act
    const path = buildSessionPath(tenantName, SESSION_ID);

    // Assert
    expect(path).toBe(`/autotest/services/planning-poker/${SESSION_ID}`);
  });

  test('extracts the session ID from a pasted session link', () => {
    // Arrange
    const link = `https://sandbox.adsp-uat.alberta.ca/autotest/services/planning-poker/${SESSION_ID.toUpperCase()}`;

    // Act
    const sessionId = extractSessionId(link);

    // Assert
    expect(sessionId).toBe(SESSION_ID);
  });

  test('returns null when the input has no session ID', () => {
    // Arrange
    const input = 'sprint 42 planning';

    // Act
    const sessionId = extractSessionId(input);

    // Assert
    expect(sessionId).toBeNull();
  });

  test.each(['https://jira.gov.ab.ca/browse/ADSP-123', 'http://localhost:4200/story'])(
    'treats %s as a safe story link',
    (url) => {
      // Arrange & Act
      const result = isSafeStoryUrl(url);

      // Assert
      expect(result).toBe(true);
    },
  );

  // eslint-disable-next-line no-script-url -- verifies a script URL is never treated as a story link
  test.each(['javascript:alert(document.cookie)', '', undefined])('does not link %s', (url) => {
    // Arrange & Act
    const result = isSafeStoryUrl(url);

    // Assert
    expect(result).toBe(false);
  });

  test('describes a round with consensus', () => {
    // Arrange
    const round = { ...revealedRound, average: 5, hasAverage: true, consensus: true };

    // Act
    const description = describeRoundResult(round);

    // Assert
    expect(description).toBe('Average 5 · Consensus');
  });

  test('describes a round with only non-numeric votes', () => {
    // Arrange
    const round = { ...revealedRound, average: 0, hasAverage: false, consensus: false };

    // Act
    const description = describeRoundResult(round);

    // Assert
    expect(description).toBe('No numeric votes');
  });

  test('counts revealed votes per card in deck order', () => {
    // Arrange
    const votes = {
      [ALICE_ID]: { userName: 'Alice Smith', vote: '8' },
      [BOB_ID]: { userName: 'Bob Jones', vote: '3' },
      c3333333: { userName: 'Cara Lee', vote: '8' },
    };

    // Act
    const counts = countVotesByCard(votes);

    // Assert
    expect(counts).toEqual([
      { card: '3', count: 1 },
      { card: '8', count: 2 },
    ]);
  });

  test('does not count votes that are still hidden', () => {
    // Arrange
    const votes = { [ALICE_ID]: { userName: 'Alice Smith' } };

    // Act
    const counts = countVotesByCard(votes);

    // Assert
    expect(counts).toEqual([]);
  });

  test('includes voters who are not yet in the participant list, sorted by name', () => {
    // Arrange
    const participants = { [BOB_ID]: { userName: 'Bob Jones' } };
    const votes = { [ALICE_ID]: { userName: 'Alice Smith' } };

    // Act
    const rows = buildParticipantRows(participants, votes);

    // Assert
    expect(rows).toEqual([
      { userId: ALICE_ID, userName: 'Alice Smith', hasVoted: true, vote: undefined },
      { userId: BOB_ID, userName: 'Bob Jones', hasVoted: false, vote: undefined },
    ]);
  });

  test('shows the latest nickname from the participant list over the name recorded with a vote', () => {
    // Arrange
    const participants = { [ALICE_ID]: { userName: 'Captain Estimate' } };
    const votes = { [ALICE_ID]: { userName: 'Alice Smith' } };

    // Act
    const rows = buildParticipantRows(participants, votes);

    // Assert
    expect(rows[0].userName).toBe('Captain Estimate');
  });

  describe('saved nickname', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('returns an empty nickname when none is saved', () => {
      // Arrange & Act
      const nickname = loadSavedNickname();

      // Assert
      expect(nickname).toBe('');
    });

    test('returns the nickname saved earlier without surrounding spaces', () => {
      // Arrange
      saveNickname('  Captain Estimate ');

      // Act
      const nickname = loadSavedNickname();

      // Assert
      expect(nickname).toBe('Captain Estimate');
    });

    test('forgets the nickname when a blank one is saved', () => {
      // Arrange
      saveNickname('Captain Estimate');

      // Act
      saveNickname('  ');

      // Assert
      expect(loadSavedNickname()).toBe('');
    });

    test('returns an empty nickname when browser storage is unavailable', () => {
      // Arrange
      jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('SecurityError: storage is disabled');
      });

      // Act
      const nickname = loadSavedNickname();

      // Assert
      expect(nickname).toBe('');
    });
  });
});

import { InvalidOperationError } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { fromDateAndTimeIds, toDateId, toTimeId } from './utils';

const zone = 'America/Edmonton';
describe('utils', () => {
  describe('fromDateAndTimeIds', () => {
    it('can convert ids to datetime', () => {
      const result = fromDateAndTimeIds(20200130, 1330, 'America/Edmonton');
      expect(result.year).toBe(2020);
      expect(result.month).toBe(1);
      expect(result.day).toBe(30);
      expect(result.hour).toBe(13);
      expect(result.minute).toBe(30);

      // Offset for MST expected.
      expect(result.offset).toBe(-420);
    });

    it('can default null time id', () => {
      const result = fromDateAndTimeIds(20200130, null);
      expect(result.year).toBe(2020);
      expect(result.month).toBe(1);
      expect(result.day).toBe(30);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
    });

    it('can return null for null date id', () => {
      const result = fromDateAndTimeIds(null, 1330);
      expect(result).toBeNull();
    });

    // There seems to be specific handling to treat 24 as 0 of next day in luxon.
    it('can return result for hour 24', () => {
      const result = fromDateAndTimeIds(20200130, 2400);
      expect(result.day).toBe(31);
      expect(result.hour).toBe(0);
    });

    // Database has only in range IDs, so this utility doesn't specifically handle out of range.
    it('can return invalid result for out of range date id', () => {
      const result = fromDateAndTimeIds(20200132, 1330);
      expect(result.isValid).toBe(false);
    });

    it('can return invalid result for out of range time id', () => {
      const result = fromDateAndTimeIds(20200130, 2401);
      expect(result.isValid).toBe(false);
    });
  });

  describe('toDateId', () => {
    it('can convert to date id', () => {
      const value = DateTime.local(2020, 1, 30, 13, 30, { zone });
      const result = toDateId(value, zone);
      expect(result).toBe(20200130);
    });

    it('can return null for null value', () => {
      const value = null;
      const result = toDateId(value, zone);
      expect(result).toBeNull();
    });

    it('can throw for invalid value', () => {
      const value = DateTime.local(2020, 1, 32, 13, 30, { zone });
      expect(() => toDateId(value, zone)).toThrow(InvalidOperationError);
    });

    it('can convert to zone', () => {
      const value = DateTime.utc(2020, 1, 30, 0, 30);
      const result = toDateId(value, zone);
      expect(result).toBe(20200129);
    });
  });

  describe('toTimeId', () => {
    it('can convert to date id', () => {
      const value = DateTime.local(2020, 1, 30, 13, 30, { zone });
      const result = toTimeId(value, zone);
      expect(result).toBe(1330);
    });

    it('can return null for null value', () => {
      const value = null;
      const result = toTimeId(value, zone);
      expect(result).toBeNull();
    });

    it('can throw for invalid value', () => {
      const value = DateTime.local(2020, 1, 30, 24, 30, { zone });
      expect(() => toTimeId(value, zone)).toThrow(InvalidOperationError);
    });

    it('can convert to zone', () => {
      const value = DateTime.utc(2020, 1, 30, 13, 30);
      const result = toTimeId(value, zone);
      expect(result).toBe(630);
    });
  });
});

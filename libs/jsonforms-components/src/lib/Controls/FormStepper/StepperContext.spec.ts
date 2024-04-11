import { StatusTable, StepInputStatus, getCompletionStatus } from './StepperContext';

const getInputStatus = (
  id: string,
  required: boolean = false,
  value: string | undefined = undefined,
  step: number = 1,
  type: string = 'string'
): StepInputStatus => {
  return { id, value, required, type, step };
};

const field1 = 'field1';
const field2 = 'field2';
const field3 = 'field3';
const field4 = 'field4';

describe('StepperContext', () => {
  describe('CompletionStatus', () => {
    it('can correctly identify an empty form', () => {
      const form: StatusTable = {
        [field1]: getInputStatus(field1),
        [field2]: getInputStatus(field2, true),
        [field3]: getInputStatus(field3),
        [field4]: getInputStatus(field4, true),
      };
      const status = getCompletionStatus(form, 1);
      expect(status).toBe(undefined);
    });

    it('can correctly identify a form with only non-required fields filled', () => {
      const form: StatusTable = {
        [field1]: getInputStatus(field1, false, 'bob'),
        [field2]: getInputStatus(field2, true),
        [field3]: getInputStatus(field3),
        [field4]: getInputStatus(field4, true),
      };
      const status = getCompletionStatus(form, 1);
      expect(status).toBe('incomplete');
    });

    it('can correctly identify a form with all required fields filled', () => {
      const form: StatusTable = {
        [field1]: getInputStatus(field1, false),
        [field2]: getInputStatus(field2, true, 'bob'),
        [field3]: getInputStatus(field3),
        [field4]: getInputStatus(field4, true, 'bing'),
      };
      const status = getCompletionStatus(form, 1);
      expect(status).toBe('complete');
    });

    it('can correctly identify a form with all but one required filled', () => {
      const form: StatusTable = {
        [field1]: getInputStatus(field1, false, 'bob'),
        [field2]: getInputStatus(field2, true),
        [field3]: getInputStatus(field3, false, 'bing'),
        [field4]: getInputStatus(field4, true, 'aimlessly'),
      };
      const status = getCompletionStatus(form, 1);
      expect(status).toBe('incomplete');
    });

    it('can correctly identify status of the specified step', () => {
      const form: StatusTable = {
        [field1]: getInputStatus(field1, false, 'bob', 1),
        [field2]: getInputStatus(field2, true, undefined, 2),
        [field3]: getInputStatus(field3, false, 'bing', 1),
        [field4]: getInputStatus(field4, true, 'aimlessly', 2),
      };
      const status1 = getCompletionStatus(form, 1);
      expect(status1).toBe('complete');
      const status2 = getCompletionStatus(form, 2);
      expect(status2).toBe('incomplete');
    });
  });
});

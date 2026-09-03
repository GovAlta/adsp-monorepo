// clean-code-ignore: RULE-19 — a fixture, exercised through the pages that render it.
// Enough of an application for the review to have something to show and for every page to report a
// status. Kept to the fields the review puts a Change button beside; filling the whole form is not
// the point of either demo.
export const sampleApplication: Record<string, unknown> = {
  whichOfThemApplies: ['Access to condominium documents'],
  disputeAlreadyTakenToCourt: 'No, there are no other applications',
  fillingApplicationOnbehalf: 'No',
  applicantContactDetails: {
    firstName: 'Dana',
    lastName: 'Okafor',
    email: 'dana.okafor@example.com',
    telephone: '780-555-0134',
    applicantPhysicalAddress: {
      addressLine1: '10611 98 Ave NW',
      city: 'Edmonton',
      provinceState: 'Alberta',
      country: 'Canada',
      postalCodeZip: 'T5K 2P7',
    },
  },
  otherPartyDisputeDetails: {
    otherPartyPrimaryFirstName: 'Riley',
    otherPartyPrimaryLastName: 'Chen',
    otherPartyPrimaryCondoCorporationName: 'Condominium Corporation No. 012 3456',
  },
  whenDidIssueHappen: {
    whenWasIssueDate: '2026-04-17',
  },
  describeDispute: {
    disputeDescription: 'The corporation has not provided the approved AGM minutes after three written requests.',
    resultOfApplication: 'An order requiring the corporation to release the requested records.',
  },
  addSupportingDocuments: 'No, not right now',
};

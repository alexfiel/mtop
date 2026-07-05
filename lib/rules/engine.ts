import { Engine, RuleProperties } from 'json-rules-engine';

export const billRules: RuleProperties[] = [
  {
    conditions: {
      all: [
        {
          fact: 'isRenewal',
          operator: 'equal',
          value: true
        }
      ]
    },
    event: {
      type: 'addFee',
      params: {
        feeNames: [
          'mtop - franchise tax renewal',
          'mtop-franchise tax renewal',
          'inspection fee',
          'security seal'
        ]
      }
    }
  },
  {
    conditions: {
      all: [
        {
          fact: 'isRenewal',
          operator: 'equal',
          value: false
        }
      ]
    },
    event: {
      type: 'addFee',
      params: {
        feeNames: [
          'mtop - franchise tax new',
          'mtop-franchise tax new',
          'inspection fee',
          'security fee'
        ]
      }
    }
  }
];

export async function evaluateFranchiseBill(facts: Record<string, any>, availableAccounts: any[]) {
  const engine = new Engine(billRules);
  
  const { events } = await engine.run(facts);
  
  const applicableFees: any[] = [];
  
  events.forEach(event => {
    if (event.type === 'addFee' && event.params?.feeNames) {
      const feeNames = event.params.feeNames as string[];
      
      const matchingAccounts = availableAccounts.filter(acc => {
        const name = acc.account_name.toLowerCase();
        return feeNames.some(feeName => name.includes(feeName.toLowerCase()));
      });
      
      applicableFees.push(...matchingAccounts);
    }
  });
  
  // Deduplicate in case multiple rules add the same fee
  const uniqueFees = Array.from(new Map(applicableFees.map(item => [item.id, item])).values());
  
  return uniqueFees;
}

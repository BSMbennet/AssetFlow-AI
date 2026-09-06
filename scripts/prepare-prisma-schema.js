const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../packages/database/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const replacements = [
  [
    '  invites            UserInvite[]      @relation("InvitedUser")\n  sentInvites        UserInvite[]      @relation("InvitedBy")',
    '  sentInvites        UserInvite[]      @relation("InvitedBy")',
  ],
  [
    '  invitedUser    User      @relation(fields: [invitedBy], references: [id])',
    '  invitedUser    User      @relation("InvitedBy", fields: [invitedBy], references: [id])',
  ],
  [
    '  sellerTrades       Trade[]           @relation("TradeSeller")',
    '  sellerTrades       Trade[]           @relation("TradeSeller")\n  complianceCases    ComplianceCase[]\n  positions          Position[]\n  apiKeys            ApiKey[]',
  ],
  [
    '  complianceCases   ComplianceCase[]\n  settingsConfig    OrganizationSetting[]',
    '  complianceCases   ComplianceCase[]\n  regulatoryReports  RegulatoryReport[]\n  settingsConfig    OrganizationSetting[]',
  ],
  [
    '  investmentMemos  InvestmentMemo[]',
    '  investmentMemos  InvestmentMemo[]\n  positions         Position[]',
  ],
];

for (const [from, to] of replacements) {
  if (!schema.includes(from)) throw new Error(`Expected Prisma schema text was not found: ${from}`);
  schema = schema.replace(from, to);
}

schema = schema
  .replace('buyer            User     @relation(fields: [buyerId], references: [id])', 'buyer            User     @relation("TradeBuyer", fields: [buyerId], references: [id])')
  .replace('seller           User     @relation(fields: [sellerId], references: [id])', 'seller           User     @relation("TradeSeller", fields: [sellerId], references: [id])');

fs.writeFileSync(schemaPath, schema);
console.log('Prepared Prisma schema relations for Render build.');

# CTK Token Investment Setup

## Overview
The investment functionality allows users to invest their CTK tokens into specific organizations. Tokens are transferred directly to the organization's treasury (owner address), eliminating the need for a centralized treasury configuration.

## Implementation Details

### Smart Contract
- **Contract**: `CTKToken.sol` (ERC20 token)
- **Location**: `/contracts/contracts/CTKToken.sol`
- **Functionality**: Standard ERC20 transfer for investments

### Frontend Integration

#### 1. CTKToken Context (`/client/src/contexts/CTKTokenContext.jsx`)
Provides the following functionality:
- `balance`: User's current CTK token balance
- `invest(amount, treasuryAddress)`: Transfer tokens to specified treasury (organization owner)
- `transfer(to, amount)`: Generic token transfer
- `approve(spender, amount)`: Approve tokens for spending
- `getBalance(address)`: Get balance for any address
- `fetchBalance()`: Refresh current user's balance

#### 2. InvestPage (`/client/src/pages/InvestPage.jsx`)
Features:
- **Organization Selection**: Browse and select organizations to invest in
- Real-time balance display
- Preset investment amounts (100, 500, 1000, 5000, 10000 CTK)
- Balance validation before investment
- Toast notifications for success/error
- Estimated returns calculator (12% APY)
- Investment benefits display

## Environment Setup

### No Environment Variables Required! 🎉

The new system **doesn't require** a `VITE_TREASURY_ADDRESS` environment variable because:
- Each organization has its own treasury (owner address)
- Users select which organization to invest in
- Tokens are sent directly to the selected organization's owner

### Optional Fallback (Legacy Support)

If you want to support a default treasury for non-organization investments:
```env
VITE_TREASURY_ADDRESS=0xYourDefaultTreasuryAddress
```

## How It Works

### Investment Flow:
1. User connects wallet and authenticates
2. System fetches available organizations
3. User selects an organization to invest in
4. User enters investment amount
5. System validates:
   - Wallet is connected
   - User is authenticated
   - Organization is selected
   - User has sufficient CTK balance
6. User clicks "Invest Tokens"
7. Transaction is sent to blockchain (ERC20 transfer)
8. Tokens are transferred from user to **organization's owner address**
9. Balance is refreshed
10. Success notification is shown
11. User is redirected to dashboard

### Transaction Details:
- **Function**: `transfer(organizationOwnerAddress, amount)`
- **Gas**: Standard ERC20 transfer (~50,000 gas)
- **Confirmation**: Waits for 1 block confirmation
- **Recipient**: Organization's owner address (acts as treasury)

## Testing

### Local Testing:
1. Deploy CTKToken contract to local network
2. Mint some tokens to test wallet
3. Set treasury address in `.env`
4. Connect wallet and test investment

### Testnet Testing:
1. Deploy to testnet (Sepolia, Mumbai, etc.)
2. Get testnet tokens from faucet
3. Mint CTK tokens to test wallet
4. Test full investment flow

## Future Enhancements

### Potential Improvements:
1. **Staking Contract**: Instead of simple transfer, use a staking contract that:
   - Locks tokens for a period
   - Distributes rewards automatically
   - Allows withdrawal after lock period

2. **Investment Tiers**: Different APY based on amount/duration
3. **Compound Interest**: Auto-reinvest rewards
4. **NFT Receipts**: Mint NFT as proof of investment
5. **Governance**: Investors get voting power based on stake

## Security Considerations

1. **Treasury Security**: Use a multisig wallet or audited contract
2. **Rate Limiting**: Consider adding cooldown between investments
3. **Maximum Investment**: Set caps to prevent whale manipulation
4. **Emergency Pause**: Implement pause functionality for emergencies

## API Integration

If you want to track investments off-chain:

### Database Schema:
```sql
CREATE TABLE investments (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);
```

### Backend Handler:
Create `/server/handlers/InvestmentHandler.js` to:
- Record investments
- Track returns
- Calculate rewards
- Generate reports

## Troubleshooting

### Common Issues:

1. **"Treasury address not configured"**
   - Solution: Set `VITE_TREASURY_ADDRESS` in `.env`

2. **"Insufficient balance"**
   - Solution: User needs more CTK tokens
   - Check balance with `fetchBalance()`

3. **Transaction fails**
   - Check gas price
   - Verify treasury address is valid
   - Ensure user has enough ETH for gas

4. **Balance not updating**
   - Call `fetchBalance()` after transaction
   - Check if transaction was confirmed

## Contact & Support

For issues or questions:
- Check contract deployment addresses
- Verify environment variables
- Test on testnet first
- Review transaction on block explorer
